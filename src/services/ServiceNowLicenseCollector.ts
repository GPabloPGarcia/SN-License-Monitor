import type { ServiceNowInstance } from "@prisma/client";
import { decryptSecret } from "@/lib/crypto/credentials";
import { calculateDaysToExpire, getWeekReference, parseServiceNowDate } from "@/lib/dates/weeks";
import { calculateUsage, toBoolean, toNumber } from "@/lib/numbers/calculations";
import { calculateRisk } from "@/lib/risk/calculateRisk";
import { firstNonEmpty, getReferenceValue, splitProductCodes } from "@/lib/servicenow/records";
import overviewMock from "@/mocks/servicenow/sn_sub_man_st_subscription_overview.json";
import entitlementMock from "@/mocks/servicenow/subscription_entitlement.json";
import licenseDetailsMock from "@/mocks/servicenow/license_details.json";
import type {
  LicenseDetail,
  ServiceNowListResponse,
  ServiceNowSingleResponse,
  SubscriptionEntitlement,
  SubscriptionOverviewRecord
} from "@/types/servicenow";
import type { NormalizedLicenseSnapshot } from "@/types/snapshots";

type CollectOptions = {
  collectedAt?: Date;
  weekReference?: string;
};

const overviewEndpoint = "/api/now/table/sn_sub_man_st_subscription_overview";
const licenseDetailsEndpoint = "/api/now/table/license_details";
const entitlementEndpoint = "/api/now/table/subscription_entitlement";

export class ServiceNowLicenseCollector {
  private readonly limit = 10000;

  async collectInstance(
    instance: ServiceNowInstance,
    options: CollectOptions = {}
  ): Promise<NormalizedLicenseSnapshot[]> {
    const collectedAt = options.collectedAt ?? new Date();
    const weekReference = options.weekReference ?? getWeekReference(collectedAt);

    const overview = await this.fetchOverview(instance);
    const licenseDetails = await this.fetchLicenseDetails(instance);

    const snapshots: NormalizedLicenseSnapshot[] = [];

    for (const record of overview) {
      const subscriptionSysId = getReferenceValue(record.subscription);
      const entitlement = subscriptionSysId
        ? await this.fetchEntitlement(instance, subscriptionSysId)
        : null;
      const entitlementProductCode = entitlement?.product_code ?? "";
      const productCodes = splitProductCodes(entitlementProductCode);
      const codes = productCodes.length > 0 ? productCodes : ["UNKNOWN"];
      const matchingLicenses = licenseDetails.filter((detail) =>
        splitProductCodes(detail.product_code).some((code) => codes.includes(code))
      );
      const licenses = matchingLicenses.length > 0 ? matchingLicenses : [null];

      for (const licenseDetail of licenses) {
        snapshots.push(
          this.normalizeSnapshot({
            instance,
            collectedAt,
            weekReference,
            overview: record,
            entitlement,
            licenseDetail,
            productCode:
              productCodes[0] ??
              splitProductCodes(licenseDetail?.product_code).at(0) ??
              "UNKNOWN"
          })
        );
      }
    }

    return snapshots;
  }

  async testConnection(instance: ServiceNowInstance) {
    if (this.isMockMode()) {
      return {
        ok: true,
        message: "Modo mock ativo. Conexao simulada com sucesso."
      };
    }

    await this.fetchPaged<SubscriptionOverviewRecord>(instance, overviewEndpoint, 1);
    return {
      ok: true,
      message: "Conexao ServiceNow validada com sucesso."
    };
  }

