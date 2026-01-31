import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import cookieParser from 'cookie-parser'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)

  app.use(cookieParser())

  app.useGlobalPipes(
    new ValidationPipe({
      // ділітаємо лишні поля з body
      whitelist: true,
      // викидаємо помилку, якщо є лишні поля
      forbidNonWhitelisted: true,
      // json -> екземаляр DTO класу + підтягуємо типи
      transform: true,
    })
  )

  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  })

  const port = Number(config.get<string>('PORT') ?? '3001')

  await app.listen(port)
  console.log(`Backend listening on http://localhost:${port}`)
}

bootstrap()
