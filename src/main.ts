import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { KibanaService } from './services/elastic/kibana.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // const kibanaService = app.get(KibanaService);
  // await kibanaService.fetchTransactionGroups();
  // await app.close()

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
