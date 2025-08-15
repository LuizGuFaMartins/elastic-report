export const servicesAnalysisAggs = {
  stats_by_service: {
    terms: {
      field: 'software',
      size: 6,
      order: {
        max_response_time: 'desc',
      },
    },
    aggs: {
      max_response_time: {
        max: {
          field: 'responseTime',
        },
      },
      percentiles_response_time: {
        percentiles: {
          field: 'responseTime',
          percents: [95, 99],
          keyed: true,
        },
      },
      avg_response_time: {
        avg: {
          field: 'responseTime',
        },
      },
      doc_count_per_service: {
        value_count: {
          field: 'responseTime',
        },
      },
    },
  },
};
