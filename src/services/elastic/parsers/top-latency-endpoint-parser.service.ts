import { Injectable } from '@nestjs/common';
import { ParserService } from './parser.interface';

@Injectable()
export class EndpointsParser implements ParserService {
  parse(endpoints: { highestLatency: any; highestErrors: any }): {
    highestLatency: {
      name: string;
      latency: string;
      volume: string;
    }[];
    highestErrors: {
      name: string;
      errorRate: string;
      totalErrors: string;
    }[];
  } {
    const formatNumber = (value: number) => {
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
      return value.toString();
    };

    const highestLatencyBuckets = endpoints?.highestLatency?.buckets || [];

    // Top 5 por latência média
    const highestLatency = [...highestLatencyBuckets]
      .filter((b) => b.avg_response_time?.value != null)
      .sort((a, b) => b.avg_response_time.value - a.avg_response_time.value)
      .slice(0, 5)
      .map((bucket) => ({
        name: bucket.key,
        latency: `${Math.round(bucket.avg_response_time.value)}ms`,
        volume: formatNumber(bucket.total_requests.value || bucket.doc_count),
      }));

    const highestErrorsBuckets = endpoints?.highestErrors?.buckets || [];
    // Top 5 por taxa de erro (assumindo que você tem `errors` e `total_requests`)
    const highestErrors = [...highestErrorsBuckets]
      .filter(
        (b) =>
          b.total_requests?.value > 0 &&
          b.errors?.value != null &&
          b.errors?.value > 0,
      )
      .map((b) => {
        const errorRate = (b.errors.value / b.total_requests.value) * 100;
        return {
          name: b.key,
          errorRate: `${errorRate.toFixed(2)}%`,
          totalErrors: formatNumber(b.errors.value),
        };
      })
      .sort((a, b) => parseFloat(b.errorRate) - parseFloat(a.errorRate))
      .slice(0, 5);

    return { highestLatency, highestErrors };
  }
}
