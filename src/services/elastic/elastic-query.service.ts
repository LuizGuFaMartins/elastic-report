import { Injectable } from '@nestjs/common';
import { ElasticHttpService } from './elastic-http.service';
import { DayjsService } from '../commom/dayjs.service';
import { OverviewParser } from './parsers/overview-parser.service';
import { EndpointsParser } from './parsers/endpoints-parser.service';

@Injectable()
export class ElasticQueryService {
  private dayjs: any;

  constructor(
    private readonly http: ElasticHttpService,
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

  // 1. Visão Geral da Performance
  async getOverviewMetrics(
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
        // Latência média (responseTime)
        avg_latency: {
          avg: {
            field: 'responseTime',
          },
        },
        // Total de requisições
        total_requests: {
          value_count: {
            field: 'requestId',
          },
        },
        // Taxa de erro (statusCode >= 400)
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
        // Disponibilidade (requisições com sucesso)
        availability: {
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
        // Pico de tráfego por hora
        hourly_traffic: {
          date_histogram: {
            field: 'dateTime',
            calendar_interval: 'hour',
            time_zone: this.getTimeData().tz,
          },
        },
        // Throughput por minuto (baseado no volume)
        daily_throughput: {
          date_histogram: {
            field: 'dateTime',
            calendar_interval: 'day',
            time_zone: this.getTimeData().tz,
          },
        },
      },
    };
    return await this.http.post(`/${process.env.ELASTIC_INDEX}/_search`, body);
  }

  // 2. Top Endpoints por Latência
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

