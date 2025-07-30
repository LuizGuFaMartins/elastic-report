export interface Report {
  companyName: string;
  companySubtitle: string;
  companyInitials: string;
  companyLogo: null;
  reportPeriod: string;
  generatedDate: string;
  estatistics: Overview;
  overview: Overview;
  endpoints: Endpoints;
  usage: any;
  errorUsers: any;
  sensitiveAccess: any;
  suspiciousIPs: any;
  services: ServiceHealth[];
  selectedServices: ServiceHealth[];
}
