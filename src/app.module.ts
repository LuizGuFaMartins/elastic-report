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
import { ElasticService } from './services/elastic/elastic.service';
import { OverviewParser } from './services/elastic/parsers/overview-parser.service';
import { TopLatencyEndpointParser } from './services/elastic/parsers/top-latency-endpoint-parser.service';

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
    ReportCronService,
    ElasticHttpService,
    ElasticService,
    MailService,
    PdfService,
    DayjsService,
    OverviewParser,
    TopLatencyEndpointParser,
  ],
})
export class AppModule {}
