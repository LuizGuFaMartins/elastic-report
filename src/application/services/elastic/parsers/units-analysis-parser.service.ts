import { Injectable } from '@nestjs/common';
import { ParserService } from '../../../../domain/abstracts/parser.service';

@Injectable()
export class UnitAnalysisParser extends ParserService {
  parse(currentWeekElasticData: any, lastWeekElasticData?: any) {
    const parseBuckets = (elasticData: any) => {
      return (
        elasticData?.aggregations?.stats_by_company?.buckets?.map(
          (bucket: any) => {
            const name = bucket.key;
            const maxResponseTime = +(
              bucket.max_response_time?.value?.toFixed(2) || '0'
            );
            const avgResponseTime = +(
              bucket.avg_response_time?.value?.toFixed(2) || '0'
            );
            const p95 = +(
              bucket.percentiles_response_time?.values?.['95.0']?.toFixed(2) ||
              '0'
            );
            const p99 = +(
              bucket.percentiles_response_time?.values?.['99.0']?.toFixed(2) ||
              '0'
            );
            const volume = +(
              bucket.doc_count_per_company?.value?.toFixed(2) ||
              bucket.doc_count ||
              '0'
            );

            return {
              name,
              maxResponseTime: this.formatTime(maxResponseTime),
              avgResponseTime: this.formatTime(avgResponseTime),
              p95: this.formatTime(p95),
              p99: this.formatTime(p99),
              volume: this.formatNumber(volume),
            };
          },
        ) || []
      );
    };

    const currentWeekData = parseBuckets(currentWeekElasticData);

    if (lastWeekElasticData) {
      const lastWeekData = parseBuckets(lastWeekElasticData);

      return currentWeekData.map((current) => {
        const previous = lastWeekData.find(
          (last) => last.name === current.name,
        );

        if (previous) {
          return {
            name: current.name,
            maxResponseTime: `${previous.maxResponseTime} -> ${current.maxResponseTime}`,
            avgResponseTime: `${previous.avgResponseTime} -> ${current.avgResponseTime}`,
            p95: `${previous.p95} -> ${current.p95}`,
            p99: `${previous.p99} -> ${current.p99}`,
            volume: `${previous.volume} -> ${current.volume}`,
          };
        }

        return current;
      });
    }

    return currentWeekData;
  }
}
