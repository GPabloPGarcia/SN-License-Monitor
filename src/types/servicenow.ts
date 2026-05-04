export type ServiceNowReference = {
  link?: string;
  value?: string;
};

export type SubscriptionOverviewRecord = {
  sys_id: string;
  allocated_count?: string | number | null;
  purchased_count?: string | number | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  subscription?: ServiceNowReference | string | null;
  subscription_type?: string | null;
  name?: string | null;
};

export type SubscriptionEntitlement = {
  sys_id: string;
  name?: string | null;
  product_code?: string | null;
  entitlement_id?: string | null;
  parent_entitlement_id?: string | null;
  entitlement_model?: string | null;
  meter_type?: string | null;
  unit_of_meter?: string | null;
  purchased_count?: string | number | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
};

export type LicenseDetail = {
  sys_id: string;
  product_code?: string | null;
  name?: string | null;
  count?: string | number | null;
  allocated?: string | number | null;
  allocated_status?: string | null;
  meter_type?: string | null;
  license_type?: string | null;
  category?: string | null;
  expired?: string | boolean | number | null;
  display_only?: string | boolean | number | null;
  is_capped?: string | boolean | number | null;
  auto_sync?: string | boolean | number | null;
  license_weight?: string | number | null;
  table_count?: string | number | null;
  tables_used?: string | number | null;
  quota_defn_id?: string | null;
  quota_defn?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  last_allocation_cal_on?: string | null;
};

export type ServiceNowListResponse<T> = {
  result: T[];
};

export type ServiceNowSingleResponse<T> = {
  result: T;
};