  private normalizeSnapshot({
    instance,
    collectedAt,
    weekReference,
    overview,
    entitlement,
    licenseDetail,
    productCode
  }: {
    instance: ServiceNowInstance;
    collectedAt: Date;
    weekReference: string;
    overview: SubscriptionOverviewRecord;
    entitlement: SubscriptionEntitlement | null;
    licenseDetail: LicenseDetail | null;
    productCode: string;
  }): NormalizedLicenseSnapshot {
    const overviewUsage = calculateUsage(
      overview.allocated_count,
      overview.purchased_count
    );
    const licenseUsage = calculateUsage(licenseDetail?.allocated, licenseDetail?.count);
    const startDate =
      parseServiceNowDate(licenseDetail?.start_date) ??
      parseServiceNowDate(entitlement?.start_date) ??
      parseServiceNowDate(overview.start_date);
    const endDate =
      parseServiceNowDate(licenseDetail?.end_date) ??
      parseServiceNowDate(entitlement?.end_date) ??
      parseServiceNowDate(overview.end_date);
    const daysToExpire = calculateDaysToExpire(endDate);
    const expired = toBoolean(licenseDetail?.expired) || (daysToExpire ?? 1) < 0;
    const usagePercent = overviewUsage.usagePercent ?? licenseUsage.usagePercent;
    const risk = calculateRisk({
      expired,
      usagePercent,
      daysToExpire
    });

    return {
      clientId: instance.clientId,
      instanceId: instance.id,
      collectedAt,
      weekReference,
      overviewSysId: overview.sys_id ?? "",
      subscriptionSysId: getReferenceValue(overview.subscription),
      entitlementSysId: entitlement?.sys_id ?? "",
      licenseSysId: licenseDetail?.sys_id ?? "",
      productCode,
      licenseName: firstNonEmpty(licenseDetail?.name, entitlement?.name),
      entitlementName: entitlement?.name ?? null,
      meterType: firstNonEmpty(licenseDetail?.meter_type, entitlement?.meter_type),
      unitOfMeter: entitlement?.unit_of_meter ?? null,
      entitlementId: entitlement?.entitlement_id ?? null,
      parentEntitlementId: entitlement?.parent_entitlement_id ?? null,
      purchasedCount: overviewUsage.purchased ?? toNumber(entitlement?.purchased_count),
      allocatedCount: overviewUsage.allocated,
      availableCount: overviewUsage.available,
      usagePercent: overviewUsage.usagePercent,
      overviewStatus: overview.status ?? null,
      overviewSubscriptionType: overview.subscription_type ?? null,
      licenseCount: licenseUsage.purchased,
      licenseAllocated: licenseUsage.allocated,
      licenseAvailable: licenseUsage.available,
      licenseUsagePercent: licenseUsage.usagePercent,
      allocatedStatus: licenseDetail?.allocated_status ?? null,
      licenseType: licenseDetail?.license_type ?? null,
      licenseCategory: licenseDetail?.category ?? null,
      licenseWeight: toNumber(licenseDetail?.license_weight),
      tableCount: toNumber(licenseDetail?.table_count),
      tablesUsed: toNumber(licenseDetail?.tables_used),
      startDate,
      endDate,
      daysToExpire,
      expired,
      displayOnly: toBoolean(licenseDetail?.display_only),
      isCapped: toBoolean(licenseDetail?.is_capped),
      autoSync: toBoolean(licenseDetail?.auto_sync),
      riskLevel: risk.riskLevel,
      riskReason: risk.riskReason,
      rawOverview: overview,
      rawEntitlement: entitlement,
      rawLicenseDetails: licenseDetail
    };
  }

  private async fetchOverview(instance: ServiceNowInstance) {
    if (this.isMockMode()) {
      return overviewMock.result as SubscriptionOverviewRecord[];
    }

    return this.fetchPaged<SubscriptionOverviewRecord>(instance, overviewEndpoint);
  }

  private async fetchLicenseDetails(instance: ServiceNowInstance) {
    if (this.isMockMode()) {
      return licenseDetailsMock.result as LicenseDetail[];
    }

    return this.fetchPaged<LicenseDetail>(instance, licenseDetailsEndpoint);
  }

  private async fetchEntitlement(instance: ServiceNowInstance, sysId: string) {
    if (this.isMockMode()) {
      return (
        (entitlementMock.result as SubscriptionEntitlement[]).find(
          (item) => item.sys_id === sysId
        ) ?? null
      );
    }

    const response = await this.fetchServiceNow<ServiceNowSingleResponse<SubscriptionEntitlement>>(
      instance,
      `${entitlementEndpoint}/${sysId}`
    );
    return response.result ?? null;
  }

  private async fetchPaged<T>(
    instance: ServiceNowInstance,
    endpoint: string,
    limit = this.limit
  ) {
    let offset = 0;
    const records: T[] = [];

    while (true) {
      const response = await this.fetchServiceNow<ServiceNowListResponse<T>>(
        instance,
        endpoint,
        {
          sysparm_limit: String(limit),
          sysparm_offset: String(offset)
        }
      );
      const result = response.result ?? [];
      records.push(...result);

      if (result.length < limit) {
        break;
      }

      offset += limit;
    }

    return records;
  }

  private async fetchServiceNow<T>(
    instance: ServiceNowInstance,
    endpoint: string,
    searchParams: Record<string, string> = {}
  ): Promise<T> {
    const username = instance.username;
    const password = decryptSecret(instance.encryptedPassword);

    if (!username || !password) {
      throw new Error(`Credenciais Basic Auth ausentes para ${instance.name}.`);
    }

    const url = new URL(endpoint, instance.baseUrl.endsWith("/")
      ? instance.baseUrl
      : `${instance.baseUrl}/`);

    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      Number(process.env.SERVICE_NOW_TIMEOUT_MS ?? 30000)
    );

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
          Accept: "application/json"
        },
        signal: controller.signal,
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(
          `ServiceNow ${instance.name} retornou HTTP ${response.status}.`
        );
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  private isMockMode() {
    return process.env.MOCK_SERVICE_NOW === "true";
  }
}
