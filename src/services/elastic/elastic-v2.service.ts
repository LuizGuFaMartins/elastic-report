import { Injectable } from '@nestjs/common';
import { ElasticHttpService } from './elastic-http.service';
import { DayjsService } from '../commom/dayjs.service';

@Injectable()
export class ElasticServiceV2 {
  private dayjs: any;

  constructor(
    private readonly http: ElasticHttpService,
    private readonly dayjsService: DayjsService,
  ) {
    this.dayjs = this.dayjsService.getInstance();
  }

  private getTimeData() {
    const tz = process.env.ELASTIC_TIMEZONE;
    const end = this.dayjs().tz(tz);
    const start = end.subtract(7, 'day');
    return {
      startISO: start.toISOString(),
      endISO: end.toISOString(),
      startMillis: start.valueOf(),
      endMillis: end.valueOf(),
      tz,
    };
  }

  private getDateRangeFilter(field: string = '@timestamp') {
    const { startISO, endISO } = this.getTimeData();
    return {
      range: {
        [field]: {
          gte: startISO,
          lte: endISO,
          format: 'strict_date_optional_time',
        },
      },
    };
  }

  private getServiceFilter(service: string) {
    return {
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
    };
  }

  async getLatency(serviceName: string) {
    const body = {
      size: 0,
      query: {
        bool: {
          filter: [
            this.getServiceFilter(serviceName),
            this.getDateRangeFilter(),
            { term: { 'processor.event': 'transaction' } },
          ],
        },
      },
      aggs: {
        avg_latency: {
          avg: {
            field: 'transaction.duration.us',
          },
        },
      },
    };

    return await this.http.post('/_search', body);
  }

  async getThroughput(serviceName: string) {
    const { tz } = this.getTimeData();
    const body = {
      size: 0,
      query: {
        bool: {
          filter: [
            this.getServiceFilter(serviceName),
            { term: { 'processor.event': 'transaction' } },
            this.getDateRangeFilter(),
          ],
        },
      },
      aggs: {
        per_day: {
          date_histogram: {
            field: '@timestamp',
            calendar_interval: 'day',
            time_zone: tz,
          },
        },
      },
    };

    return await this.http.post('/_search', body);
  }

  async getErrorRate(serviceName: string) {
    const { tz } = this.getTimeData();
    const body = {
      size: 0,
      query: {
        bool: {
          filter: [
            this.getServiceFilter(serviceName),
            this.getDateRangeFilter(),
          ],
        },
      },
      aggs: {
        errors: {
          filter: {
            term: { 'event.outcome': 'failure' },
          },
        },
        total: {
          filter: {
            exists: { field: 'event.outcome' },
          },
        },
      },
    };

    return await this.http.post('/_search', body);
  }

  async getTopFailedTransactions(serviceName: string) {
    const body = {
      size: 0,
      query: {
        bool: {
          filter: [
            { term: { 'processor.event': 'error' } },
            this.getServiceFilter(serviceName),
            this.getDateRangeFilter(),
          ],
        },
      },
      aggs: {
        by_transaction: {
          terms: {
            field: 'transaction.name',
            size: 10,
          },
        },
      },
    };

    return await this.http.post(`/${process.env.ELASTIC_INDEX}/_search`, body);
  }

  async getTransactionGroups(serviceName: string) {
    const body = {
      size: 0,
      query: {
        bool: {
          filter: [
            { term: { 'processor.event': 'transaction' } },
            this.getServiceFilter(serviceName),
            this.getDateRangeFilter(),
          ],
        },
      },
      aggs: {
        by_transaction: {
          terms: {
            field: 'transaction.name',
            size: 10,
            order: { _count: 'desc' },
          },
          aggs: {
            avg_duration: {
              avg: {
                field: 'transaction.duration.us',
              },
            },
          },
        },
      },
    };

    return await this.http.post(`/${process.env.ELASTIC_INDEX}/_search`, body);
  }

  async getTopUsersByMethod() {
    const { startISO, endISO, startMillis, endMillis, tz } = this.getTimeData();

    const body = {
      size: 0,
      query: {
        bool: {
          filter: [this.getDateRangeFilter('dateTime')],
          must_not: [
            {
              match_phrase: {
                urlPath: '/api/docs/v1/files/summarize',
              },
            },
          ],
        },
      },
      aggs: {
        top_users_by_method: {
          multi_terms: {
            terms: [
              { field: 'method.keyword' },
              { field: 'userEmail.keyword' },
            ],
            order: { _count: 'desc' },
            size: 10,
          },
          aggs: {
            per_day: {
              date_histogram: {
                field: 'dateTime.keyword',
                calendar_interval: 'day',
                time_zone: tz,
                extended_bounds: {
                  min: startMillis,
                  max: endMillis,
                },
              },
            },
          },
        },
      },
    };

    return await this.http.post(`/${process.env.ELASTIC_INDEX}/_search`, body);
  }
}
