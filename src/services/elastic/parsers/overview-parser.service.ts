import { Injectable } from '@nestjs/common';
import { ParserService } from './parser.interface';

@Injectable()
export class OverviewParser implements ParserService {
  private formatNumber(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  }

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
    hourlyBuckets: Array<{ key_as_string: string; doc_count: number }>,
  ): string {
    if (!hourlyBuckets || hourlyBuckets.length === 0) {
      return 'Sem dados de pico disponíveis';
    }

    const peakBucket = hourlyBuckets.reduce((max, current) =>
      current.doc_count > max.doc_count ? current : max,
    );

    const peakDate = new Date(peakBucket.key_as_string);
    const dayOfWeek = peakDate.toLocaleDateString('pt-BR', { weekday: 'long' });
    const date = peakDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
    const time = peakDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${dayOfWeek}, ${date} às ${time} - ${this.formatNumber(peakBucket.doc_count)} req/h`;
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

    const avgLatencyMs = aggs.avg_latency.value || 0;
    const avgLatency =
      avgLatencyMs > 0 ? Math.round(avgLatencyMs).toString() : '0';

    let latencyTrend = 'neutral';
    let latencyChange = '→ 0ms';

    if (previousWeekData) {
      const prevLatency = previousWeekData.aggregations.avg_latency.value || 0;
      const diff = avgLatencyMs - prevLatency;
      const percentChange =
        prevLatency > 0 ? Math.abs(diff / prevLatency) * 100 : 0;

      if (Math.abs(diff) < 10) {
        latencyTrend = 'neutral';
        latencyChange = '→ 0ms';
      } else if (diff > 0) {
        latencyTrend = 'negative';
        latencyChange = `↑ ${Math.round(diff)}ms`;
      } else {
        latencyTrend = 'positive';
        latencyChange = `↓ ${Math.round(Math.abs(diff))}ms`;
      }
    }

    const throughput = this.calculateThroughput(aggs.daily_throughput.buckets);
    const throughputTrendData = this.calculateTrend(
      aggs.daily_throughput.buckets,
    );

    const totalReqs = aggs.error_rate.buckets.total.doc_count;
    const errorReqs = aggs.error_rate.buckets.errors.doc_count;
    const errorRateValue = totalReqs > 0 ? (errorReqs / totalReqs) * 100 : 0;
    const errorRate = errorRateValue.toFixed(2);

    let errorTrend = 'neutral';
    let errorChange = '→ 0%';

    if (previousWeekData) {
      const prevTotal =
        previousWeekData.aggregations.error_rate.buckets.total.doc_count;
      const prevErrors =
        previousWeekData.aggregations.error_rate.buckets.errors.doc_count;
      const prevErrorRate = prevTotal > 0 ? (prevErrors / prevTotal) * 100 : 0;
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
    }

    const availabilityTotal = aggs.availability.buckets.total.doc_count;
    const availabilitySuccess = aggs.availability.buckets.success.doc_count;
    const availabilityValue =
      availabilityTotal > 0
        ? (availabilitySuccess / availabilityTotal) * 100
        : 100;
    const availability = availabilityValue.toFixed(2);

    let availabilityTrend = 'neutral';
    let availabilityChange = '→ 0%';

    if (previousWeekData) {
      const prevAvailTotal =
        previousWeekData.aggregations.availability.buckets.total.doc_count;
      const prevAvailSuccess =
        previousWeekData.aggregations.availability.buckets.success.doc_count;
      const prevAvailability =
        prevAvailTotal > 0 ? (prevAvailSuccess / prevAvailTotal) * 100 : 100;
      const availDiff = availabilityValue - prevAvailability;

      if (Math.abs(availDiff) < 0.1) {
        availabilityTrend = 'neutral';
        availabilityChange = '→ 0%';
      } else if (availDiff > 0) {
        availabilityTrend = 'positive';
        availabilityChange = `↑ ${availDiff.toFixed(2)}%`;
      } else {
        availabilityTrend = 'negative';
        availabilityChange = `↓ ${Math.abs(availDiff).toFixed(2)}%`;
      }
    }

    const totalRequestsValue = aggs.total_requests.value;
    const totalRequests = this.formatNumber(totalRequestsValue);
    const requestsTrendData = this.calculateTrend(
      aggs.daily_throughput.buckets,
    );

    const peakTraffic = this.findPeakTraffic(aggs.hourly_traffic.buckets);

    return {
      avgLatency,
      latencyTrend,
      latencyChange,

      throughput: throughput + '/min',
      throughputTrend: throughputTrendData.trend,
      throughputChange: throughputTrendData.change,

      errorRate,
      errorTrend,
      errorChange,

      availability,
      availabilityTrend,
      availabilityChange,

      totalRequests,
      requestsTrend: requestsTrendData.trend,
      requestsChange: requestsTrendData.change,

      peakTraffic,
    };
  }
}
