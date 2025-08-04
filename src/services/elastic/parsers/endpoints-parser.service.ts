import { Injectable } from '@nestjs/common';
import { ParserService } from '../../abstracts/parser.service';

@Injectable()
export class EndpointsParser extends ParserService {
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

    const highestLatencyBuckets =
      endpoints?.highestLatency?.aggregations?.by_endpoint?.buckets || [];

    // Top 5 por latência média
    const highestLatency = [...highestLatencyBuckets]
      .filter((b) => b?.avg_response_time?.value != null)
      .sort((a, b) => +b?.avg_response_time.value - +a?.avg_response_time.value)
      .map((bucket) => ({
        name: bucket.key,
        latency: this.formatTime(Math.round(bucket.avg_response_time.value)),
        volume: formatNumber(bucket.total_requests.value || bucket.doc_count),
      }));

    const highestErrorsBuckets =
      endpoints?.highestErrors?.aggregations?.by_endpoint?.buckets
        ?.notStatusCode200?.endpoint?.buckets || [];

    // Top 5 por taxa de erro (assumindo que você tem `errors` e `total_requests`)
    const highestErrors = highestErrorsBuckets
      .flatMap((bucket) => {
        const url = bucket.key;
        const statusBuckets = bucket.by_status?.buckets || [];

        return statusBuckets.map((status) => ({
          name: url,
          statusCode: status.key,
          totalErrors: status.doc_count,
        }));
      })
      .sort((a, b) => +b.totalErrors - +a.totalErrors);

    return { highestLatency, highestErrors };
  }
}
