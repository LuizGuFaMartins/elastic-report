import { Injectable } from '@nestjs/common';
import { DayjsService } from '../commom/dayjs.service';
import { ElasticHttpService } from './elastic-http.service';

@Injectable()
export class ElasticQueryService {
  private dayjs: any;

  constructor(
    private readonly elasticHttp: ElasticHttpService,
    private readonly dayjsService: DayjsService,
  ) {
    this.dayjs = this.dayjsService.getInstance();
  }

  public getTimeData() {
    const tz = process.env.ELASTIC_TIMEZONE;
    const end = this.dayjs().tz(tz);
    const start = end.subtract(7, 'day');
    return {
      startISO: start.toISOString(),
      endISO: end.toISOString(),
      startMillis: start.valueOf(),
      endMillis: end.valueOf(),
      formatedStartISO: start.format('DD/MM/YYYY'),
      formatedEndISO: end.format('DD/MM/YYYY'),
      tz,
    };
  }

  public getPreviousWeekTimeData() {
    const tz = process.env.ELASTIC_TIMEZONE;
    const end = this.dayjs().tz(tz).subtract(7, 'day');
    const start = end.subtract(7, 'day');
    return {
      startISO: start.toISOString(),
      endISO: end.toISOString(),
      startMillis: start.valueOf(),
      endMillis: end.valueOf(),
      formatedStartISO: start.format('DD/MM/YYYY'),
      formatedEndISO: end.format('DD/MM/YYYY'),
      tz,
    };
  }

  public getDateRangeFilter(
    period?: 'week' | 'lastWeek',
    field: string = 'dateTime',
    timeData?: any,
  ) {
    if (!period) period = 'week';

    const time: any =
      timeData || period === 'lastWeek'
        ? this.getPreviousWeekTimeData()
        : this.getTimeData();

    return {
      range: {
        [field]: {
          gte: time.startISO,
          lte: time.endISO,
          format: 'strict_date_optional_time',
        },
      },
    };
  }

  private getServiceFilter(service: string): any {
    return {
      bool: {
        should: [
          {
            bool: {
              should: [
                {
                  term: {
                    software: {
                      value: service,
                    },
                  },
                },
              ],
              minimum_should_match: 1,
            },
          },
        ],
        minimum_should_match: 1,
      },
    };
  }

  private getCompanyFilter(companyId?: string): any {
    if (!companyId) return null;
    return {
      bool: {
        should: [
          {
            bool: {
              should: [
                {
                  term: {
                    companyId: {
                      value: companyId,
                    },
                  },
                },
              ],
              minimum_should_match: 1,
            },
          },
        ],
        minimum_should_match: 1,
      },
    };
  }

  async getOverviewEstatistics(
    serviceName?: string,
    companyId?: string,
    period: 'week' | 'lastWeek' = 'week',
  ) {
    const filters = [this.getDateRangeFilter(period)];
    if (serviceName) filters.push(this.getServiceFilter(serviceName));
    if (companyId) filters.push(this.getCompanyFilter(companyId));

    const body = {
      size: 0,
      query: {
        bool: {
          filter: filters,
        },
      },
      aggs: {
        total_latency: {
          sum: {
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
        daily_throughput: {
          date_histogram: {
            field: 'dateTime',
            calendar_interval: 'day',
            time_zone: 'America/Sao_Paulo',
          },
        },
      },
    };

    return await this.elasticHttp.post(
      `/${process.env.ELASTIC_REQUEST_LOGS_INDEX}/_search`,
      body,
    );
  }

  async getTopEndpointsByLatency(
    serviceName?: string,
    companyId?: string,
    size: number = 5,
    period: 'week' | 'lastWeek' = 'week',
  ) {
    const filters = [this.getDateRangeFilter(period)];
    if (serviceName) filters.push(this.getServiceFilter(serviceName));
    if (companyId) filters.push(this.getCompanyFilter(companyId));

    const body = {
      size: 0,
      query: {
        bool: {
          filter: filters,
        },
      },
      aggs: {
        by_endpoint: {
          terms: {
            field: 'urlPath.keyword',
            size,
            order: { avg_response_time: 'desc' },
          },
          aggs: {
            avg_response_time: {
              avg: {
                field: 'responseTime',
              },
            },
            total_requests: {
              value_count: {
                field: 'requestId.keyword',
              },
            },
            by_method: {
              terms: {
                field: 'method.keyword',
                size: 5,
              },
            },
          },
        },
      },
    };

    return await this.elasticHttp.post(
      `/${process.env.ELASTIC_REQUEST_LOGS_INDEX}/_search`,
      body,
    );
  }

  async getTopEndpointsByErrors(
    serviceName?: string,
    companyId?: string,
    size: number = 5,
    period: 'week' | 'lastWeek' = 'week',
  ) {
    const filters = [this.getDateRangeFilter(period)];
    if (serviceName) filters.push(this.getServiceFilter(serviceName));
    if (companyId) filters.push(this.getCompanyFilter(companyId));

    const body = {
      size: 0,
      query: {
        bool: {
          filter: filters,
        },
      },
      aggs: {
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
                size,
                order: {
                  _count: 'desc',
                },
              },
              aggs: {
                by_status: {
                  terms: {
                    field: 'statusCode',
                    size: 5,
                    order: {
                      _count: 'desc',
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    return await this.elasticHttp.post(
      `/${process.env.ELASTIC_REQUEST_LOGS_INDEX}/_search`,
      body,
    );
  }

  async getErrorAnalysis(
    serviceName?: string,
    companyId?: string,
    period: 'week' | 'lastWeek' = 'week',
  ) {
    const filters: any = [this.getDateRangeFilter(period)];
    if (serviceName) filters.push(this.getServiceFilter(serviceName));
    if (companyId) filters.push(this.getCompanyFilter(companyId));

    const body = {
      size: 0,
      query: {
        bool: {
          filter: filters,
        },
      },
      aggs: {
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
      },
    };

    return await this.elasticHttp.post(
      `/${process.env.ELASTIC_REQUEST_LOGS_INDEX}/_search`,
      body,
    );
  }

  async getServiceHealth(
    companyId?: string,
    period: 'week' | 'lastWeek' = 'week',
  ) {
    const filters = [this.getDateRangeFilter(period)];
    if (companyId) filters.push(this.getCompanyFilter(companyId));

    const body = {
      size: 0,
      query: {
        bool: {
          filter: filters,
        },
      },
      aggs: {
        by_service: {
          terms: {
            field: 'software',
            size: 20,
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
                time_zone: this.getTimeData().tz,
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
      },
    };

    return await this.elasticHttp.post(
      `/${process.env.ELASTIC_REQUEST_LOGS_INDEX}/_search`,
      body,
    );
  }

  async getUserAnalysis(
    serviceName?: string,
    companyId?: string,
    period: 'week' | 'lastWeek' = 'week',
  ) {
    const filters = [this.getDateRangeFilter(period)];
    if (serviceName) filters.push(this.getServiceFilter(serviceName));
    if (companyId) filters.push(this.getCompanyFilter(companyId));

    const body = {
      size: 0,
      query: {
        bool: {
          filter: filters,
        },
      },
      aggs: {
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
            size: 5,
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
                size: 5,
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
      },
    };

    return await this.elasticHttp.post(
      `/${process.env.ELASTIC_REQUEST_LOGS_INDEX}/_search`,
      body,
    );
  }
}
