import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailService: MailerService) {}

  async sendPdfReport(
    to: string[],
    pdfReport: { name: string; buffer: any },
    subject?: string,
  ) {
    const modules = process.env.REPORT_MODULE_NAME?.replace(',', ', ') || '';

    try {
      const info = await this.mailService.sendMail({
        from: `"Relatório semanal de performance QUALIEX" <${process.env.SMTP_FROM}>`,
        to: [...to],
        subject: subject || '📊 Relatório semanal de performance QUALIEX',
        text: `Segue em anexo o relatório semanal de performance do(s) módulo(s) ${modules}`,
        attachments: [
          {
            filename: pdfReport.name,
            content: pdfReport.buffer,
          },
        ],
      });

      this.logger.log(`E-mail enviado com sucesso: ${info.messageId}`);
    } catch (error) {
      this.logger.error('Falha ao enviar e-mail:', error);
      throw error;
    }
  }
}
