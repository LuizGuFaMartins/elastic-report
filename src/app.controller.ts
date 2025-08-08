import { Controller, Get } from '@nestjs/common';
import { ReportCronService } from './application/schedulers/report-cron.service';

@Controller()
export class AppController {
  constructor(private readonly reportCronService: ReportCronService) {}

  @Get()
  async getHello() {
    await this.reportCronService.handleWeeklyReport();
  }
}
