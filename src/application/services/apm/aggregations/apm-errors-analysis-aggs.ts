export const apmErrorsAnalysisAggs = {
  errors_over_time: {
    date_histogram: {
      field: '@timestamp',
      calendar_interval: '1h',
      time_zone: 'America/Sao_Paulo',
    },
  },
  error_types: {
    terms: {
      field: 'error.exception.type',
      size: 20,
      order: {
        _count: 'desc',
      },
    },
    aggs: {
      error_messages: {
        terms: {
          field: 'error.exception.message.keyword',
          size: 5,
        },
      },
      affected_services: {
        terms: {
          field: 'service.name',
          size: 10,
        },
      },
    },
  },
  services_with_errors: {
    terms: {
      field: 'service.name',
      size: 20,
      order: {
        _count: 'desc',
      },
    },
    aggs: {
      environments: {
        terms: {
          field: 'service.environment',
          size: 10,
        },
      },
      error_rate: {
        avg: {
          field: 'error.exception.handled',
        },
      },
      top_errors: {
        terms: {
          field: 'error.exception.type',
          size: 5,
        },
      },
    },
  },
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
  error_locations: {
    terms: {
      field: 'error.exception.stacktrace.filename',
      size: 15,
    },
    aggs: {
      functions: {
        terms: {
          field: 'error.exception.stacktrace.function',
          size: 10,
        },
      },
      line_numbers: {
        terms: {
          field: 'error.exception.stacktrace.line.number',
          size: 5,
        },
      },
    },
  },
  infrastructure: {
    terms: {
      field: 'host.hostname',
      size: 15,
    },
    aggs: {
      cloud_providers: {
        terms: {
          field: 'cloud.provider',
          size: 5,
        },
      },
      availability_zones: {
        terms: {
          field: 'cloud.availability_zone',
          size: 10,
        },
      },
    },
  },
  users_affected: {
    cardinality: {
      field: 'user.id',
    },
  },
  unique_errors: {
    cardinality: {
      field: 'error.grouping_key',
    },
  },
  handled_vs_unhandled: {
    terms: {
      field: 'error.exception.handled',
      size: 2,
    },
  },
  error_severity: {
    terms: {
      field: 'error.custom.appGroupId',
      size: 10,
    },
  },
  trace_analysis: {
    terms: {
      field: 'transaction.name',
      size: 20,
    },
    aggs: {
      transaction_types: {
        terms: {
          field: 'transaction.type',
          size: 5,
        },
      },
    },
  },
  client_analysis: {
    terms: {
      field: 'client.ip',
      size: 15,
    },
    aggs: {
      error_count_per_client: {
        value_count: {
          field: 'error.id',
        },
      },
    },
  },
  error_statistics: {
    stats: {
      field: 'timestamp.us',
    },
  },
};