    return await this.http.post(`/${process.env.ELASTIC_INDEX}/_search`, body);
  }

  // 3. Top Endpoints por Taxa de Erro
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

    return await this.http.post(`/${process.env.ELASTIC_INDEX}/_search`, body);
  }

  // 4. Análise de Erros Detalhada
  async getErrorAnalysis(
    serviceName?: string,
    companyId?: string,
    period: 'week' | 'lastWeek' = 'week',
  ) {
    const filters: any = [this.getDateRangeFilter(period)];

    filters.push({
      range: {
        statusCode: {
          gte: 400,
        },
      },
    });

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
        // Erros por status code
        by_status_code: {
          terms: {
            field: 'statusCode',
            size: 10,
          },
          aggs: {
            by_endpoint: {
              terms: {
                field: 'urlPath',
                size: 5,
              },
            },
          },
        },
        // Erros 4xx vs 5xx
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
        // Endpoints com falha consistente
        consistent_failures: {
          terms: {
            field: 'urlPath',
            size: 10,
            min_doc_count: 10, // Pelo menos 10 erros
          },
          aggs: {
            error_rate_by_hour: {
              date_histogram: {
                field: 'dateTime',
                calendar_interval: 'hour',
                time_zone: this.getTimeData().tz,
              },
            },
          },
        },
        // Novos tipos de erro (últimas 24h vs resto da semana)
        new_error_patterns: {
          filters: {
            filters: {
              last_24h: {
                bool: {
                  filter: [
                    {
                      range: {
                        dateTime: {
                          gte: this.dayjs()
                            .tz(this.getTimeData().tz)
                            .subtract(1, 'day')
                            .toISOString(),
                        },
                      },
                    },
                    {
                      range: {
                        statusCode: {
                          gte: 400,
                        },
                      },
                    },
                  ],
                },
              },
              previous_days: {
                bool: {
                  filter: [
                    {
                      range: {
                        dateTime: {
                          gte: this.getTimeData().startISO,
                          lt: this.dayjs()
                            .tz(this.getTimeData().tz)
                            .subtract(1, 'day')
                            .toISOString(),
                        },
                      },
                    },
                    {
                      range: {
                        statusCode: {
                          gte: 400,
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          aggs: {
            status_codes: {
              terms: {
                field: 'statusCode',
                size: 20,
              },
              aggs: {
                endpoints: {
                  terms: {
                    field: 'urlPath',
                    size: 5,
                  },
                },
              },
            },
          },
        },
      },
    };

    return await this.http.post(`/${process.env.ELASTIC_INDEX}/_search`, body);
  }

  // 5. Saúde por Serviço
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
            // Latência média
            avg_latency: {
              avg: {
                field: 'responseTime',
              },
            },
            // Volume de requisições
            request_count: {
              value_count: {
                field: 'requestId',
              },
            },
            // Taxa de erro
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
            // Disponibilidade
            // availability: {
            //   bucket_script: {
            //     buckets_path: {
            //       total: 'error_rate>total>_count',
            //       errors: 'error_rate>errors>_count',
            //     },
            //     script:
            //       'params.total > 0 ? ((params.total - params.errors) / params.total) * 100 : 100',
            //   },
            // },
            // Mudanças na última semana (comparar com período anterior)
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

    return await this.http.post(`/${process.env.ELASTIC_INDEX}/_search`, body);
  }

  // 6. Análise de Anomalias e Tendências
  async getTrendAnalysis(
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
        // Tendência de latência por dia
        latency_trend: {
          date_histogram: {
            field: 'dateTime',
            calendar_interval: 'day',
            time_zone: this.getTimeData().tz,
          },
          aggs: {
            avg_latency: {
              avg: {
                field: 'responseTime',
              },
            },
            max_latency: {
              max: {
                field: 'responseTime',
              },
            },
            percentiles: {
              percentiles: {
                field: 'responseTime',
                percents: [50, 95, 99],
              },
            },
          },
        },
        // Tendência de erros por dia
        error_trend: {
          date_histogram: {
            field: 'dateTime',
            calendar_interval: 'day',
            time_zone: this.getTimeData().tz,
          },
          aggs: {
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
            error_rate: {
              bucket_script: {
                buckets_path: {
                  errors: 'error_count>_count',
                  total: 'total_requests',
                },
                script:
                  'params.total > 0 ? (params.errors / params.total) * 100 : 0',
              },
            },
          },
        },
        // Padrão de tráfego por hora (para detectar anomalias)
        hourly_pattern: {
          date_histogram: {
            field: 'dateTime',
            calendar_interval: 'hour',
            time_zone: this.getTimeData().tz,
          },
          aggs: {
            request_count: {
              value_count: {
                field: 'requestId',
              },
            },
            unique_users: {
              cardinality: {
                field: 'userEmail',
              },
            },
          },
        },
        // Picos de latência anômalos
        latency_spikes: {
          filter: {
            range: {
              responseTime: {
                gte: 5000, // > 5 segundos
              },
            },
          },
          aggs: {
            by_endpoint: {
              terms: {
                field: 'urlPath',
                size: 10,
              },
              aggs: {
                avg_spike_latency: {
                  avg: {
                    field: 'responseTime',
                  },
                },
                spike_times: {
                  date_histogram: {
                    field: 'dateTime',
                    calendar_interval: 'hour',
                    time_zone: this.getTimeData().tz,
                  },
                },
              },
            },
          },
        },
      },
    };

    return await this.http.post(`/${process.env.ELASTIC_INDEX}/_search`, body);
  }

  // 7. Top Usuários e Atividade Suspeita
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
        // Top usuários por volume
        top_users: {
          terms: {
            field: 'userEmail',
            size: 10,
            order: { _count: 'desc' },
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
        // Usuários com mais erros
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
                size: 10,
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
                    field: 'urlPath',
                    size: 5,
                  },
                },
              },
            },
          },
        },
        // IPs suspeitos (muitas requisições)
        suspicious_ips: {
          terms: {
            field: 'remoteIpAddress',
            size: 10,
            min_doc_count: 1000, // IPs com mais de 1000 requisições
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
                time_zone: this.getTimeData().tz,
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
                field: 'urlPath',
                size: 5,
              },
            },
          },
        },
        // Atividade fora do horário comercial
        off_hours_activity: {
          filter: {
            script: {
              script: {
                source: `
                  def hour = doc['dateTime'].value.getHour();
                  return hour < 8 || hour > 18;
                `,
              },
            },
          },
          aggs: {
            by_user: {
              terms: {
                field: 'userEmail',
                size: 10,
              },
              aggs: {
                by_hour: {
                  date_histogram: {
                    field: 'dateTime',
                    calendar_interval: 'hour',
                    time_zone: this.getTimeData().tz,
                  },
                },
              },
            },
          },
        },
        // Tentativas de acesso a endpoints sensíveis
        sensitive_endpoints_access: {
          filter: {
            bool: {
              should: [
                { wildcard: { urlPath: '*admin*' } },
                { wildcard: { urlPath: '*password*' } },
                { wildcard: { urlPath: '*auth*' } },
                { wildcard: { urlPath: '*login*' } },
                { wildcard: { urlPath: '*user*' } },
              ],
              minimum_should_match: 1,
            },
          },
          aggs: {
            by_user: {
              terms: {
                field: 'userEmail',
                size: 10,
              },
              aggs: {
                endpoints_accessed: {
                  terms: {
                    field: 'urlPath',
                    size: 10,
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

    return await this.http.post(`/${process.env.ELASTIC_INDEX}/_search`, body);
  }

  // 8. Comparativo com Semana Anterior
  async getWeeklyComparison(serviceName?: string, companyId?: string) {
    const currentWeek = this.getTimeData();
    const previousWeek = this.getPreviousWeekTimeData();

    const filters: any[] = [];
    if (serviceName) filters.push(this.getServiceFilter(serviceName));
    if (companyId) filters.push(this.getCompanyFilter(companyId));

    const body = {
      size: 0,
      query: {
        bool: {
          filter: [
            {
              range: {
                dateTime: {
                  gte: previousWeek.startISO,
                  lte: currentWeek.endISO,
                  format: 'strict_date_optional_time',
                },
              },
            },
            ...filters,
          ],
        },
      },
      aggs: {
        current_week: {
          filter: {
            range: {
              dateTime: {
                gte: currentWeek.startISO,
                lte: currentWeek.endISO,
              },
            },
          },
          aggs: {
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
            unique_users: {
              cardinality: {
                field: 'userEmail',
              },
            },
            unique_endpoints: {
              cardinality: {
                field: 'urlPath',
              },
            },
          },
        },
        previous_week: {
          filter: {
            range: {
              dateTime: {
                gte: previousWeek.startISO,
                lte: previousWeek.endISO,
              },
            },
          },
          aggs: {
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
            unique_users: {
              cardinality: {
                field: 'userEmail',
              },
            },
            unique_endpoints: {
              cardinality: {
                field: 'urlPath',
              },
            },
          },
        },
      },
    };

    return await this.http.post(`/${process.env.ELASTIC_INDEX}/_search`, body);
  }
}
