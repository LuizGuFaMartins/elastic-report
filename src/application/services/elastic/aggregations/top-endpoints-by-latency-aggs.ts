export const topEndpointsByLatencyAggs = {
  by_endpoint: {
    terms: {
      field: 'urlPath.keyword',
      size: 5,
      order: { avg_response_time: 'desc' },
    },
    aggs: {
      avg_response_time: {
        avg: {
          field: 'responseTime',
        },
      },
      total_requests: {
        value_count: {
          field: 'requestId.keyword',
        },
      },
      by_method: {
        terms: {
          field: 'method.keyword',
          size: 5,
        },
      },
    },
  },
};
