export const usersAnalysisAggs = {
  top_users: {
    terms: {
      field: 'userEmail',
      size: 5,
      order: {
        _count: 'desc',
      },
    },
    aggs: {
      total_requests: {
        value_count: {
          field: 'requestId',
        },
      },
      methods_used: {
        terms: {
          field: 'method',
          size: 5,
        },
      },
      unique_ips: {
        cardinality: {
          field: 'remoteIpAddress',
        },
      },
      avg_response_time: {
        avg: {
          field: 'responseTime',
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
    },
  },
  top_error_users: {
    filter: {
      range: {
        statusCode: {
          gte: 400,
        },
      },
    },
    aggs: {
      users: {
        terms: {
          field: 'userEmail',
          size: 5,
        },
        aggs: {
          error_breakdown: {
            terms: {
              field: 'statusCode',
              size: 5,
            },
          },
          most_failed_endpoints: {
            terms: {
              field: 'urlPath.keyword',
              size: 5,
            },
          },
        },
      },
    },
  },
  suspicious_ips: {
    terms: {
      field: 'remoteIpAddress',
      size: 3,
      min_doc_count: 1000,
    },
    aggs: {
      unique_users: {
        cardinality: {
          field: 'userEmail',
        },
      },
      request_pattern: {
        date_histogram: {
          field: 'dateTime',
          calendar_interval: 'hour',
          time_zone: 'America/Sao_Paulo',
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
      top_endpoints: {
        terms: {
          field: 'urlPath.keyword',
          size: 5,
        },
      },
    },
  },
  sensitive_endpoints_access: {
    filter: {
      bool: {
        should: [
          {
            wildcard: {
              urlPath: '*admin*',
            },
          },
          {
            wildcard: {
              urlPath: '*password*',
            },
          },
          {
            wildcard: {
              urlPath: '*auth*',
            },
          },
          {
            wildcard: {
              urlPath: '*login*',
            },
          },
          {
            wildcard: {
              urlPath: '*user*',
            },
          },
        ],
        minimum_should_match: 1,
      },
    },
    aggs: {
      by_user: {
        terms: {
          field: 'userEmail',
          size: 3,
        },
        aggs: {
          endpoints_accessed: {
            terms: {
              field: 'urlPath.keyword',
              size: 5,
            },
          },
          success_rate: {
            filters: {
              filters: {
                total: {
                  match_all: {},
                },
                success: {
                  range: {
                    statusCode: {
                      gte: 200,
                      lt: 400,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
