import { Injectable } from '@nestjs/common';
import { ApmHttpService } from './apm-http.service';
import { DayjsService } from 'src/domain/commom/dayjs.service';
import { QueryService } from 'src/domain/abstracts/query.service';
import { apmErrorsAnalysisAggs } from './aggregations/apm-errors-analysis-aggs';
import { apmServiceErrorsAggs } from './aggregations/apm-services-errors-aggs';
import { apmUnitErrorsAggs } from './aggregations/apm-unit-errors-aggs';
import { QueryFilter } from 'src/domain/models/dtos/query-filters.interface';
import { apmHttpAnalysisAggs } from './aggregations/apm-http-analysis-aggs';

@Injectable()
export class ApmQueryService extends QueryService {
  constructor(
    private readonly apmHttp: ApmHttpService,
    private readonly dayjsService: DayjsService,
  ) {
    super();
    this.dayjs = this.dayjsService.getInstance();
  }

  public getServiceFilter(services: string[]): any {
    return {
      bool: {
        should: [
          ...services?.map((service) => {
            return {
              bool: {
                should: [
                  {
                    term: {
                      'service.name': service,
                    },
                  },
                ],
                minimum_should_match: 1,
              },
            };
          }),
        ],
        minimum_should_match: 1,
      },
    };
  }

  public getCompanyFilter(companyId?: string): any {
    if (!companyId) return null;
    return {
      bool: {
        should: [
          {
            bool: {
              should: [
                {
                  term: {
                    companyId: {
                      value: companyId,
                    },
                  },
                },
              ],
              minimum_should_match: 1,
            },
          },
        ],
        minimum_should_match: 1,
      },
    };
  }

  public buildQueryFilters(filters: QueryFilter) {
    const query: any = [this.getDateRangeFilter(filters?.period, '@timestamp')];
    if (filters?.services) query.push(this.getServiceFilter(filters?.services));
    if (filters?.companyId)
      query.push(this.getCompanyFilter(filters?.companyId));

    return {
      bool: {
        filter: query,
      },
    };
  }

  async getApmErrorAnalysis(filters: QueryFilter) {
    const query: any = this.buildQueryFilters(filters);

    const body = {
      size: 0,
      query: {
        ...query,
      },
      aggs: {
        ...apmErrorsAnalysisAggs,
      },
    };

    return await this.apmHttp.post(
      `/${process.env.APM_ERROR_LOGS_INDEX}/_search`,
      body,
    );
  }

  async getApmErrorsByUnit(filters: QueryFilter) {
    const query: any = this.buildQueryFilters(filters);

    const body = {
      size: 0,
      query: {
        ...query,
      },
      aggs: {
        ...apmUnitErrorsAggs,
      },
    };

    return await this.apmHttp.post(
      `/${process.env.APM_ERROR_LOGS_INDEX}/_search`,
      body,
    );
  }

  async getApmErrorsByService(filters: QueryFilter) {
    const query: any = this.buildQueryFilters(filters);

    const body = {
      size: 0,
      query: {
        ...query,
      },
      aggs: {
        ...apmServiceErrorsAggs,
      },
    };

    return await this.apmHttp.post(
      `/${process.env.APM_ERROR_LOGS_INDEX}/_search`,
      body,
    );
  }

  async getApmHttpAnalysis(filters: QueryFilter) {
    const query: any = this.buildQueryFilters(filters);

    const body = {
      size: 0,
      query: {
        ...query,
      },
      aggs: {
        ...apmHttpAnalysisAggs,
      },
    };

    return await this.apmHttp.post(
      `/${process.env.APM_ERROR_LOGS_INDEX}/_search`,
      body,
    );
  }
}
