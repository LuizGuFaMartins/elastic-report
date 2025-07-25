import { Controller, Get } from '@nestjs/common';
import { ReportCronService } from './services/schedulers/report-cron.service';

@Controller()
export class AppController {
  constructor(private readonly reportCronService: ReportCronService) {}

  @Get()
  async getHello() {
    await this.reportCronService.handleWeeklyReport();
  }
}
