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
    private readonly userActivitiesParser: UserActivitiesParser,
    private readonly apmErrorsParser: ApmErrorsParser,
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
    const data = await this.generateHealthReportData(services);

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

    const fileName = `relatorio-performance-${service}-${generationDate.format('DD-MM-YYYY')}.pdf`;

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

  async generateHealthReportData(
    services?: {
      elasticServices?: string[];
      apmServices?: string[];
    },
    companyId?: string,
  ) {
    try {
      const statistics = await this.elasticQueryService.getOverviewstatistics(
        services?.elasticServices,
        companyId,
      );

      const lastWeekstatistics =
        await this.elasticQueryService.getOverviewstatistics(
          services?.elasticServices,
          companyId,
          'lastWeek',
        );

      const lastWeekTopLatencyEndpoints =
        await this.elasticQueryService.getTopEndpointsByLatency(
          services?.elasticServices,
          companyId,
          5,
          'lastWeek',
        );

      const topLatencyEndpoints =
        await this.elasticQueryService.getTopEndpointsByLatency(
          services?.elasticServices,
          companyId,
        );

      const lastWeekTopErrorEndpoints =
        await this.elasticQueryService.getTopEndpointsByErrors(
          services?.elasticServices,
          companyId,
          5,
          'lastWeek',
        );

      const topErrorEndpoints =
        await this.elasticQueryService.getTopEndpointsByErrors(
          services?.elasticServices,
          companyId,
        );

      const serviceHealth =
        await this.elasticQueryService.getServiceHealth(companyId);

      const servicesHealth = this.servicesHealthParser.parse(serviceHealth);

      const lastWeekServiceHealth =
        await this.elasticQueryService.getServiceHealth(companyId, 'lastWeek');

      const lastWeekServicesHealth = this.servicesHealthParser.parse(
        lastWeekServiceHealth,
      );

      const userAnalysis = await this.elasticQueryService.getUserAnalysis(
        services?.elasticServices,
        companyId,
      );

      const errors = await this.apmQueryService.getApmErrorAnalysis(
        services?.apmServices,
      );

      const data = {
        statistics: this.statisticsParser.parse(statistics, lastWeekstatistics),
        endpoints: this.endpointsParser.parse({
          highestLatency: topLatencyEndpoints,
          highestErrors: topErrorEndpoints,
        }),
        lastWeekEndpoints: this.endpointsParser.parse({
          highestLatency: lastWeekTopLatencyEndpoints,
          highestErrors: lastWeekTopErrorEndpoints,
        }),
        services: servicesHealth.filter(
          (s) => !services?.elasticServices?.includes(s?.name),
        ),
        lastWeekServices: lastWeekServicesHealth.filter(
          (s) => !services?.elasticServices?.includes(s?.name),
        ),
        selectedServices: servicesHealth.filter((s) =>
          services?.elasticServices?.includes(s?.name),
        ),
        errorReport: this.apmErrorsParser.parse(errors),
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
