import { beforeAll, describe, expect, it } from "vitest";
import type { ServiceNowInstance } from "@prisma/client";
import { splitProductCodes } from "@/lib/servicenow/records";
import { ServiceNowLicenseCollector } from "./ServiceNowLicenseCollector";

beforeAll(() => {
  process.env.MOCK_SERVICE_NOW = "true";
});

// Minimal fake instance — credentials unused in mock mode
const mockInstance = {
  id: "inst_test_001",
  clientId: "client_test_001",
  name: "Test Instance",
  baseUrl: "https://test.service-now.com",
  environment: "test",
  active: true,
  authType: "BASIC",
  username: null,
  encryptedPassword: null,
  encryptedToken: null,
  createdAt: new Date(),
  updatedAt: new Date()
} as unknown as ServiceNowInstance;

describe("ServiceNowLicenseCollector.collectInstance (mock mode)", () => {
  it("should return one snapshot per overview record when each matches exactly one license_detail", async () => {
    const collector = new ServiceNowLicenseCollector();
    const snapshots = await collector.collectInstance(mockInstance);
    console.log("Collected snapshots:", snapshots);
    // Mock data: 5 overview records, each resolving to exactly 1 snapshot
    expect(snapshots).toHaveLength(5);
  });

  it("should reuse the same license_detail entry for multiple overviews that share a product code", async () => {
    // lic_prod_combo_001 has product_code "PROD18249,PROD17161"
    // ov_cmdb_001 → ent_cmdb_001 (product_code: PROD18249) → matches lic_prod_combo_001
    // ov_csm_001  → ent_csm_001  (product_code: PROD17161) → also matches lic_prod_combo_001
    // Both overviews produce a snapshot with the SAME licenseSysId
    const collector = new ServiceNowLicenseCollector();
    const snapshots = await collector.collectInstance(mockInstance);

    const comboSnapshots = snapshots.filter((s) => s.licenseSysId === "lic_prod_combo_001");
    expect(comboSnapshots).toHaveLength(2);
  });

  it("should calculate usagePercent as (allocated / purchased) * 100", async () => {
    const collector = new ServiceNowLicenseCollector();
    const snapshots = await collector.collectInstance(mockInstance);

    // ov_cmdb_001: allocated=93, purchased=100 → 93%
    const cmdbSnapshot = snapshots.find((s) => s.overviewSysId === "ov_cmdb_001");
    expect(cmdbSnapshot?.usagePercent).toBe(93);

    // ov_csm_001: allocated=105, purchased=100 → 105%
    const csmSnapshot = snapshots.find((s) => s.overviewSysId === "ov_csm_001");
    expect(csmSnapshot?.usagePercent).toBe(105);
  });

  it("should assign CRITICAL risk when usagePercent >= 100", async () => {
    const collector = new ServiceNowLicenseCollector();
    const snapshots = await collector.collectInstance(mockInstance);

    const csmSnapshot = snapshots.find((s) => s.overviewSysId === "ov_csm_001");
    expect(csmSnapshot?.riskLevel).toBe("CRITICAL");
    expect(csmSnapshot?.riskReason).toContain("100%");
  });

  it("should assign HIGH risk when license expires within 30 days", async () => {
    const collector = new ServiceNowLicenseCollector();
    // ov_hr_001 ends 2026-05-20; collected 4 days before → daysToExpire=4 → HIGH
    const snapshots = await collector.collectInstance(mockInstance, {
      collectedAt: new Date("2026-05-16")
    });

    const hrSnapshot = snapshots.find((s) => s.overviewSysId === "ov_hr_001");
    expect(hrSnapshot?.daysToExpire).toBe(4);
    expect(hrSnapshot?.riskLevel).toBe("HIGH");
  });

  it("should mark expired=false for a license whose endDate is still in the future", async () => {
    // daysToExpire is always computed against new Date() at collection time.
    // The collectedAt option only affects weekReference, not expired/daysToExpire.
    // ov_hr_001 ends 2026-05-20 (4 days from 2026-05-16) — not yet expired.
    const collector = new ServiceNowLicenseCollector();
    const snapshots = await collector.collectInstance(mockInstance);

    const hrSnapshot = snapshots.find((s) => s.overviewSysId === "ov_hr_001");
    expect(hrSnapshot?.expired).toBe(false);
    // With endDate=2026-05-20 from now (2026-05-16), daysToExpire=4 → HIGH risk
    expect(hrSnapshot?.riskLevel).toBe("HIGH");
  });

  it("should prefer licenseName from licenseDetail over entitlement name", async () => {
    const collector = new ServiceNowLicenseCollector();
    const snapshots = await collector.collectInstance(mockInstance);

    // ent_cmdb_001.name = "IT Service Management Professional"
    // lic_prod_combo_001.name = "ITSM/CSM Professional Bundle"
    // licenseDetail takes priority
    const cmdbSnapshot = snapshots.find((s) => s.overviewSysId === "ov_cmdb_001");
    expect(cmdbSnapshot?.licenseName).toBe("ITSM/CSM Professional Bundle");
    expect(cmdbSnapshot?.entitlementName).toBe("IT Service Management Professional");
  });

  it("should set productCode from the first entitlement product code", async () => {
    const collector = new ServiceNowLicenseCollector();
    const snapshots = await collector.collectInstance(mockInstance);

    const itomSnapshot = snapshots.find((s) => s.overviewSysId === "ov_itom_001");
    expect(itomSnapshot?.productCode).toBe("PROD90000");
  });

  it("should capture allocatedStatus from licenseDetail", async () => {
    const collector = new ServiceNowLicenseCollector();
    const snapshots = await collector.collectInstance(mockInstance);

    // lic_prod_itom_001.allocated_status = "ok"
    const itomSnapshot = snapshots.find((s) => s.overviewSysId === "ov_itom_001");
    expect(itomSnapshot?.allocatedStatus).toBe("ok");

    // lic_prod_hr_001.allocated_status = "expiring"
    const hrSnapshot = snapshots.find((s) => s.overviewSysId === "ov_hr_001");
    expect(hrSnapshot?.allocatedStatus).toBe("expiring");
  });

  it("should attach clientId and instanceId from the given instance", async () => {
    const collector = new ServiceNowLicenseCollector();
    const snapshots = await collector.collectInstance(mockInstance);

    for (const snapshot of snapshots) {
      expect(snapshot.clientId).toBe(mockInstance.clientId);
      expect(snapshot.instanceId).toBe(mockInstance.id);
    }
  });
});

