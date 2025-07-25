export interface Report {
  // Informações do cabeçalho
  companyName: string;
  companySubtitle: string;
  companyInitials: string;
  companyLogo: null; // ou URL da logo: "https://exemplo.com/logo.png"
  reportPeriod: string;
  generatedDate: string;

  // 1. Visão Geral da Performance
  overview: {
    avgLatency: string;
    latencyTrend: string;
    latencyChange: string;

    throughput: string;
    throughputTrend: string;
    throughputChange: string;

    errorRate: string;
    errorTrend: string;
    errorChange: string;

    availability: string;
    availabilityTrend: string;
    availabilityChange: string;

    totalRequests: string;
    requestsTrend: string;
    requestsChange: string;

    peakTraffic: string;
  };

  // 2. Principais Endpoints
  endpoints: {
    highestLatency: [
      {
        name: string;
        latency: string;
        volume: string;
      },
      {
        name: string;
        latency: string;
        volume: string;
      },
      {
        name: string;
        latency: string;
        volume: string;
      },
      {
        name: string;
        latency: string;
        volume: string;
      },
      {
        name: string;
        latency: string;
        volume: string;
      },
    ];
    highestErrors: [
      {
        name: string;
        errorRate: string;
        totalErrors: string;
      },
      {
        name: string;
        errorRate: string;
        totalErrors: string;
      },
      {
        name: string;
        errorRate: string;
        totalErrors: string;
      },
      {
        name: string;
        errorRate: string;
        totalErrors: string;
      },
      {
        name: string;
        errorRate: string;
        totalErrors: string;
      },
    ];
  };

  // 3. Falhas e Erros Críticos
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

  // 4. Saúde por Serviço
  services: [
    {
      name: string;
      status: string;
      avgLatency: string;
      volume: string;
      errorRate: string;
      changes: string;
    },
    {
      name: string;
      status: string;
      avgLatency: string;
      volume: string;
      errorRate: string;
      changes: string;
    },
    {
      name: string;
      status: string;
      avgLatency: string;
      volume: string;
      errorRate: string;
      changes: string;
    },
    {
      name: string;
      status: string;
      avgLatency: string;
      volume: string;
      errorRate: string;
      changes: string;
    },
    {
      name: string;
      status: string;
      avgLatency: string;
      volume: string;
      errorRate: string;
      changes: string;
    },
    {
      name: string;
      status: string;
      avgLatency: string;
      volume: string;
      errorRate: string;
      changes: string;
    },
  ];

  // 5. Análise de Tendências
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

  // 6. Análise de Uso
  usage: {
    topUsers: [
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
    suspiciousActivity: [
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

  // 7. Comparativo Semanal
  comparison: {
    latencyChange: string;
    latencyTrend: string;

    errorChange: string;
    errorTrend: string;

    volumeChange: string;
    volumeTrend: string;

    alertsTriggered: string;
    alertsTrend: string;
  };

  // Observações e Recomendações
  recommendations: [
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
