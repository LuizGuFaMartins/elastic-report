import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ReportCronService } from './jobs/schedulers/report-cron.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly reportCronService: ReportCronService) {}

  @Get()
  async getHello() {
    await this.reportCronService.handleWeeklyReport()
    // return this.appService.getHello();
  }
}
