import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class ElasticHttpService {
  BASE_URL = process.env.ELASTIC_URL;

  constructor(private readonly httpService: HttpService) {}

  async get<T>(path: string, params: any = {}): Promise<any> {
    const config: AxiosRequestConfig = {
      auth: {
        username: process.env.ELASTIC_USER || '',
        password: process.env.ELASTIC_PASS || '',
      },
      headers: {
        'kbn-xsrf': 'true',
        'Content-Type': 'application/json',
      },
      params,
    };

    const endpoint = this.BASE_URL + path;
    const response$ = this.httpService.get<T>(endpoint, config);
    const response = await firstValueFrom(response$);

    return response?.data || response;
  }

  async post<T>(path: string, body: any = {}): Promise<any> {
    try {
      const config: AxiosRequestConfig = {
        auth: {
          username: process.env.ELASTIC_USER || '',
          password: process.env.ELASTIC_PASS || '',
        },
        headers: {
          'kbn-xsrf': 'true',
          'Content-Type': 'application/json',
        },
      };

      const endpoint = this.BASE_URL + path;
      const response$ = this.httpService.post<T>(endpoint, body, config);
      const response = await firstValueFrom(response$);

      return response?.data || response;
    } catch (e) {
      console.log('Failed to execute request: ', e);
    }
  }
}
