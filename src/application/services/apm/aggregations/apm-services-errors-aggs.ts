export const apmServiceErrorsAggs = {
  errors_by_service: {
    terms: {
      field: 'service.name',
      order: {
        _count: 'desc',
      },
      size: 10,
    },
    aggs: {
      timeout_errors: {
        filter: {
          bool: {
            should: [
              {
                match: {
                  'error.exception.message': 'Execution Timeout Expired',
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
      },
      deadlock_errors: {
        filter: {
          bool: {
            should: [
              {
                match: {
                  'error.exception.message': 'deadlock',
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
      },
    },
  },
};
