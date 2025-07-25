import { Injectable } from '@nestjs/common';
import { ElasticHttpService } from './elastic-http.service';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class KibanaService {
  constructor(private readonly kibanaHttp: ElasticHttpService) {}

  private getTimeRange() {
    const tz = dayjs.tz.guess();
    const end = dayjs().tz(tz);
    const start = end.subtract(7, 'day');

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }

  private getBaseParams() {
    return {
      environment: 'ENVIRONMENT_ALL',
      kuery: '',
      transactionType: 'request',
      useDurationSummary: true    
    };
  }

  async getLatency(serviceName: string) {
    const endpoint = `/internal/apm/services/${serviceName}/transactions/charts/latency`;

    const params = {
      ...this.getBaseParams(),
      ...this.getTimeRange(),
      latencyAggregationType: 'avg',
      documentType: 'transactionMetric',
      rollupInterval: '60m',
      // offset: '1d',
      // documentType: 'serviceTransactionMetric',
      // rollupInterval: '1m',
      // bucketSizeInSeconds: 60,
    };

    return this.fetchFromKibana(endpoint, params);
  }

  async getThroughput(serviceName: string) {
    const endpoint = `/internal/apm/services/${serviceName}/transactions/charts/throughput`;

    const params = {
      ...this.getBaseParams(),
      ...this.getTimeRange(),
      documentType: 'transactionMetric',
      rollupInterval: '60m',
    };

    return this.fetchFromKibana(endpoint, params);
  }

  async getErrorRate(serviceName: string) {
    const endpoint = `/internal/apm/services/${serviceName}/transactions/charts/error_rate`;

    const params = {
      ...this.getBaseParams(),
      ...this.getTimeRange(),
      documentType: 'transactionMetric',
      rollupInterval: '60m',
    };

    return this.fetchFromKibana(endpoint, params);
  }

  async getTransactionGroups(serviceName: string) {
    const endpoint = `/internal/apm/services/${serviceName}/transactions/groups/main_statistics`;

    const params = {
      ...this.getBaseParams(),
      ...this.getTimeRange(),
      latencyAggregationType: 'avg',
      documentType: 'transactionMetric',
      useDurationSummary: true,
      rollupInterval: '60m'      
    };

    return this.fetchFromKibana(endpoint, params);
  }

  async getFailedTransactions(serviceName: string) {
    const endpoint = `/internal/apm/services/${serviceName}/errors/groups/main_statistics`;

    const params = {
      ...this.getBaseParams(),
      ...this.getTimeRange(),
    };

    return this.fetchFromKibana(endpoint, params);
  }

  private async fetchFromKibana(endpoint: string, params: any): Promise<any> {
    try {
      const data = await this.kibanaHttp.get(endpoint, params);
      console.log(`✅ [${endpoint}] Dados recebidos.`);
      return data;
    } catch (error) {
      console.error(
        `❌ [${endpoint}] Erro ao buscar APM:`,
        error?.response?.data || error?.message,
      );
    }
  }
}
