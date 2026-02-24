import { Injectable, Logger } from '@nestjs/common';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
// import { PrismaPg } from '@prisma/adapter-pg'; // PostgreSQL
import { PrismaClient } from '../generated/prisma/client';


@Injectable()
export class PrismaService extends PrismaClient {
  private logger = new Logger('PrismaService');
  
  constructor() {
    const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
/* 
    const adapter = new PrismaPg({ 
        connectionString: process.env.DATABASE_URL 
    }); // PostgreSQL 
 */
    super({ adapter });

    this.logger.log('Database connected');
  }
}
