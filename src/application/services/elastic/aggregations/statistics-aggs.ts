export const statisticsAggs = {
  total_latency: {
    sum: {
      field: 'responseTime',
    },
  },
  avg_latency: {
    avg: {
      field: 'responseTime',
    },
  },
  total_requests: {
    value_count: {
      field: 'requestId',
    },
  },
  error_count: {
    filter: {
      range: {
        statusCode: {
          gte: 400,
        },
      },
    },
  },
  success_count: {
    filter: {
      range: {
        statusCode: {
          gte: 200,
          lt: 400,
        },
      },
    },
  },
  hourly_traffic: {
    date_histogram: {
      field: 'dateTime',
      calendar_interval: 'hour',
      time_zone: 'America/Sao_Paulo',
    },
  },
  avg_hourly_traffic: {
    avg_bucket: {
      buckets_path: 'hourly_traffic._count',
    },
  },
  daily_throughput: {
    date_histogram: {
      field: 'dateTime',
      calendar_interval: 'day',
      time_zone: 'America/Sao_Paulo',
    },
  },
  avg_daily_throughput: {
    avg_bucket: {
      buckets_path: 'daily_throughput._count',
    },
  },
};
