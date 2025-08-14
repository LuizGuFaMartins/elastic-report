export const apmHttpAnalysisAggs = {
  http_errors: {
    filter: {
      exists: {
        field: 'http.request',
      },
    },
    aggs: {
      methods: {
        terms: {
          field: 'http.request.method',
          size: 10,
        },
      },
      paths: {
        terms: {
          field: 'url.path',
          size: 20,
        },
      },
      user_agents: {
        terms: {
          field: 'user_agent.name',
          size: 10,
        },
      },
    },
  },
};
