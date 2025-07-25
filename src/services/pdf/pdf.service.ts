import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
  private templatePath =
    process.env.REPORT_TEMPLATE_PATH ||
    path.join(__dirname, 'templates', 'report-v3.template.html');

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
    console.log(`✅ Relatório salvo em ${filePath}.`);
  }
}
