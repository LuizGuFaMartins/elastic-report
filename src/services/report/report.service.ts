import { Injectable } from '@nestjs/common';
import { ElasticHttpService } from '../elastic/elastic-http.service';
import { DayjsService } from '../commom/dayjs.service';
import { OverviewParser } from '../elastic/parsers/overview-parser.service';
import { EndpointsParser } from '../elastic/parsers/endpoints-parser.service';
import { ElasticQueryService } from '../elastic/elastic-query.service';
import { ServicesHealthParser } from '../elastic/parsers/services-health-parser.service';
import { UserActivitiesParser } from '../elastic/parsers/users-activities-parser.service';
import { EstatisticsParser } from '../elastic/parsers/estatistics-parser.service';

@Injectable()
export class ReportService {
  private dayjs: any;

  constructor(
    private readonly dayjsService: DayjsService,
    private readonly estatisticsParser: EstatisticsParser,
    private readonly endpointsParser: EndpointsParser,
    private readonly elasticQueryService: ElasticQueryService,
    private readonly servicesHealthParser: ServicesHealthParser,
    private readonly userActivitiesParser: UserActivitiesParser,
  ) {
    this.dayjs = this.dayjsService.getInstance();
  }

  async generateHealthReportData(serviceName?: string, companyId?: string) {
    try {
      const estatistics = await this.elasticQueryService.getOverviewEstatistics(
        serviceName,
        companyId,
      );

      const topLatencyEndpoints =
        await this.elasticQueryService.getTopEndpointsByLatency(
          serviceName,
          companyId,
        );

      const topErrorEndpoints =
        await this.elasticQueryService.getTopEndpointsByErrors(
          serviceName,
          companyId,
        );

      const lastWeekEstatistics =
        await this.elasticQueryService.getOverviewEstatistics(
          serviceName,
          companyId,
          'lastWeek',
        );

      const lastWeekTopLatencyEndpoints =
        await this.elasticQueryService.getTopEndpointsByLatency(
          serviceName,
          companyId,
          5,
          'lastWeek',
        );

      const lastWeekTopErrorEndpoints =
        await this.elasticQueryService.getTopEndpointsByErrors(
          serviceName,
          companyId,
          5,
          'lastWeek',
        );

      const userAnalysis = await this.elasticQueryService.getUserAnalysis(
        serviceName,
        companyId,
      );

      const serviceHealth =
        await this.elasticQueryService.getServiceHealth(companyId);

      const services = this.servicesHealthParser.parse(serviceHealth);

      const errors =
        await this.elasticQueryService.getErrorAnalysis(serviceName);

      const data = {
        estatistics: this.estatisticsParser.parse(
          estatistics,
          lastWeekEstatistics,
        ),
        endpoints: this.endpointsParser.parse({
          highestLatency: topLatencyEndpoints,
          highestErrors: topErrorEndpoints,
        }),
        lastWeekEndpoints: this.endpointsParser.parse({
          highestLatency: lastWeekTopLatencyEndpoints,
          highestErrors: lastWeekTopErrorEndpoints,
        }),
        services: services.filter((s) => !s?.name?.includes(serviceName)),
        selectedServices: services.filter((s) =>
          s?.name?.includes(serviceName),
        ),
        ...this.userActivitiesParser.parse(userAnalysis),
      };

      return {
        ...data,
        generatedAt: new Date().toISOString(),
        period: this.elasticQueryService.getTimeData(),
        filters: {
          serviceName,
          companyId,
        },
      };
    } catch (error) {
      throw new Error(`Erro ao gerar dados do relatório: ${error.message}`);
    }
  }
}
