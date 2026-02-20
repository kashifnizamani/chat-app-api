import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
//import metadata from './metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // await SwaggerModule.loadPluginMetadata(metadata);

  const config = new DocumentBuilder()
    .setTitle('Chat App API')
    .setDescription('API for the Chat App backend')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearer',
    )
    .addGlobalResponse({
      status: 500,
      description: 'Internal Server Error',
    })
    .build();
  const documentFactory = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory, {
    jsonDocumentUrl: 'swagger/json',
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
