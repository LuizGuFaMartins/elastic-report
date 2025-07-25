import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/pt-br';

@Injectable()
export class DayjsService {
  constructor() {
    dayjs.extend(utc);
    dayjs.extend(timezone);

    dayjs.locale('pt-br');
    dayjs.tz.setDefault('America/Sao_Paulo');
  }

  getInstance() {
    return dayjs;
  }
}
