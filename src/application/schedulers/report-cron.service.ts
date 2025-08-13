import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import { DayjsService } from 'src/domain/commom/dayjs.service';
import { MailService } from '../infra/mail/mail.service';
import { PdfService } from '../infra/pdf/pdf.service';
import { ReportService } from '../services/report/report.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

@Injectable()
export class ReportCronService implements OnModuleInit {
  private readonly logger = new Logger(ReportCronService.name);

  constructor(
    private readonly reportService: ReportService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const cronExp = process.env.REPORT_CRON;

    if (cronExp) {
      const job: any = new CronJob(cronExp, async () => {
        await this.handleWeeklyReport();
      });

      this.schedulerRegistry.addCronJob('analiseJob', job);
      job.start();
    } else {
      this.logger.warn('O agendamento está desativado');
    }
  }

  async handleWeeklyReport() {
    this.logger.debug('Iniciando geração de relatório...');

    const services = {
      elasticServices: process.env.ELASTIC_SERVICES?.split(','),
      apmServices: process.env.APM_SERVICES?.split(','),
    };

    const pdfReport: { name: string; buffer: any } =
      await this.reportService.generateReportBufferByService(services);

    // await this.reportService.saveReportAsFile(pdfReport);
    await this.reportService.sendReportEmail(pdfReport);

    this.logger.debug('Finalizando geração de relatório...');
  }
}
