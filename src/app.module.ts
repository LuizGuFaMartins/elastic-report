import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { DayjsService } from './domain/commom/dayjs.service';
import { ReportService } from './application/services/report/report.service';
import { ReportCronService } from './application/schedulers/report-cron.service';
import { ApmHttpService } from './application/services/apm/apm-http.service';
import { ApmQueryService } from './application/services/apm/apm-query.service';
import { ElasticHttpService } from './application/services/elastic/elastic-http.service';
import { ElasticQueryService } from './application/services/elastic/elastic-query.service';
import { MailService } from './application/infra/mail/mail.service';
import { PdfService } from './application/infra/pdf/pdf.service';
import { OverviewParser } from './application/services/elastic/parsers/overview-parser.service';
import { StatisticsParser } from './application/services/elastic/parsers/statistics-parser.service';
import { EndpointsParser } from './application/services/elastic/parsers/endpoints-parser.service';
import { ServicesHealthParser } from './application/services/elastic/parsers/services-health-parser.service';
import { UserActivitiesParser } from './application/services/elastic/parsers/users-activities-parser.service';
import { ApmErrorsParser } from './application/services/apm/parsers/apm-errors-parser.service';
import { ScheduleModule } from '@nestjs/schedule';
import { UnitAnalysisParser } from './application/services/elastic/parsers/units-analysis-parser.service';
import { ApmServicesErrorsParser } from './application/services/apm/parsers/services-errors-parser.service';
import { ApmUnitErrorsParser } from './application/services/apm/parsers/unit-errors-parser.service';
import { ApmHttpAnalysisParser } from './application/services/apm/parsers/apm-http-analysis-parser.service';

@Module({
  controllers: [AppController],
  imports: [
    ScheduleModule.forRoot(),
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
    StatisticsParser,
    EndpointsParser,
    ServicesHealthParser,
    UserActivitiesParser,
    UnitAnalysisParser,
    ApmErrorsParser,
    ApmServicesErrorsParser,
    ApmUnitErrorsParser,
    ApmHttpAnalysisParser,
  ],
})
export class AppModule {}
