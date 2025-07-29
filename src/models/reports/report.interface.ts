export interface Report {
  companyName: string;
  companySubtitle: string;
  companyInitials: string;
  companyLogo: null;
  reportPeriod: string;
  generatedDate: string;

  overview: Overview;

  endpoints: Endpoints;

  errors: {
    error5xx: string;
    error4xx: string;
    newErrorTypes: string;
    criticalEndpoints: string;
    topErrors: [
      {
        type: string;
        count: string;
        description: string;
        lastOccurrence: string;
      },
      {
        type: string;
        count: string;
        description: string;
        lastOccurrence: string;
      },
      {
        type: string;
        count: string;
        description: string;
        lastOccurrence: string;
      },
      {
        type: string;
        count: string;
        description: string;
        lastOccurrence: string;
      },
    ];
  };

  services: ServiceHealth[];

  trends: {
    anomalies: [
      {
        type: string;
        description: string;
        timestamp: string;
      },
      {
        type: string;
        description: string;
        timestamp: string;
      },
      {
        type: string;
        description: string;
        timestamp: string;
      },
    ];
    patterns: [
      {
        metric: string;
        change: string;
        impact: string;
      },
      {
        metric: string;
        change: string;
        impact: string;
      },
      {
        metric: string;
        change: string;
        impact: string;
      },
    ];
  };

  usage?: {
    topUsers?: [
      {
        user: string;
        requests: string;
        percentage: string;
      },
      {
        user: string;
        requests: string;
        percentage: string;
      },
      {
        user: string;
        requests: string;
        percentage: string;
      },
      {
        user: string;
        requests: string;
        percentage: string;
      },
      {
        user: string;
        requests: string;
        percentage: string;
      },
    ];
    suspiciousActivity?: [
      {
        type: string;
        details: string;
        timestamp: string;
      },
      {
        type: string;
        details: string;
        timestamp: string;
      },
      {
        type: string;
        details: string;
        timestamp: string;
      },
    ];
  };

  comparison?: {
    latencyChange: string;
    latencyTrend: string;

    errorChange: string;
    errorTrend: string;

    volumeChange: string;
    volumeTrend: string;

    alertsTriggered: string;
    alertsTrend: string;
  };

  recommendations?: [
    {
      priority: string;
      description: string;
    },
    {
      priority: string;
      description: string;
    },
    {
      priority: string;
      description: string;
    },
    {
      priority: string;
      description: string;
    },
    {
      priority: string;
      description: string;
    },
  ];
}
