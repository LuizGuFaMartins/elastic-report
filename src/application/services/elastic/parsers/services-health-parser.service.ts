import { Injectable } from '@nestjs/common';
import { ParserService } from '../../../../domain/abstracts/parser.service';

@Injectable()
export class ServicesHealthParser extends ParserService {
  private findPeakTraffic(buckets: any[], interval: 'hour' | 'day'): string {
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

  parse(currentWeekElasticData: any, lastWeekElasticData?: any) {
    const parseBuckets = (elasticData: any) => {
      return elasticData?.aggregations?.by_service?.buckets?.map((bucket) => {
        const name = bucket.key;
        const avgLatency = bucket.avg_latency?.value || 0;
        const volume = bucket.request_count?.value || 0;

        const errorCount = bucket.error_rate?.buckets?.errors?.doc_count || 0;
        const errorRate = volume > 0 ? errorCount / volume : 0;

        const dailyBuckets = bucket.daily_trend?.buckets || [];
        const peakTraffic = this.findPeakTraffic(dailyBuckets, 'day');

        return {
          name,
          avgLatency: `${Math.round(avgLatency)}ms`,
          volume: this.formatNumber(volume),
          errorRate: this.formatPercent(errorRate),
          peakTraffic,
        };
      });
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
            avgLatency: `${previous.avgLatency} -> ${current.avgLatency}`,
            volume: `${previous.volume} -> ${current.volume}`,
            errorRate: `${previous.errorRate} -> ${current.errorRate}`,
            peakTraffic: `${previous.peakTraffic} -> ${current.peakTraffic}`,
            currentPeakTraffic: `${current.peakTraffic}`,
            lastPeakTraffic: `${previous.peakTraffic}`,
          };
        }

        return current;
      });
    }

    return currentWeekData;
  }
}
