import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { ElasticHttpService } from './elastic-http.service';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class ElasticService {
  constructor(private readonly kibanaHttp: ElasticHttpService) {}

  private getTimeRange() {
    const tz = dayjs.tz.guess();
    const end = dayjs().tz(tz);
    const start = end.subtract(7, 'day');
    return {
      gte: start.toISOString(),
      lte: end.toISOString(),
    };
  }

  private buildQueryFilters(serviceName: string, processorEvent: string) {
    return {
      bool: {
        filter: [
          { term: { 'processor.event': processorEvent } },
          { term: { 'service.name': serviceName } },
          { range: { '@timestamp': this.getTimeRange() } },
        ],
      },
    };
  }

  async getLatency(serviceName: string) {
    const body = {
      size: 0,
      query: this.buildQueryFilters(serviceName, 'transaction'),
      aggs: {
        avg_latency: { avg: { field: 'transaction.duration.us' } },
      },
    };

    return this.search('logs-apm.transaction-default', body);
  }

  async getThroughput(serviceName: string) {
    const body = {
      size: 0,
      query: this.buildQueryFilters(serviceName, 'transaction'),
      aggs: {
        throughput: {
          date_histogram: {
            field: '@timestamp',
            fixed_interval: '1d',
          },
        },
      },
    };

    return this.search('logs-apm.transaction-default', body);
  }

  async getErrorRate(serviceName: string) {
    const body = {
      size: 0,
      query: this.buildQueryFilters(serviceName, 'error'),
      aggs: {
        error_count: { value_count: { field: 'error.id' } },
      },
    };

    return this.search('logs-apm.error-default', body);
  }

  async getTopFailedTransactions(serviceName: string) {
    const body = {
      size: 0,
      query: this.buildQueryFilters(serviceName, 'error'),
      aggs: {
        by_transaction: {
          terms: { field: 'transaction.name', size: 10 },
          aggs: {
            errors: { value_count: { field: 'error.id' } },
          },
        },
      },
    };

    return this.search('logs-apm.error-default', body);
  }

  async getTransactionGroups(serviceName: string) {
    const body = {
      size: 0,
      query: this.buildQueryFilters(serviceName, 'transaction'),
      aggs: {
        transaction_groups: {
          terms: { field: 'transaction.name', size: 10 },
          aggs: {
            avg_latency: { avg: { field: 'transaction.duration.us' } },
            count: { value_count: { field: 'transaction.id' } },
          },
        },
      },
    };

    return this.search('logs-apm.transaction-default', body);
  }

  private async search(index: string, body: any) {
    try {
      const response = await this.kibanaHttp.post(`/${index}/_search`, body);
      console.log(`✅ [${index}] Consulta executada com sucesso`);
      return response;
    } catch (error) {
      console.error(
        `❌ [${index}] Erro na consulta:`,
        error?.response?.data || error?.message,
      );
    }
  }
}
