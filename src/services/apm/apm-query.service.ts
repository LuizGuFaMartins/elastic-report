import { Injectable } from '@nestjs/common';
import { DayjsService } from '../commom/dayjs.service';
import { ApmHttpService } from './apm-http.service';

@Injectable()
export class ApmQueryService {
  private dayjs: any;

  constructor(
    private readonly apmHttp: ApmHttpService,
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

  private getServiceFilter(services: string[]): any {
    return {
      bool: {
        should: [
          ...services?.map((service) => {
            return {
              bool: {
                should: [
                  {
                    term: {
                      'service.name': service,
                    },
                  },
                ],
                minimum_should_match: 1,
              },
            };
          }),
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

  async getApmErrorAnalysis(
    services?: string[],
    companyId?: string,
    period: 'week' | 'lastWeek' = 'week',
  ) {
    const filters: any = [this.getDateRangeFilter(period, '@timestamp')];
    if (services) filters.push(this.getServiceFilter(services));
    if (companyId) filters.push(this.getCompanyFilter(companyId));

    const body = {
      size: 0,
      query: {
        bool: {
          filter: filters,
        },
      },
      aggs: {
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
      },
    };

    return await this.apmHttp.post(
      `/${process.env.ELASTIC_ERROR_LOGS_INDEX}/_search`,
      body,
    );
  }
}
