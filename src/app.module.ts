import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { KibanaService } from './services/elastic/kibana.service';
import { ElasticHttpService } from './services/elastic/elastic-http.service';
import { ConfigModule } from '@nestjs/config';
import { ReportCronService } from './jobs/schedulers/report-cron.service';
import { MailService } from './services/mail/mail.service';
import { PdfService } from './services/pdf/pdf.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ElasticService } from './services/elastic/elastic.service';
import { ElasticServiceV2 } from './services/elastic/elastic-v2.service';
import { DayjsService } from './services/commom/dayjs.service';
import { ElasticServiceV3 } from './services/elastic/elastic-v3.service';

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
    AppService,
    ElasticHttpService,
    KibanaService,
    ReportCronService,
    MailService,
    PdfService,
    ElasticService,
    ElasticServiceV2,
    ElasticServiceV3,
    DayjsService,
  ],
})
export class AppModule {}
