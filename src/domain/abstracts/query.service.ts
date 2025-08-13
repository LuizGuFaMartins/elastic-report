export abstract class QueryService {
  public dayjs: any;

  abstract getServiceFilter(data: any, ...args: any[]): any;
  abstract getCompanyFilter(data: any, ...args: any[]): any;

  public getTimeData() {
    const tz = process.env.ELASTIC_TIMEZONE;
    const end = this.dayjs().tz(tz);
    const finalDay = +(process.env.REPORT_INTERVAL_DAYS || '7');
    const start = end.subtract(finalDay, 'day');
    return {
      startISO: start.toISOString(),
      endISO: end.toISOString(),
      startMillis: start.valueOf(),
      endMillis: end.valueOf(),
      formatedStartISO: start.format('DD/MM/YYYY'),
      formatedEndISO: end.format('DD/MM/YYYY'),
      tz,
    };
  }

  public getPreviousWeekTimeData() {
    const tz = process.env.ELASTIC_TIMEZONE;
    const end = this.dayjs().tz(tz).subtract(7, 'day');
    const start = end.subtract(7, 'day');
    return {
      startISO: start.toISOString(),
      endISO: end.toISOString(),
      startMillis: start.valueOf(),
      endMillis: end.valueOf(),
      formatedStartISO: start.format('DD/MM/YYYY'),
      formatedEndISO: end.format('DD/MM/YYYY'),
      tz,
    };
  }

  public getDateRangeFilter(
    period?: 'week' | 'lastWeek',
    field: string = 'dateTime',
    timeData?: any,
  ) {
    if (!period) period = 'week';

    const time: any =
      timeData || period === 'lastWeek'
        ? this.getPreviousWeekTimeData()
        : this.getTimeData();

    return {
      range: {
        [field]: {
          gte: time.startISO,
          lte: time.endISO,
          format: 'strict_date_optional_time',
        },
      },
    };
  }
}
