import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { HttpModule } from '@nestjs/axios';
import { ElasticHttpService } from './services/elastic/elastic-http.service';
import { ConfigModule } from '@nestjs/config';
import { ReportCronService } from './services/schedulers/report-cron.service';
import { MailService } from './services/mail/mail.service';
import { PdfService } from './services/pdf/pdf.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { DayjsService } from './services/commom/dayjs.service';
import { ReportService } from './services/report/report.service';
import { OverviewParser } from './services/elastic/parsers/overview-parser.service';
import { EndpointsParser } from './services/elastic/parsers/endpoints-parser.service';
import { ElasticQueryService } from './services/elastic/elastic-query.service';
import { ServicesHealthParser } from './services/elastic/parsers/services-health-parser.service';
import { UserActivitiesParser } from './services/elastic/parsers/users-activities-parser.service';
import { EstatisticsParser } from './services/elastic/parsers/estatistics-parser.service';
import { ApmHttpService } from './services/apm/apm-http.service';
import { ApmQueryService } from './services/apm/apm-query.service';
import { ApmErrorsParser } from './services/apm/parsers/apm-errors-parser.service';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot(),
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
    }),
    HttpModule,
  ],
  providers: [
    ReportService,
    ReportCronService,
    ApmHttpService,
    ApmQueryService,
    ElasticHttpService,
    ElasticQueryService,
    MailService,
    PdfService,
    DayjsService,
    OverviewParser,
    EstatisticsParser,
    EndpointsParser,
    ServicesHealthParser,
    UserActivitiesParser,
    ApmErrorsParser,
  ],
})
export class AppModule {}
