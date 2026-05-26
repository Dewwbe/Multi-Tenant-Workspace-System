import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { MembersModule } from './members/members.module';
import { NotesModule } from './notes/notes.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { WorkspacesModule } from './workspaces/workspaces.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    WorkspacesModule,
    MembersModule,
    NotesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
