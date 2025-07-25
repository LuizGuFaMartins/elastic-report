const oldReportMock = {
  startDate: '14/07/2025',
  endDate: '21/07/2025',
  totalRequests: 12234,
  errorRate: 1.8,
  avgLatency: 240,
  worstLatencyService: 'users-service',
  generatedAt: new Date().toLocaleString(),

  services: [
    {
      name: 'auth-service',
      throughput: 12.4,
      latency: 150,
      errorRate: 0.7,
      criticalEndpoint: 'POST /login',
    },
    {
      name: 'orders-service',
      throughput: 8.9,
      latency: 230,
      errorRate: 1.8,
      criticalEndpoint: 'GET /orders/:id',
    },
  ],

  criticalEndpoints: [
    {
      name: 'GET /users/listAssociations',
      latency: 2500,
      errorRate: 1.2,
      impact: 'Alto',
      isCritical: true,
    },
    {
      name: 'POST /checkout/pay',
      latency: 1900,
      errorRate: 8.2,
      impact: 'Alto',
      isCritical: true,
    },
  ],

  trends: [
    {
      metric: 'Latência Média',
      current: '240ms',
      previous: '210ms',
      variation: '+14%',
      variationClass: 'status-red',
    },
    {
      metric: 'Erros',
      current: '1.8%',
      previous: '1.2%',
      variation: '+0.6%',
      variationClass: 'status-yellow',
    },
  ],

  anomalies: [
    {
      timestamp: '17/07 15:22',
      description: 'Erro 500 em POST /checkout/pay',
    },
    {
      timestamp: '20/07 08:10',
      description: 'Latência alta em GET /orders/list',
    },
  ],

  improvements: [
    {
      item: 'GET /users/listAssociations',
      proposal: 'Otimizar procedure SQL',
      benefit: 'Reduz latência em 40%',
    },
    {
      item: 'POST /checkout/pay',
      proposal: 'Adicionar retry ao serviço externo',
      benefit: 'Reduz falha de pagamento',
    },
  ],
};
