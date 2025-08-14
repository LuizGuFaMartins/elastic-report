export const errorsAnalysisAggs = {
  by_status_code: {
    terms: {
      field: 'statusCode',
      size: 5,
    },
    aggs: {
      by_endpoint: {
        terms: {
          field: 'urlPath.keyword',
          size: 5,
        },
      },
    },
  },

  error_categories: {
    filters: {
      filters: {
        client_errors: {
          range: {
            statusCode: {
              gte: 400,
              lt: 500,
            },
          },
        },
        server_errors: {
          range: {
            statusCode: {
              gte: 500,
            },
          },
        },
      },
    },
  },
};
