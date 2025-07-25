import { Injectable } from '@nestjs/common';
import { KibanaHttpService } from './kibana-http.service';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class ElasticServiceV2 {
  constructor(private readonly kibanaHttp: KibanaHttpService) {}

  private getTimeData() {
    const tz = 'America/Sao_Paulo';
    const end = dayjs().tz(tz);
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

  async getLatency(serviceName: string) {
    const body = {
      size: 0,
      query: {
        bool: {
          filter: [
            { term: { 'service.name': serviceName } },
            { term: { 'processor.event': 'transaction' } },
            this.getDateRangeFilter(),
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

    return await this.kibanaHttp.post('/_search', body);
  }

  async getThroughput(serviceName: string) {
    const { tz } = this.getTimeData();
    const body = {
      size: 0,
      query: {
        bool: {
          filter: [
            { term: { 'service.name': serviceName } },
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

    return await this.kibanaHttp.post('/_search', body);
  }

  async getErrorRate(serviceName: string) {
    const { tz } = this.getTimeData();
    const body = {
      size: 0,
      query: {
        bool: {
          filter: [
            { term: { 'service.name': serviceName } },
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

    return await this.kibanaHttp.post('/_search', body);
  }

  async getTopFailedTransactions(serviceName: string) {
    const body = {
      size: 0,
      query: {
        bool: {
          filter: [
            { term: { 'processor.event': 'error' } },
            { term: { 'service.name': serviceName } },
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

    return await this.kibanaHttp.post(`/${process.env.ELASTIC_INDEX}/_search`, body);
  }

  async getTransactionGroups(serviceName: string) {
    const body = {
      size: 0,
      query: {
        bool: {
          filter: [
            { term: { 'processor.event': 'transaction' } },
            { term: { 'service.name': serviceName } },
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

    return await this.kibanaHttp.post(`/${process.env.ELASTIC_INDEX}/_search`, body);
  }

  async getTopUsersByMethod() {
    const { startISO, endISO, startMillis, endMillis, tz } = this.getTimeData();

    const body = {
      size: 0,
      query: {
        bool: {
          filter: [
            this.getDateRangeFilter('dateTime'),
          ],
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

    return await this.kibanaHttp.post(`/${process.env.ELASTIC_INDEX}/_search`, body);
  }
}
