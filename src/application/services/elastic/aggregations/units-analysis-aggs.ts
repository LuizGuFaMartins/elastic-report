export const unitsAnalysisAggs = {
  stats_by_company: {
    terms: {
      field: 'companyAlias',
      size: 5,
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
      doc_count_per_company: {
        value_count: {
          field: 'responseTime',
        },
      },
    },
  },
};
