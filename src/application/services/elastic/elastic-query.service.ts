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

  async getOverviewStatistics(
    services?: string[],
    companyId?: string,
    period: 'week' | 'lastWeek' = 'week',
  ) {
    const filters = [this.getDateRangeFilter(period)];
    if (services) filters.push(this.getServiceFilter(services));
    if (companyId) filters.push(this.getCompanyFilter(companyId));

    const body = {
      size: 0,
      query: {
        bool: {
          filter: filters,
        },
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

  async getTopEndpointsByLatency(
    services?: string[],
    companyId?: string,
    period: 'week' | 'lastWeek' = 'week',
  ) {
    const filters = [this.getDateRangeFilter(period)];
    if (services) filters.push(this.getServiceFilter(services));
    if (companyId) filters.push(this.getCompanyFilter(companyId));

    const body = {
      size: 0,
      query: {
        bool: {
          filter: filters,
        },
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

  async getTopEndpointsByErrors(
    services?: string[],
    companyId?: string,
    period: 'week' | 'lastWeek' = 'week',
  ) {
    const filters = [this.getDateRangeFilter(period)];
    if (services) filters.push(this.getServiceFilter(services));
    if (companyId) filters.push(this.getCompanyFilter(companyId));

    const body = {
      size: 0,
      query: {
        bool: {
          filter: filters,
        },
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

  async getErrorAnalysis(
    services?: string[],
    companyId?: string,
    period: 'week' | 'lastWeek' = 'week',
  ) {
    const filters: any = [this.getDateRangeFilter(period)];
    if (services) filters.push(this.getServiceFilter(services));
    if (companyId) filters.push(this.getCompanyFilter(companyId));

    const body = {
      size: 0,
      query: {
        bool: {
          filter: filters,
        },
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

  async getServicesHealth(
    companyId?: string,
    period: 'week' | 'lastWeek' = 'week',
  ) {
    const filters = [this.getDateRangeFilter(period)];
    if (companyId) filters.push(this.getCompanyFilter(companyId));

    const body = {
      size: 0,
      query: {
        bool: {
          filter: filters,
        },
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

  async getUserAnalysis(
    services?: string[],
    companyId?: string,
    period: 'week' | 'lastWeek' = 'week',
  ) {
    const filters = [this.getDateRangeFilter(period)];
    if (services) filters.push(this.getServiceFilter(services));
    if (companyId) filters.push(this.getCompanyFilter(companyId));

    const body = {
      size: 0,
      query: {
        bool: {
          filter: filters,
        },
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

  async getUnitsAnalysis(
    services?: string[],
    companyId?: string,
    period: 'week' | 'lastWeek' = 'week',
  ) {
    const filters = [this.getDateRangeFilter(period)];
    if (services) filters.push(this.getServiceFilter(services));
    if (companyId) filters.push(this.getCompanyFilter(companyId));

    const body = {
      size: 0,
      query: {
        bool: {
          filter: filters,
        },
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
