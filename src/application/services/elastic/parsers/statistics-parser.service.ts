import { Injectable } from '@nestjs/common';
import { ParserService } from '../../../../domain/abstracts/parser.service';

@Injectable()
export class StatisticsParser extends ParserService {
  private findPeakTraffic(
    buckets: Array<{ key_as_string: string; doc_count: number }>,
    interval: 'hour' | 'day',
  ): string {
    if (!buckets || buckets.length === 0) {
      return 'Sem dados de pico disponíveis';
    }

    const peakBucket = buckets.reduce((max, current) =>
      current.doc_count > max.doc_count ? current : max,
    );

    const peakDate = new Date(peakBucket.key_as_string);
    const dayOfWeek = peakDate.toLocaleDateString('pt-BR', { weekday: 'long' });
    const date = peakDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });

    if (interval === 'hour') {
      const time = peakDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${dayOfWeek}, ${date} às ${time} - ${this.formatNumber(peakBucket.doc_count)} req/h`;
    } else {
      return `${dayOfWeek}, ${date} - ${this.formatNumber(peakBucket.doc_count)} req/dia`;
    }
  }

  private calculateThroughput(
    dailyBuckets: Array<{ doc_count: number }>,
  ): number {
    if (!dailyBuckets || dailyBuckets?.length === 0) {
      return 0;
    }

    const totalRequests = dailyBuckets?.reduce(
      (sum, bucket) => sum + bucket?.doc_count,
      0,
    );
    const totalDays = dailyBuckets?.length;
    const avgRequestsPerDay = totalRequests / totalDays;
    const avgRequestsPerMinute = avgRequestsPerDay / (24 * 60);

    return +(this.formatNumber(Math.round(avgRequestsPerMinute)) || '0');
  }

  private formatElasticData(aggs: any) {
    const totalLatencyValue = +(aggs?.total_latency?.value || '0');
    const avgLatencyValue = +(aggs?.avg_latency?.value?.toFixed(2) || '0');
    const totalRequestsValue = +(aggs?.total_requests?.value || '0');
    const errorCountValue = +(aggs?.error_count.doc_count || '0');
    const successCountValue = +(aggs?.success_count.doc_count || '0');

    const errorRateValue =
      totalRequestsValue > 0 ? (errorCountValue / totalRequestsValue) * 100 : 0;
    const errorRate = +(errorRateValue?.toFixed(2) || '0');

    const successRateValue =
      totalRequestsValue > 0
        ? (successCountValue / totalRequestsValue) * 100
        : 0;
    const successRate = +(successRateValue.toFixed(2) || '0');

    const throughput = this.calculateThroughput(
      aggs?.daily_throughput?.buckets,
    );

    const peakTrafficHourly = this.findPeakTraffic(
      aggs?.hourly_traffic.buckets,
      'hour',
    );
    const peakTrafficDaily = this.findPeakTraffic(
      aggs?.daily_throughput.buckets,
      'day',
    );

    return {
      totalLatency: totalLatencyValue,
      avgLatency: avgLatencyValue,
      throughput: throughput,
      errorRate,
      successRate,
      totalRequests: totalRequestsValue,
      totalErrors: errorCountValue,
      totalSuccess: successCountValue,
      peakTrafficHourly,
      peakTrafficDaily,
    };
  }

  private calculateTrend(currentWeekData: any, lastWeekData: any) {
    const latencyDiff =
      currentWeekData?.totalLatency - lastWeekData?.totalLatency;
    let latencyTrend = 'neutral';
    let latencyChange = '→ 0ms';
    if (Math.abs(latencyDiff) == 0) {
      latencyTrend = 'neutral';
      latencyChange = '→ 0ms';
    } else if (latencyDiff > 0) {
      latencyTrend = 'negative';
      latencyChange = `↑ ${this.formatTime(latencyDiff)}`;
    } else {
      latencyTrend = 'positive';
      latencyChange = `↓ ${this.formatTime(latencyDiff)}`;
    }

    const avgLatencyDiff =
      currentWeekData?.avgLatency - lastWeekData?.avgLatency;
    let avgLatencyTrend = 'neutral';
    let avgLatencyChange = '→ 0ms';
    if (Math.abs(avgLatencyDiff) == 10) {
      avgLatencyTrend = 'neutral';
      avgLatencyChange = '→ 0ms';
    } else if (avgLatencyDiff > 0) {
      avgLatencyTrend = 'negative';
      avgLatencyChange = `↑ ${Math.round(avgLatencyDiff)}ms`;
    } else {
      avgLatencyTrend = 'positive';
      avgLatencyChange = `↓ ${Math.round(Math.abs(avgLatencyDiff))}ms`;
    }

    const throughputDiff =
      currentWeekData?.throughput - lastWeekData?.throughput;
    let throughputTrend = 'neutral';
    let throughputChange = '→ 0min';
    if (Math.abs(throughputDiff) == 0) {
      throughputChange = '→ 0min';
    } else if (throughputDiff > 0) {
      throughputChange = `↑ ${throughputDiff} /min`;
    } else {
      throughputChange = `↓ ${throughputDiff} /min`;
    }

    const errorDiff = currentWeekData?.errorRate - lastWeekData?.errorRate;
    let errorTrend = 'neutral';
    let errorChange = '→ 0%';
    if (Math.abs(errorDiff) == 0) {
      errorTrend = 'neutral';
      errorChange = '→ 0%';
    } else if (errorDiff > 0) {
      errorTrend = 'negative';
      errorChange = `↑ ${errorDiff.toFixed(2)}%`;
    } else {
      errorTrend = 'positive';
      errorChange = `↓ ${Math.abs(errorDiff).toFixed(2)}%`;
    }

    const totalErrorDiff =
      currentWeekData?.totalErrors - lastWeekData?.totalErrors;
    let totalErrorTrend = 'neutral';
    let totalErrorChange = '→ 0';
    if (totalErrorDiff == 0) {
      totalErrorTrend = 'neutral';
      totalErrorChange = '→ 0';
    } else if (totalErrorDiff > 0) {
      totalErrorTrend = 'negative';
      totalErrorChange = `↑ ${this.formatNumber(totalErrorDiff)}`;
    } else {
      totalErrorTrend = 'positive';
      totalErrorChange = `↓ ${this.formatNumber(totalErrorDiff)}`;
    }

    const successDiff =
      currentWeekData?.successRate - lastWeekData?.successRate;
    let successTrend = 'neutral';
    let successChange = '→ 0%';
    if (Math.abs(successDiff) == 0) {
      successTrend = 'neutral';
      successChange = '→ 0%';
    } else if (successDiff > 0) {
      successTrend = 'positive';
      successChange = `↑ ${successDiff.toFixed(2)}%`;
    } else {
      successTrend = 'negative';
      successChange = `↓ ${Math.abs(successDiff).toFixed(2)}%`;
    }

    const totalSuccessDiff =
      currentWeekData?.totalSuccess - lastWeekData?.totalSuccess;
    let totalSuccessTrend = 'neutral';
    let totalSuccessChange = '→ 0';
    if (totalSuccessDiff == 0) {
      totalSuccessTrend = 'neutral';
      totalSuccessChange = '→ 0';
    } else if (totalSuccessDiff > 0) {
      totalSuccessTrend = 'positive';
      totalSuccessChange = `↑ ${this.formatNumber(totalSuccessDiff)}`;
    } else {
      totalSuccessTrend = 'negative';
      totalSuccessChange = `↓ ${this.formatNumber(totalSuccessDiff)}`;
    }

    const requestsDiff =
      currentWeekData?.totalRequests - lastWeekData?.totalRequests;
    let requestsTrend = 'neutral';
    let requestsChange = '→ 0';
    if (Math.abs(requestsDiff) == 0) {
      requestsChange = '→ 0';
    } else if (requestsDiff > 0) {
      requestsChange = `↑ ${this.formatNumber(requestsDiff)}`;
    } else {
      requestsChange = `↓ ${this.formatNumber(requestsDiff)}`;
    }

    return {
      latencyTrend,
      latencyChange,

      avgLatencyTrend,
      avgLatencyChange,

      throughputTrend,
      throughputChange,

      errorTrend,
      errorChange,

      totalErrorTrend,
      totalErrorChange,

      successTrend,
      successChange,

      totalSuccessTrend,
      totalSuccessChange,

      requestsTrend,
      requestsChange,
    };
  }

  parse(currentWeekElasticData: any, previousWeekElasticData?: any) {
    const currentWeekAggs: any = currentWeekElasticData.aggregations;
    const currentWeekData: any = this.formatElasticData(currentWeekAggs);

    const lastWeekAggs: any = previousWeekElasticData.aggregations;
    const lastWeekData: any = this.formatElasticData(lastWeekAggs);

    const trendstatistics = this.calculateTrend(currentWeekData, lastWeekData);

    return {
      currentWeek: {
        ...currentWeekData,
        totalLatency: this.formatTime(currentWeekData?.totalLatency),
        avgLatency: this.formatNumber(currentWeekData?.avgLatency),
        totalRequests: this.formatNumber(currentWeekData?.totalRequests),
        totalErrors: this.formatNumber(currentWeekData?.totalErrors),
        totalSuccess: this.formatNumber(currentWeekData?.totalSuccess),
        throughput: currentWeekData?.throughput + '/min',
      },
      lastWeek: {
        ...lastWeekData,
        totalLatency: this.formatTime(lastWeekData?.totalLatency),
        avgLatency: this.formatNumber(lastWeekData?.avgLatency),
        totalRequests: this.formatNumber(lastWeekData?.totalRequests),
        totalErrors: this.formatNumber(lastWeekData?.totalErrors),
        totalSuccess: this.formatNumber(lastWeekData?.totalSuccess),
        throughput: lastWeekData?.throughput + '/min',
      },
      ...trendstatistics,
    };
  }
}
