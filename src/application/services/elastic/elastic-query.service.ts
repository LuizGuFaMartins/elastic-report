import { Injectable } from '@nestjs/common';
import { ElasticHttpService } from './elastic-http.service';
import { DayjsService } from 'src/domain/commom/dayjs.service';
import { QueryService } from 'src/domain/abstracts/query.service';
import { statisticsAggs } from './aggregations/statistics-aggs';
import { topEndpointsByLatencyAggs } from './aggregations/top-endpoints-by-latency-aggs';
import { topEndpointsByErrorsAggs } from './aggregations/top-endpoints-by-errors-aggs';
import { errorsAnalysisAggs } from './aggregations/errors-analysis-aggs';
import { serviceHealthAggs } from './aggregations/services-health-aggs';
import { usersAnalysisAggs } from './aggregations/users-analysis-aggs';
import { unitsAnalysisAggs } from './aggregations/units-analysis-aggs';
import { QueryFilter } from 'src/domain/models/dtos/query-filters.interface';

@Injectable()
export class ElasticQueryService extends QueryService {
  constructor(
    private readonly elasticHttp: ElasticHttpService,
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
                      software: {
                        value: service,
                      },
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

  async getOverviewStatistics(filters: QueryFilter) {
    const query: any = this.buildQueryFilters(filters);

    const body = {
      size: 0,
      query: {
        ...query,
      },
      aggs: {
        ...statisticsAggs,
      },
    };

    return await this.elasticHttp.post(
      `/${process.env.ELASTIC_REQUEST_LOGS_INDEX}/_search`,
      body,
    );
  }

  async getTopEndpointsByLatency(filters: QueryFilter) {
    const query: any = this.buildQueryFilters(filters);

    const body = {
      size: 0,
      query: {
        ...query,
      },
      aggs: {
        ...topEndpointsByLatencyAggs,
      },
    };

    return await this.elasticHttp.post(
      `/${process.env.ELASTIC_REQUEST_LOGS_INDEX}/_search`,
      body,
    );
  }

  async getTopEndpointsByErrors(filters: QueryFilter) {
    const query: any = this.buildQueryFilters(filters);

    const body = {
      size: 0,
      query: {
        ...query,
      },
      aggs: {
        ...topEndpointsByErrorsAggs,
      },
    };

    return await this.elasticHttp.post(
      `/${process.env.ELASTIC_REQUEST_LOGS_INDEX}/_search`,
      body,
    );
  }

  async getErrorAnalysis(filters: QueryFilter) {
    const query: any = this.buildQueryFilters(filters);

    const body = {
      size: 0,
      query: {
        ...query,
      },
      aggs: {
        ...errorsAnalysisAggs,
      },
    };

    return await this.elasticHttp.post(
      `/${process.env.ELASTIC_REQUEST_LOGS_INDEX}/_search`,
      body,
    );
  }

  async getServicesHealth(filters: QueryFilter) {
    const query: any = this.buildQueryFilters(filters);

    const body = {
      size: 0,
      query: {
        ...query,
      },
      aggs: {
        ...serviceHealthAggs,
      },
    };

    return await this.elasticHttp.post(
      `/${process.env.ELASTIC_REQUEST_LOGS_INDEX}/_search`,
      body,
    );
  }

  async getUserAnalysis(filters: QueryFilter) {
    const query: any = this.buildQueryFilters(filters);

    const body = {
      size: 0,
      query: {
        ...query,
      },
      aggs: {
        ...usersAnalysisAggs,
      },
    };

    return await this.elasticHttp.post(
      `/${process.env.ELASTIC_REQUEST_LOGS_INDEX}/_search`,
      body,
    );
  }

  async getUnitsAnalysis(filters: QueryFilter) {
    const query: any = this.buildQueryFilters(filters);

    const body = {
      size: 0,
      query: {
        ...query,
      },
      aggs: {
        ...unitsAnalysisAggs,
      },
    };

    return await this.elasticHttp.post(
      `/${process.env.ELASTIC_REQUEST_LOGS_INDEX}/_search`,
      body,
    );
  }
}
