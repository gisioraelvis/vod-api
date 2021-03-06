import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import TypeOrmQueryLogger from 'src/utils/typeOrmQueryLogger';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST'),
        port: configService.get('POSTGRES_PORT'),
        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
        database: configService.get('DB_NAME'),
        autoLoadEntities: true,
        // Should always be false in production
        synchronize:
          configService.get('NODE_ENV') === 'development' ? true : false,
        entities: [__dirname + '/../**/*.entity.ts'],
        // Only log typeOrm SQL queries in development
        logger:
          configService.get('NODE_ENV') === 'development'
            ? new TypeOrmQueryLogger()
            : 'debug',
      }),
    }),
  ],
})
export class DatabaseModule {}
