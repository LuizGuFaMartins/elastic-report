import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  private templatePath =
    process.env.REPORT_TEMPLATE_PATH ||
    path.join(__dirname, 'templates', 'report.template.html');

  async generateReport(data: any): Promise<Buffer> {
    const html = this.compileTemplate(data);
    const pdfBuffer = await this.createPdfFromHtml(html);
    return pdfBuffer;
  }

  private compileTemplate(data: any): string {
    const templateFile = fs.readFileSync(this.templatePath, 'utf8');
    const template = Handlebars.compile(templateFile);
    return template(data);
  }

  private async createPdfFromHtml(html: string): Promise<any> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();
    return pdfBuffer;
  }

  public saveFile(filePath, buffer): void {
    fs.writeFileSync(filePath, buffer);
    this.logger.debug(`Relatório salvo em ${filePath}.`);
  }

  public getLogo() {
    const logoFile = fs.readFileSync(
      'C:/projetos/telemetria/src/assets/forlogic-logo.png',
    );
    const logoBase64 = logoFile.toString('base64');
    return `data:image/png;base64,${logoBase64}`;
  }
}
