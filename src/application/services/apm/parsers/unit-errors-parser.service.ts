import { Injectable } from '@nestjs/common';
import { ParserService } from '../../../../domain/abstracts/parser.service';

@Injectable()
export class ApmUnitErrorsParser extends ParserService {
  parse(currentWeekElasticData: any, lastWeekElasticData?: any) {
    const currentWeekData =
      currentWeekElasticData?.aggregations?.errors_by_unit?.buckets?.map(
        (bucket) => {
          const name = bucket.key;
          const errors = bucket.doc_count || 0;

          return {
            name,
            errors: this.formatNumber(errors),
          };
        },
      ) || [];

    if (lastWeekElasticData) {
      const lastWeekData =
        lastWeekElasticData?.aggregations?.errors_by_unit?.buckets?.map(
          (bucket) => {
            const name = bucket.key;
            const errors = bucket.doc_count || 0;

            return {
              name,
              errors: this.formatNumber(errors),
            };
          },
        ) || [];

      return currentWeekData.map((current) => {
        const previous = lastWeekData.find(
          (last) => last.name === current.name,
        );

        if (previous) {
          return {
            name: current.name,
            errors: `${previous.errors} -> ${current.errors}`,
          };
        }

        return current;
      });
    }

    return currentWeekData;
  }
}
