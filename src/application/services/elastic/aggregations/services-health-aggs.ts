export const serviceHealthAggs = {
  by_service: {
    terms: {
      field: 'software',
      size: 13,
    },
    aggs: {
      avg_latency: {
        avg: {
          field: 'responseTime',
        },
      },

      request_count: {
        value_count: {
          field: 'requestId',
        },
      },

      error_rate: {
        filters: {
          filters: {
            total: {
              match_all: {},
            },
            errors: {
              range: {
                statusCode: {
                  gte: 400,
                },
              },
            },
          },
        },
      },

      daily_trend: {
        date_histogram: {
          field: 'dateTime',
          calendar_interval: 'day',
        },
        aggs: {
          daily_avg_latency: {
            avg: {
              field: 'responseTime',
            },
          },
          daily_errors: {
            filter: {
              range: {
                statusCode: {
                  gte: 400,
                },
              },
            },
          },
        },
      },
    },
  },
};
