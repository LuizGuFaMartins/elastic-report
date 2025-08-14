export const topEndpointsByErrorsAggs = {
  by_endpoint: {
    filters: {
      filters: {
        notStatusCode200: {
          bool: {
            must_not: [
              {
                term: {
                  statusCode: {
                    value: '200',
                  },
                },
              },
            ],
          },
        },
      },
    },
    aggs: {
      endpoint: {
        terms: {
          field: 'urlPath.keyword',
          size: 6,
          order: {
            _count: 'desc',
          },
        },
        aggs: {
          by_status: {
            terms: {
              field: 'statusCode',
              size: 6,
              order: {
                _count: 'desc',
              },
            },
          },
        },
      },
    },
  },
};
