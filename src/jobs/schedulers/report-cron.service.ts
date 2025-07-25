import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { PdfService } from 'src/services/pdf/pdf.service';
import { KibanaService } from 'src/services/elastic/kibana.service';
import { MailService } from 'src/services/mail/mail.service';
import { ElasticService } from 'src/services/elastic/elastic.service';
import { ElasticServiceV2 } from 'src/services/elastic/elastic-v2.service';

@Injectable()
export class ReportCronService {
  private readonly logger = new Logger(ReportCronService.name);

  constructor(
    private readonly pdfService: PdfService,
    private readonly kibanaService: KibanaService,
    private readonly elasticService: ElasticServiceV2,
    private readonly mailService: MailService,
  ) {}

  // @Cron('0 8 * * 1') // Toda segunda às 08:00
  async handleWeeklyReport() {
    this.logger.log('📅 Iniciando geração de relatório semanal...');

    // const data = await this.kibanaService.getTransactionGroups('Audit_API');
    const data = await this.elasticService.getTransactionGroups('Audit_API');

    console.log('data: ', data);

    const mockData = {
      startDate: '14/07/2025',
      endDate: '21/07/2025',
      totalRequests: 12234,
      errorRate: 1.8,
      avgLatency: 240,
      worstLatencyService: 'users-service',
      generatedAt: new Date().toLocaleString(),

      services: [
        {
          name: 'auth-service',
          throughput: 12.4,
          latency: 150,
          errorRate: 0.7,
          criticalEndpoint: 'POST /login',
        },
        {
          name: 'orders-service',
          throughput: 8.9,
          latency: 230,
          errorRate: 1.8,
          criticalEndpoint: 'GET /orders/:id',
        },
      ],

      criticalEndpoints: [
        {
          name: 'GET /users/listAssociations',
          latency: 2500,
          errorRate: 1.2,
          impact: 'Alto',
          isCritical: true,
        },
        {
          name: 'POST /checkout/pay',
          latency: 1900,
          errorRate: 8.2,
          impact: 'Alto',
          isCritical: true,
        },
      ],

      trends: [
        {
          metric: 'Latência Média',
          current: '240ms',
          previous: '210ms',
          variation: '+14%',
          variationClass: 'status-red',
        },
        {
          metric: 'Erros',
          current: '1.8%',
          previous: '1.2%',
          variation: '+0.6%',
          variationClass: 'status-yellow',
        },
      ],

      anomalies: [
        {
          timestamp: '17/07 15:22',
          description: 'Erro 500 em POST /checkout/pay',
        },
        {
          timestamp: '20/07 08:10',
          description: 'Latência alta em GET /orders/list',
        },
      ],

      improvements: [
        {
          item: 'GET /users/listAssociations',
          proposal: 'Otimizar procedure SQL',
          benefit: 'Reduz latência em 40%',
        },
        {
          item: 'POST /checkout/pay',
          proposal: 'Adicionar retry ao serviço externo',
          benefit: 'Reduz falha de pagamento',
        },
      ],
    };

    const mockData2 = {
      // Informações do cabeçalho
      companyName: 'TechCorp Solutions',
      companySubtitle: 'Monitoramento de Aplicações',
      companyInitials: 'TC',
      companyLogo: null, // ou URL da logo: "https://exemplo.com/logo.png"
      reportPeriod: '18/07/2025 - 25/07/2025',
      generatedDate: '25/07/2025 14:30:22',

      // 1. Visão Geral da Performance
      overview: {
        avgLatency: '125',
        latencyTrend: 'positive',
        latencyChange: '↓ 15ms',

        throughput: '2.4k',
        throughputTrend: 'positive',
        throughputChange: '↑ 8%',

        errorRate: '0.12',
        errorTrend: 'positive',
        errorChange: '↓ 0.05%',

        availability: '99.87',
        availabilityTrend: 'neutral',
        availabilityChange: '→ 0%',

        totalRequests: '2.1M',
        requestsTrend: 'positive',
        requestsChange: '↑ 12%',

        peakTraffic: 'Terça-feira, 22/07 às 14:30 - 3.2k req/min',
      },

      // 2. Principais Endpoints
      endpoints: {
        highestLatency: [
          {
            name: '/api/v1/reports/generate',
            latency: '850',
            volume: '1.2k',
          },
          {
            name: '/api/v1/analytics/dashboard',
            latency: '680',
            volume: '8.5k',
          },
          {
            name: '/api/v1/users/profile/update',
            latency: '420',
            volume: '3.1k',
          },
          {
            name: '/api/v1/search/advanced',
            latency: '380',
            volume: '12.3k',
          },
          {
            name: '/api/v1/files/upload',
            latency: '350',
            volume: '2.8k',
          },
        ],
        highestErrors: [
          {
            name: '/api/v1/payment/process',
            errorRate: '2.1',
            totalErrors: '45',
          },
          {
            name: '/api/v1/external/webhook',
            errorRate: '1.8',
            totalErrors: '89',
          },
          {
            name: '/api/v1/auth/validate',
            errorRate: '0.9',
            totalErrors: '123',
          },
          {
            name: '/api/v1/notifications/send',
            errorRate: '0.7',
            totalErrors: '78',
          },
          {
            name: '/api/v1/data/export',
            errorRate: '0.5',
            totalErrors: '34',
          },
        ],
      },

      // 3. Falhas e Erros Críticos
      errors: {
        error5xx: '234',
        error4xx: '1.2k',
        newErrorTypes: '3',
        criticalEndpoints: '7',
        topErrors: [
          {
            type: 'TimeoutException',
            count: '89',
            description: 'Timeout na conexão com banco de dados principal',
            lastOccurrence: '25/07 13:45',
          },
          {
            type: 'ValidationError',
            count: '67',
            description: 'Falha na validação de parâmetros de entrada',
            lastOccurrence: '25/07 14:12',
          },
          {
            type: 'AuthenticationFailure',
            count: '45',
            description: 'Token JWT expirado ou inválido',
            lastOccurrence: '25/07 14:28',
          },
          {
            type: 'ExternalServiceUnavailable',
            count: '34',
            description: 'Serviço de pagamento externo indisponível',
            lastOccurrence: '25/07 12:15',
          },
        ],
      },

      // 4. Saúde por Serviço
      services: [
        {
          name: 'Auth Service',
          status: 'success',
          avgLatency: '85',
          volume: '45.2k',
          errorRate: '0.05',
          changes: 'Deploy v2.1.3',
        },
        {
          name: 'Payment Service',
          status: 'warning',
          avgLatency: '320',
          volume: '12.8k',
          errorRate: '1.2',
          changes: 'Timeout aumentado',
        },
        {
          name: 'Notification Service',
          status: 'success',
          avgLatency: '120',
          volume: '23.5k',
          errorRate: '0.1',
          changes: 'Sem alterações',
        },
        {
          name: 'Analytics Service',
          status: 'error',
          avgLatency: '890',
          volume: '8.9k',
          errorRate: '3.4',
          changes: 'Investigando lentidão',
        },
        {
          name: 'File Service',
          status: 'success',
          avgLatency: '180',
          volume: '15.3k',
          errorRate: '0.2',
          changes: 'Cache otimizado',
        },
        {
          name: 'Search Service',
          status: 'warning',
          avgLatency: '450',
          volume: '34.7k',
          errorRate: '0.8',
          changes: 'Índices reconstruídos',
        },
      ],

      // 5. Análise de Tendências
      trends: {
        anomalies: [
          {
            type: 'Pico de Latência',
            description:
              'Aumento de 400% na latência do Analytics Service entre 13:00-14:00',
            timestamp: '24/07 13:15',
          },
          {
            type: 'Volume Anômalo',
            description:
              'Tráfego 250% acima do normal no endpoint /api/v1/search',
            timestamp: '23/07 09:30',
          },
          {
            type: 'Erro Recorrente',
            description:
              'Novo padrão de falha no Payment Service a cada 15 minutos',
            timestamp: '22/07 16:45',
          },
        ],
        patterns: [
          {
            metric: 'Latência Geral',
            change: 'Aumento gradual de 15% ao longo da semana',
            impact: 'Médio - usuários reportando lentidão',
          },
          {
            metric: 'Taxa de Erro',
            change: 'Redução de 30% após correção do Auth Service',
            impact: 'Positivo - menos falhas de login',
          },
          {
            metric: 'Throughput',
            change: 'Crescimento constante de 8% por dia',
            impact: 'Alto - necessário scale horizontal',
          },
        ],
      },

      // 6. Análise de Uso
      usage: {
        topUsers: [
          {
            user: 'mobile-app-v3.2',
            requests: '450k',
            percentage: '21.4',
          },
          {
            user: 'web-dashboard',
            requests: '380k',
            percentage: '18.1',
          },
          {
            user: 'api-client-analytics',
            requests: '290k',
            percentage: '13.8',
          },
          {
            user: 'batch-processor',
            requests: '210k',
            percentage: '10.0',
          },
          {
            user: 'integration-service',
            requests: '185k',
            percentage: '8.8',
          },
        ],
        suspiciousActivity: [
          {
            type: 'Rate Limit Exceeded',
            details: 'IP 203.45.67.89 fez 15k requisições em 10 minutos',
            timestamp: '24/07 11:20',
          },
          {
            type: 'Horário Incomum',
            details: 'Pico de atividade às 03:00 - 800% acima do normal',
            timestamp: '23/07 03:15',
          },
          {
            type: 'Padrão Suspeito',
            details: 'Mesmo IP tentando múltiplos endpoints sensíveis',
            timestamp: '22/07 19:45',
          },
        ],
      },

      // 7. Comparativo Semanal
      comparison: {
        latencyChange: '↑ 18ms',
        latencyTrend: 'negative',

        errorChange: '↓ 0.08%',
        errorTrend: 'positive',

        volumeChange: '↑ 12%',
        volumeTrend: 'positive',

        alertsTriggered: '23',
        alertsTrend: 'negative',
      },

      // Observações e Recomendações
      recommendations: [
        {
          priority: 'CRÍTICO',
          description:
            'Analytics Service apresenta degradação severa. Investigar conexões com banco e otimizar queries mais lentas.',
        },
        {
          priority: 'ALTO',
          description:
            'Payment Service com timeout elevado. Considerar implementar circuit breaker e retry com backoff.',
        },
        {
          priority: 'MÉDIO',
          description:
            'Crescimento de tráfego indica necessidade de planejamento de capacidade para próximas 2 semanas.',
        },
        {
          priority: 'BAIXO',
          description:
            'Implementar rate limiting mais rigoroso para prevenir abuse de APIs públicas.',
        },
        {
          priority: 'MONITORAMENTO',
          description:
            'Configurar alertas adicionais para detectar padrões anômalos de tráfego fora do horário comercial.',
        },
      ],
    };

    const pdfBuffer = await this.pdfService.generateReport(mockData2);
    this.pdfService.saveFile('./relatorio.pdf', pdfBuffer);

    // const sendTo = (process.env.EMAIL_TO || '')?.split(',') || [];
    // console.log(sendTo);
    // await this.mailService.sendPdfReport(sendTo, pdfBuffer);

    // this.logger.log('✅ Relatório semanal enviado com sucesso!');
  }
}
