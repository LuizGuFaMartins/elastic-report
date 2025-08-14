export const apmUnitErrorsAggs = {
  errors_by_unit: {
    terms: {
      field: 'http.request.headers.Un-Alias',
      order: {
        _count: 'desc',
      },
      size: 6,
    },
  },
};
