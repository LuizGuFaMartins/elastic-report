import { Injectable } from '@nestjs/common';
import { ParserService } from '../../../../domain/abstracts/parser.service';

@Injectable()
export class EstatisticsParser extends ParserService { 

  private calculateTrend(buckets: Array<{ doc_count: number }>): {
    trend: string;
    change: string;
  } {
    if (buckets.length < 2) {
      return { trend: 'neutral', change: '→ 0%' };
    }

    const recentBuckets = buckets.slice(-3);
    const values = recentBuckets.map((b) => b.doc_count);

    const firstHalf = values.slice(0, Math.ceil(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const percentChange =
      firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    let trend: string;
    let changeSymbol: string;

    if (Math.abs(percentChange) < 5) {
      trend = 'neutral';
      changeSymbol = '→';
    } else if (percentChange > 0) {
      trend = 'positive';
      changeSymbol = '↑';
    } else {
      trend = 'negative';
      changeSymbol = '↓';
    }

    return {
      trend,
      change: `${changeSymbol} ${Math.abs(percentChange).toFixed(1)}%`,
    };
  }

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
  ): string {
    if (!dailyBuckets || dailyBuckets.length === 0) {
      return '0';
    }

    const totalRequests = dailyBuckets.reduce(
      (sum, bucket) => sum + bucket.doc_count,
      0,
    );
    const totalDays = dailyBuckets.length;
    const avgRequestsPerDay = totalRequests / totalDays;
    const avgRequestsPerMinute = avgRequestsPerDay / (24 * 60);

    return this.formatNumber(Math.round(avgRequestsPerMinute));
  }

  parse(elasticsearchResponse: any, previousWeekData?: any) {
    const aggs = elasticsearchResponse.aggregations;

    const totalLatencyValue = aggs.total_latency.value || 0;
    const totalRequestsValue = aggs.total_requests.value || 0;
    const errorCountValue = aggs.error_count.doc_count || 0;
    const successCountValue = aggs.success_count.doc_count || 0;

    const totalLatency = this.formatTime(totalLatencyValue);
    const totalRequests = this.formatNumber(totalRequestsValue);
    const totalErrors = this.formatNumber(errorCountValue);
    const totalSuccess = this.formatNumber(successCountValue);

    const avgLatencyValue =
      totalRequestsValue > 0 ? totalLatencyValue / totalRequestsValue : 0;
    const avgLatency = Math.round(avgLatencyValue).toString();

    const errorRateValue =
      totalRequestsValue > 0 ? (errorCountValue / totalRequestsValue) * 100 : 0;
    const errorRate = errorRateValue.toFixed(2);

    const successRateValue =
      totalRequestsValue > 0
        ? (successCountValue / totalRequestsValue) * 100
        : 0;
    const successRate = successRateValue.toFixed(2);

    let latencyTrend = 'neutral';
    let latencyChange = '→ 0ms';

    let avgLatencyTrend = 'neutral';
    let avgLatencyChange = '→ 0ms';

    let errorTrend = 'neutral';
    let errorChange = '→ 0%';

    let successTrend = 'neutral';
    let successChange = '→ 0%';

    if (previousWeekData) {
      const prevTotalLatency =
        previousWeekData.aggregations.total_latency.value || 0;
      const prevTotalRequests =
        previousWeekData.aggregations.total_requests.value || 0;
      const prevErrorCount =
        previousWeekData.aggregations.error_count.doc_count || 0;
      const prevSuccessCount =
        previousWeekData.aggregations.success_count.doc_count || 0;

      const latencyDiff = totalLatencyValue - prevTotalLatency;
      if (Math.abs(latencyDiff) < 1000) {
        latencyTrend = 'neutral';
        latencyChange = '→ 0ms';
      } else if (latencyDiff > 0) {
        latencyTrend = 'negative';
        latencyChange = `↑ ${this.formatTime(latencyDiff)}`;
      } else {
        latencyTrend = 'positive';
        latencyChange = `↓ ${this.formatTime(Math.abs(latencyDiff))}`;
      }

      const prevAvgLatency =
        prevTotalRequests > 0 ? prevTotalLatency / prevTotalRequests : 0;
      const avgLatencyDiff = avgLatencyValue - prevAvgLatency;
      if (Math.abs(avgLatencyDiff) < 10) {
        avgLatencyTrend = 'neutral';
        avgLatencyChange = '→ 0ms';
      } else if (avgLatencyDiff > 0) {
        avgLatencyTrend = 'negative';
        avgLatencyChange = `↑ ${Math.round(avgLatencyDiff)}ms`;
      } else {
        avgLatencyTrend = 'positive';
        avgLatencyChange = `↓ ${Math.round(Math.abs(avgLatencyDiff))}ms`;
      }

      const prevErrorRate =
        prevTotalRequests > 0 ? (prevErrorCount / prevTotalRequests) * 100 : 0;
      const errorDiff = errorRateValue - prevErrorRate;
      if (Math.abs(errorDiff) < 0.01) {
        errorTrend = 'neutral';
        errorChange = '→ 0%';
      } else if (errorDiff > 0) {
        errorTrend = 'negative';
        errorChange = `↑ ${errorDiff.toFixed(2)}%`;
      } else {
        errorTrend = 'positive';
        errorChange = `↓ ${Math.abs(errorDiff).toFixed(2)}%`;
      }

      const prevSuccessRate =
        prevTotalRequests > 0
          ? (prevSuccessCount / prevTotalRequests) * 100
          : 0;
      const successDiff = successRateValue - prevSuccessRate;
      if (Math.abs(successDiff) < 0.01) {
        successTrend = 'neutral';
        successChange = '→ 0%';
      } else if (successDiff > 0) {
        successTrend = 'positive';
        successChange = `↑ ${successDiff.toFixed(2)}%`;
      } else {
        successTrend = 'negative';
        successChange = `↓ ${Math.abs(successDiff).toFixed(2)}%`;
      }
    }

    const throughput = this.calculateThroughput(aggs.daily_throughput.buckets);
    const throughputTrendData = this.calculateTrend(
      aggs.daily_throughput.buckets,
    );
    const requestsTrendData = this.calculateTrend(
      aggs.daily_throughput.buckets,
    );

    const peakTrafficHourly = this.findPeakTraffic(
      aggs.hourly_traffic.buckets,
      'hour',
    );
    const peakTrafficDaily = this.findPeakTraffic(
      aggs.daily_throughput.buckets,
      'day',
    );

    return {
      totalLatency,
      latencyTrend,
      latencyChange,

      avgLatency,
      avgLatencyTrend: avgLatencyTrend,
      avgLatencyChange: avgLatencyChange,

      throughput: throughput + '/min',
      throughputTrend: throughputTrendData.trend,
      throughputChange: throughputTrendData.change,

      errorRate,
      errorTrend,
      errorChange,

      successRate,
      successTrend,
      successChange,

      totalRequests,
      requestsTrend: requestsTrendData.trend,
      requestsChange: requestsTrendData.change,

      totalErrors,
      totalSuccess,

      peakTrafficHourly,
      peakTrafficDaily,
    };
  }
}
