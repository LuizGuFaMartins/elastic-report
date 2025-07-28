import { Injectable } from '@nestjs/common';
import { ElasticHttpService } from './elastic-http.service';
import { DayjsService } from '../commom/dayjs.service';
import { OverviewParser } from './parsers/overview-parser.service';
import { EndpointsParser } from './parsers/top-latency-endpoint-parser.service';
import { ElasticQueryService } from './elastic-query.service';

@Injectable()
export class ElasticReportService {
  private dayjs: any;

  constructor(
    private readonly dayjsService: DayjsService,
    private readonly overviewParser: OverviewParser,
    private readonly endpointsParser: EndpointsParser,
    private readonly elasticQueryService: ElasticQueryService,
  ) {
    this.dayjs = this.dayjsService.getInstance();
  }

  // Método principal para gerar dados do relatório
  async generateHealthReportData(serviceName?: string, companyId?: string) {
    try {
      // const [
      //   overview,
      //   topLatencyEndpoints,
      //   topErrorEndpoints,
      //   errorAnalysis,
      //   serviceHealth,
      //   trendAnalysis,
      //   userAnalysis,
      //   weeklyComparison,
      // ] = await Promise.all([
      //   this.getOverviewMetrics(serviceName, companyId),
      //   this.getTopEndpointsByLatency(serviceName, companyId),
      //   this.getTopEndpointsByErrors(serviceName, companyId),
      //   this.getErrorAnalysis(serviceName, companyId),
      //   this.getServiceHealth(companyId),
      //   this.getTrendAnalysis(serviceName, companyId),
      //   this.getUserAnalysis(companyId),
      //   this.getWeeklyComparison(serviceName, companyId),
      // ]);

      const overview = await this.elasticQueryService.getOverviewMetrics(
        serviceName,
        companyId,
      );
      const topLatencyEndpoints =
        await this.elasticQueryService.getTopEndpointsByLatency(
          serviceName,
          companyId,
          1000,
        );
      const topErrorEndpoints =
        await this.elasticQueryService.getTopEndpointsByErrors(
          serviceName,
          companyId,
          1000,
        );
      // const errorAnalysis = await this.getErrorAnalysis(serviceName, companyId);
      // const serviceHealth = await this.getServiceHealth(serviceName, companyId);
      // const trendAnalysis = await this.getTrendAnalysis(serviceName, companyId);

      // Last week
      const lastWeekOverview =
        await this.elasticQueryService.getOverviewMetrics(
          serviceName,
          companyId,
          'lastWeek',
        );
      const lastWeekTopLatencyEndpoints =
        await this.elasticQueryService.getTopEndpointsByLatency(
          serviceName,
          companyId,
          1000,
          'lastWeek',
        );
      const lastWeekTopErrorEndpoints =
        await this.elasticQueryService.getTopEndpointsByErrors(
          serviceName,
          companyId,
          1000,
          'lastWeek',
        );
      // const lastWeekTrrorAnalysis = await this.getErrorAnalysis(
      //   serviceName,
      //   companyId,
      //   'lastWeek',
      // );
      // const lastWeekServiceHealth = await this.getServiceHealth(
      //   serviceName,
      //   companyId,
      //   'lastWeek',
      // );
      // const lastWeekTrendAnalysis = await this.getTrendAnalysis(
      //   serviceName,
      //   companyId,
      //   'lastWeek',
      // );

      // const userAnalysis = await this.getUserAnalysis(companyId);
      // const weeklyComparison = await this.getWeeklyComparison(
      //   serviceName,
      //   companyId,
      // );

      const data = {
        overview: this.overviewParser.parse(overview, lastWeekOverview),
        endpoints: this.endpointsParser.parse({
          highestLatency: topLatencyEndpoints,
          highestErrors: topErrorEndpoints,
        }),
        lastWeekEndpoints: this.endpointsParser.parse({
          highestLatency: lastWeekTopLatencyEndpoints,
          highestErrors: lastWeekTopErrorEndpoints,
        }),
        // errors,
        // serviceHealth,
        // trendAnalysis,
        generatedAt: new Date().toISOString(),
        period: this.elasticQueryService.getTimeData(),
        filters: {
          serviceName,
          companyId,
        },
        // userAnalysis,
        // weeklyComparison,
      };

      return data;
    } catch (error) {
      throw new Error(`Erro ao gerar dados do relatório: ${error.message}`);
    }
  }
}
