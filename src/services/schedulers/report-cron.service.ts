import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { PdfService } from 'src/services/pdf/pdf.service';
import { MailService } from 'src/services/mail/mail.service';
import { reportMock } from 'src/shared/mocks/report-mock';

import { DayjsService } from 'src/services/commom/dayjs.service';
import {
  QualiexApmServices,
  QualiexElasticServices,
} from 'src/shared/enums/qualiex-services.enum';
import { ReportService } from '../report/report.service';

@Injectable()
export class ReportCronService {
  private readonly logger = new Logger(ReportCronService.name);
  private dayjs: any;

  constructor(
    private readonly pdfService: PdfService,
    private readonly reportService: ReportService,
    private readonly mailService: MailService,
    private readonly dayjsService: DayjsService,
  ) {
    this.dayjs = this.dayjsService.getInstance();
  }

  // @Cron('0 8 * * 1') // Toda segunda às 08:00
  async handleWeeklyReport() {
    this.logger.debug('Iniciando geração de relatório...');

    const services = {
      elasticServices: process.env.ELASTIC_SERVICES?.split(',') || [
        QualiexElasticServices.QualiexAudit,
      ],
      apmServices: process.env.APM_SERVICES?.split(',') || [
        QualiexApmServices.Audit_API,
      ],
    };

    const pdfReport: { name: string; buffer: any } =
      await this.generateReportBufferByService(services);

    await this.saveReportAsFile(pdfReport);
    // await this.sendReportEmail(pdfReport)

    this.logger.debug('Finalizando geração de relatório...');
  }

  async generateReportBufferByService(services: {
    elasticServices: string[];
    apmServices: string[];
  }): Promise<{ name: string; buffer: any }> {
    const data = await this.reportService.generateHealthReportData(services);

    console.log('data: ', data);

    const generationDate = this.dayjs();

    const pdfBuffer = await this.pdfService.generateReport({
      companyName: 'ForLogic',
      // companySubtitle: 'Serviço analisado: ' + this.reportService,
      companyInitials: 'FL',
      companyLogo: this.getLogo(),
      reportPeriod:
        data.period.formatedStartISO + ' - ' + data.period.formatedEndISO,
      generatedDate: generationDate.format('DD/MM/YYYY'),
      ...data,
    });

    const fileName = `./relatorio-${services?.elasticServices?.[0]?.trim().toLocaleLowerCase()}-${generationDate.format('DD-MM-YYYY')}.pdf`;

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
    this.pdfService.saveFile(pdfReport.name, pdfReport.buffer);
  }

  public getLogo() {
    const logoFile = fs.readFileSync(
      'C:/projetos/telemetria/src/assets/forlogic-logo.png',
    );
    const logoBase64 = logoFile.toString('base64');
    return `data:image/png;base64,${logoBase64}`;
  }
}