describe("product code matching logic", () => {
  it("should match a licenseDetail when any of its product codes appears in the entitlement codes", () => {
    // This is the core logic that creates extra snapshots in Detran
    const entitlementCodes = ["PROD_AE"];

    const licenseDetails = [
      { product_code: "PROD_AE" },            // direct match
      { product_code: "PROD_AE,PROD_AE_RPA" } // bundle — also matches PROD_AE!
    ];

    const matching = licenseDetails.filter((detail) =>
      splitProductCodes(detail.product_code).some((code) => entitlementCodes.includes(code))
    );

    // Both entries match → 2 snapshots from 1 overview
    // This explains why Detran shows 9 snapshots for 8 subscription overviews:
    // one overview has an entitlement whose product code appears in two license_details entries.
    expect(matching).toHaveLength(2);
  });

  it("should handle comma-separated product codes in license_details", () => {
    const codes = splitProductCodes("PROD18249,PROD17161");
    expect(codes).toEqual(["PROD18249", "PROD17161"]);
  });

  it("should handle single product code", () => {
    const codes = splitProductCodes("PROD90000");
    expect(codes).toEqual(["PROD90000"]);
  });

  it("should return empty array for null or empty product_code", () => {
    expect(splitProductCodes(null)).toEqual([]);
    expect(splitProductCodes("")).toEqual([]);
    expect(splitProductCodes("  ")).toEqual([]);
  });
});
