import { Injectable } from '@nestjs/common';
import { ParserService } from './parser.interface';

@Injectable()
export class ServicesHealthParser implements ParserService {
  parse(data) {
    const formatNumber = (value) =>
      Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(
        value || 0,
      );

    const formatPercent = (value) => `${(value * 100).toFixed(2)}%`;

    const services =
      data?.aggregations?.by_service?.buckets?.map((bucket) => {
        const name = bucket.key;
        const avgLatency = bucket.avg_latency?.value || 0;
        const volume = bucket.request_count?.value || 0;

        const errorCount = bucket.error_rate?.buckets?.errors?.doc_count || 0;
        const errorRate = volume > 0 ? errorCount / volume : 0;

        const dailyBuckets = bucket.daily_trend?.buckets || [];

        const last2Days = dailyBuckets.slice(-2).filter((b) => b.doc_count > 0);
        const prev2Days = dailyBuckets
          .slice(-4, -2)
          .filter((b) => b.doc_count > 0);

        const avgLast2 =
          last2Days.reduce(
            (sum, b) => sum + (b.daily_avg_latency?.value || 0),
            0,
          ) / (last2Days.length || 1);
        const avgPrev2 =
          prev2Days.reduce(
            (sum, b) => sum + (b.daily_avg_latency?.value || 0),
            0,
          ) / (prev2Days.length || 1);

        const changePercent =
          avgPrev2 > 0 ? ((avgLast2 - avgPrev2) / avgPrev2) * 100 : 0;
        const changes =
          changePercent > 20
            ? 'Latência aumentou'
            : changePercent < -20
              ? 'Latência melhorou'
              : 'Sem alterações';

        // Status baseado em latência e erro
        let status = 'success';
        if (avgLatency >= 600 || errorRate >= 0.015) {
          status = 'error';
        } else if (avgLatency >= 300 || errorRate >= 0.005) {
          status = 'warning';
        }

        return {
          name,
          status,
          avgLatency: `${Math.round(avgLatency)}ms`,
          volume: formatNumber(volume),
          errorRate: formatPercent(errorRate),
          changes,
        };
      }) || [];

    return services;
  }
}
