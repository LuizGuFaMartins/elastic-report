import { Injectable, Logger } from '@nestjs/common';
import { EndpointsParser } from '../elastic/parsers/endpoints-parser.service';
import { ElasticQueryService } from '../elastic/elastic-query.service';
import { ServicesHealthParser } from '../elastic/parsers/services-health-parser.service';
import { UserActivitiesParser } from '../elastic/parsers/users-activities-parser.service';
import { ApmQueryService } from '../apm/apm-query.service';
import { ApmErrorsParser } from '../apm/parsers/apm-errors-parser.service';
import { MailService } from 'src/application/infra/mail/mail.service';
import { PdfService } from 'src/application/infra/pdf/pdf.service';
import { DayjsService } from 'src/domain/commom/dayjs.service';
import { ReportCronService } from 'src/application/schedulers/report-cron.service';
import { StatisticsParser } from '../elastic/parsers/statistics-parser.service';
import { UnitAnalysisParser } from '../elastic/parsers/units-analysis-parser.service';
import { QueryFilter } from 'src/domain/models/dtos/query-filters.interface';
import { ApmServicesErrorsParser } from '../apm/parsers/services-errors-parser.service';
import { ApmUnitErrorsParser } from '../apm/parsers/unit-errors-parser.service';
import { unitsAnalysisAggs } from '../elastic/aggregations/units-analysis-aggs';
import { ApmHttpAnalysisParser } from '../apm/parsers/apm-http-analysis-parser.service';
import { ServicesAnalysisParser } from '../elastic/parsers/services-analysis-parser.service';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportCronService.name);
  private dayjs: any;

  constructor(
    private readonly statisticsParser: StatisticsParser,
    private readonly endpointsParser: EndpointsParser,
    private readonly elasticQueryService: ElasticQueryService,
    private readonly apmQueryService: ApmQueryService,
    private readonly servicesHealthParser: ServicesHealthParser,
    private readonly unitAnalysisParser: UnitAnalysisParser,
    private readonly servicesAnalysisParser: ServicesAnalysisParser,
    private readonly userActivitiesParser: UserActivitiesParser,
    private readonly apmErrorsParser: ApmErrorsParser,
    private readonly apmHttpAnalysisParser: ApmHttpAnalysisParser,
    private readonly apmServicesErrorsParser: ApmServicesErrorsParser,
    private readonly apmUnitErrorsParser: ApmUnitErrorsParser,
    private readonly pdfService: PdfService,
    private readonly mailService: MailService,
    private readonly dayjsService: DayjsService,
  ) {
    this.dayjs = this.dayjsService.getInstance();
  }

  async generateReportBufferByService(
    services?:
      | {
          elasticServices?: string[];
          apmServices?: string[];
        }
      | any,
  ): Promise<{ name: string; buffer: any }> {
    const data = await this.getReportData(services);

    const generationDate = this.dayjs();

    const analisedServices = process.env.REPORT_MODULE_NAME
      ? 'Serviço(s) analisado(s): ' +
        process.env.REPORT_MODULE_NAME.replace(',', ', ')
      : null;

    const pdfBuffer = await this.pdfService.generateReport({
      companyName: 'ForLogic',
      companyInitials: 'FL',
      companyLogo: this.pdfService.getLogo(),
      reportPeriod:
        data.period.formatedStartISO + ' - ' + data.period.formatedEndISO,
      generatedDate: generationDate.format('DD/MM/YYYY HH:mm') + 'h',
      ...(analisedServices && { companySubtitle: analisedServices }),
      ...data,
    });

    const service =
      process.env.REPORT_MODULE_NAME?.split(',')?.[0]
        ?.trim()
        ?.toLocaleLowerCase() || 'qualiex';

    const fileName = `relatorio-performance-${service}-${generationDate.format('DD-MM-YYYY-HH-mm')}.pdf`;

    return {
      name: fileName,
      buffer: pdfBuffer,
    };
  }

  async sendReportEmail(pdfReport: { name: string; buffer: any }) {
    const sendTo = (process.env.EMAIL_TO || '')?.split(',') || [];
    await this.mailService.sendPdfReport(sendTo, pdfReport);
    this.logger.debug('Relatório semanal enviado com sucesso!');
  }

  async saveReportAsFile(pdfReport: { name: string; buffer: any }) {
    this.pdfService.saveFile(`./${pdfReport.name}`, pdfReport.buffer);
  }

  async getReportData(
    services?: {
      elasticServices?: string[];
      apmServices?: string[];
    },
    companyId?: string,
  ) {
    try {
      const elasticCurrentWeekFilters: QueryFilter = {
        services: services?.elasticServices,
        companyId: companyId,
        period: 'week',
      };

      const elasticLastWeekFilters: QueryFilter = {
        services: services?.elasticServices,
        companyId: companyId,
        period: 'lastWeek',
      };

      const cwStatistics = await this.elasticQueryService.getOverviewStatistics(
        elasticCurrentWeekFilters,
      );

      const lwStatistics = await this.elasticQueryService.getOverviewStatistics(
        elasticLastWeekFilters,
      );

      const cwTopLatencyEndpoints =
        await this.elasticQueryService.getTopEndpointsByLatency(
          elasticCurrentWeekFilters,
        );

      const lwTopLatencyEndpoints =
        await this.elasticQueryService.getTopEndpointsByLatency(
          elasticLastWeekFilters,
        );

      const cwTopErrorEndpoints =
        await this.elasticQueryService.getTopEndpointsByErrors(
          elasticCurrentWeekFilters,
        );

      const lwTopErrorEndpoints =
        await this.elasticQueryService.getTopEndpointsByErrors(
          elasticLastWeekFilters,
        );

      const cwServiceHealth = await this.elasticQueryService.getServicesHealth(
        elasticCurrentWeekFilters,
      );

      const lwServiceHealth = await this.elasticQueryService.getServicesHealth(
        elasticLastWeekFilters,
      );

      const servicesHealth = this.servicesHealthParser.parse(
        cwServiceHealth,
        lwServiceHealth,
      );

      const cwUnitsAnalysis = await this.elasticQueryService.getUnitsAnalysis(
        elasticCurrentWeekFilters,
      );

      const lwUnitsAnalysis = await this.elasticQueryService.getUnitsAnalysis(
        elasticLastWeekFilters,
      );

      const cwServicesAnalysis =
        await this.elasticQueryService.getServicesAnalysis(
          elasticCurrentWeekFilters,
        );

      const lwServicesAnalysis =
        await this.elasticQueryService.getServicesAnalysis(
          elasticLastWeekFilters,
        );

      const userAnalysis = await this.elasticQueryService.getUserAnalysis(
        elasticCurrentWeekFilters,
      );

      const apmCurrentWeekFilters: QueryFilter = {
        services: services?.apmServices,
        period: 'week',
      };

      const apmLastWeekFilters: QueryFilter = {
        services: services?.apmServices,
        period: 'lastWeek',
      };

      const cwServiceErrors = await this.apmQueryService.getApmErrorsByService(
        apmCurrentWeekFilters,
      );

      const lwServiceErrors =
        await this.apmQueryService.getApmErrorsByService(apmLastWeekFilters);

      const cwUnitErrors = await this.apmQueryService.getApmErrorsByUnit(
        apmCurrentWeekFilters,
      );

      const lwUnitErrors =
        await this.apmQueryService.getApmErrorsByUnit(apmLastWeekFilters);

      const httpAnalysis = await this.apmQueryService.getApmErrorAnalysis(
        apmCurrentWeekFilters,
      );

      const data = {
        statistics: this.statisticsParser.parse(cwStatistics, lwStatistics),
        endpoints: {
          currentWeek: this.endpointsParser.parse({
            highestLatency: cwTopLatencyEndpoints,
            highestErrors: cwTopErrorEndpoints,
          }),
          lastWeek: this.endpointsParser.parse({
            highestLatency: lwTopLatencyEndpoints,
            highestErrors: lwTopErrorEndpoints,
          }),
        },
        services: servicesHealth.filter(
          (s) => !services?.elasticServices?.includes(s?.name),
        ),
        unitsAnalysis: {
          currentWeek: this.unitAnalysisParser.parse(cwUnitsAnalysis),
          lastWeek: this.unitAnalysisParser.parse(lwUnitsAnalysis),
        },
        servicesAnalysis: {
          currentWeek: this.servicesAnalysisParser.parse(cwServicesAnalysis),
          lastWeek: this.servicesAnalysisParser.parse(lwServicesAnalysis),
        },
        errorsByService: {
          currentWeek: this.apmServicesErrorsParser.parse(cwServiceErrors),
          lastWeek: this.apmServicesErrorsParser.parse(lwServiceErrors),
        },
        errorsByUnit: {
          currentWeek: this.apmUnitErrorsParser.parse(cwUnitErrors),
          lastWeek: this.apmUnitErrorsParser.parse(lwUnitErrors),
        },
        httpAnalysis: this.apmHttpAnalysisParser.parse(httpAnalysis),
        ...this.userActivitiesParser.parse(userAnalysis),
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
