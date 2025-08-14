import { Injectable } from '@nestjs/common';
import { ParserService } from '../../../../domain/abstracts/parser.service';

@Injectable()
export class ApmServicesErrorsParser extends ParserService {
  parse(currentWeekElasticData: any, lastWeekElasticData?: any) {
    const mapData = (data: any) =>
      data?.aggregations?.errors_by_service?.buckets?.map((bucket) => {
        const name = bucket.key;
        const errors = bucket.doc_count || 0;
        const timeoutErrors = bucket.timeout_errors?.doc_count || 0;
        const deadlockErrors = bucket.deadlock_errors?.doc_count || 0;

        return {
          name,
          errors: this.formatNumber(errors),
          timeoutErrors: this.formatNumber(timeoutErrors),
          deadlockErrors: this.formatNumber(deadlockErrors),
        };
      }) || [];

    const currentWeekData = mapData(currentWeekElasticData);

    if (lastWeekElasticData) {
      const lastWeekData = mapData(lastWeekElasticData);

      return currentWeekData.map((current) => {
        const previous = lastWeekData.find(
          (last) => last.name === current.name,
        );

        if (previous) {
          return {
            name: current.name,
            errors: `${previous.errors} -> ${current.errors}`,
            timeoutErrors: `${previous.timeoutErrors} -> ${current.timeoutErrors}`,
            deadlockErrors: `${previous.deadlockErrors} -> ${current.deadlockErrors}`,
          };
        }

        return current;
      });
    }

    return currentWeekData;
  }
}
