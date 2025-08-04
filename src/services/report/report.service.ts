import { Injectable } from '@nestjs/common';
import { ElasticHttpService } from '../elastic/elastic-http.service';
import { DayjsService } from '../commom/dayjs.service';
import { OverviewParser } from '../elastic/parsers/overview-parser.service';
import { EndpointsParser } from '../elastic/parsers/endpoints-parser.service';
import { ElasticQueryService } from '../elastic/elastic-query.service';
import { ServicesHealthParser } from '../elastic/parsers/services-health-parser.service';
import { UserActivitiesParser } from '../elastic/parsers/users-activities-parser.service';
import { EstatisticsParser } from '../elastic/parsers/estatistics-parser.service';
import { ApmQueryService } from '../apm/apm-query.service';
import { ApmErrorsParser } from '../apm/parsers/apm-errors-parser.service';

@Injectable()
export class ReportService {
  private dayjs: any;

  constructor(
    private readonly dayjsService: DayjsService,
    private readonly estatisticsParser: EstatisticsParser,
    private readonly endpointsParser: EndpointsParser,
    private readonly elasticQueryService: ElasticQueryService,
    private readonly apmQueryService: ApmQueryService,
    private readonly servicesHealthParser: ServicesHealthParser,
    private readonly userActivitiesParser: UserActivitiesParser,
    private readonly apmErrorsParser: ApmErrorsParser
  ) {
    this.dayjs = this.dayjsService.getInstance();
  }

  async generateHealthReportData(
    services?: {
      elasticServices?: string[];
      apmServices?: string[];
    },
    companyId?: string,
  ) {
    try {
      // const estatistics = await this.elasticQueryService.getOverviewEstatistics(
      //   services?.elasticServices,
      //   companyId,
      // );

      // const topLatencyEndpoints =
      //   await this.elasticQueryService.getTopEndpointsByLatency(
      //     services?.elasticServices,
      //     companyId,
      //   );

      // const topErrorEndpoints =
      //   await this.elasticQueryService.getTopEndpointsByErrors(
      //     services?.elasticServices,
      //     companyId,
      //   );

      // const lastWeekEstatistics =
      //   await this.elasticQueryService.getOverviewEstatistics(
      //     services?.elasticServices,
      //     companyId,
      //     'lastWeek',
      //   );

      // const lastWeekTopLatencyEndpoints =
      //   await this.elasticQueryService.getTopEndpointsByLatency(
      //     services?.elasticServices,
      //     companyId,
      //     5,
      //     'lastWeek',
      //   );

      // const lastWeekTopErrorEndpoints =
      //   await this.elasticQueryService.getTopEndpointsByErrors(
      //     services?.elasticServices,
      //     companyId,
      //     5,
      //     'lastWeek',
      //   );

      // const userAnalysis = await this.elasticQueryService.getUserAnalysis(
      //   services?.elasticServices,
      //   companyId,
      // );

      // const serviceHealth =
      //   await this.elasticQueryService.getServiceHealth(companyId);

      // const servicesHealth = this.servicesHealthParser.parse(serviceHealth);

      const errors = await this.apmQueryService.getApmErrorAnalysis(
        services?.apmServices,
      );

      const data = {
        // estatistics: this.estatisticsParser.parse(
        //   estatistics,
        //   lastWeekEstatistics,
        // ),
        // endpoints: this.endpointsParser.parse({
        //   highestLatency: topLatencyEndpoints,
        //   highestErrors: topErrorEndpoints,
        // }),
        // lastWeekEndpoints: this.endpointsParser.parse({
        //   highestLatency: lastWeekTopLatencyEndpoints,
        //   highestErrors: lastWeekTopErrorEndpoints,
        // }),
        // services: servicesHealth.filter(
        //   (s) => !services?.elasticServices?.includes(s?.name),
        // ),
        // selectedServices: servicesHealth.filter((s) =>
        //   services?.elasticServices?.includes(s?.name),
        // ),
        errorReport: this.apmErrorsParser.parse(errors),
        // ...this.userActivitiesParser.parse(userAnalysis),
      };

      return {
        ...data,
        generatedAt: new Date().toISOString(),
        period: this.elasticQueryService.getTimeData(),
        filters: {
          services,
          companyId,
        },
      };
    } catch (error) {
      throw new Error(`Erro ao gerar dados do relatório: ${error.message}`);
    }
  }
}
