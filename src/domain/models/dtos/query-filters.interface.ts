export interface QueryFilter {
  services?: string[];
  companyId?: string;
  period?: 'week' | 'lastWeek';
}
