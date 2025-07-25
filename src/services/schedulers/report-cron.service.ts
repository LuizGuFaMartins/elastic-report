import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { PdfService } from 'src/services/pdf/pdf.service';
import { MailService } from 'src/services/mail/mail.service';
import { reportMock } from 'src/shared/mocks/report-mock';

import { DayjsService } from 'src/services/commom/dayjs.service';
import { ElasticService } from 'src/services/elastic/elastic.service';

@Injectable()
export class ReportCronService {
  private readonly logger = new Logger(ReportCronService.name);
  private dayjs: any;

  constructor(
    private readonly pdfService: PdfService,
    private readonly elasticService: ElasticService,
    private readonly mailService: MailService,
    private readonly dayjsService: DayjsService,
  ) {
    this.dayjs = this.dayjsService.getInstance();
  }

  // @Cron('0 8 * * 1') // Toda segunda às 08:00
  async handleWeeklyReport() {
    this.logger.debug('Iniciando geração de relatório...');

    const serviceName = 'QualiexDecisions'; // Audit_API
    const pdfReport: { name: string; buffer: any } =
      await this.generateReportBufferByService(serviceName);

    // await this.saveReportAsFile(pdfReport);
    // await this.sendReportEmail(pdfReport)

    this.logger.debug('Finalizando geração de relatório...');
  }

  async generateReportBufferByService(
    service: string,
  ): Promise<{ name: string; buffer: any }> {
    const data = await this.elasticService.generateHealthReportData(service);
    console.log('data: ', data);

    const MOCK = reportMock; // remover
    const pdfBuffer = await this.pdfService.generateReport(MOCK);

    const generationDate = this.dayjs().format('DD-MM-YYYY');
    const fileName = `./relatorio-${service?.trim().toLocaleLowerCase()}-${generationDate}.pdf`;

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
}
