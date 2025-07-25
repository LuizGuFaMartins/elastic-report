import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailService: MailerService) {}

  async sendPdfReport(to: string[], pdfBuffer: Buffer, subject?: string) {
    try {
      const info = await this.mailService.sendMail({
        from: `"APM Reports" <${process.env.SMTP_FROM}>`,
        to: [...to],
        subject: subject || '📊 Relatório APM Semanal',
        text: 'Segue em anexo o relatório semanal de performance.',
        attachments: [
          {
            filename: 'relatorio-apm.pdf',
            content: pdfBuffer,
          },
        ],
      });

      this.logger.log(`📧 E-mail enviado com sucesso: ${info.messageId}`);
    } catch (error) {
      this.logger.error('❌ Falha ao enviar e-mail:', error);
      throw error;
    }
  }
}
