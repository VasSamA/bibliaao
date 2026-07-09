import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BibleModule } from './modules/bible/bible.module';
import { StudiesModule } from './modules/studies/studies.module';
import { DevotionalsModule } from './modules/devotionals/devotionals.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { CoursesModule } from './modules/courses/courses.module';
import { ChurchesModule } from './modules/churches/churches.module';
import { ReadingPlansModule } from './modules/reading-plans/reading-plans.module';
import { NotesModule } from './modules/notes/notes.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { CommentsModule } from './modules/comments/comments.module';
import { AiQuestionsModule } from './modules/ai-questions/ai-questions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { SearchModule } from './modules/search/search.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
        limit: Number(process.env.RATE_LIMIT_MAX ?? 100),
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    BibleModule,
    StudiesModule,
    DevotionalsModule,
    ArticlesModule,
    ResourcesModule,
    CoursesModule,
    ChurchesModule,
    ReadingPlansModule,
    NotesModule,
    FavoritesModule,
    CommentsModule,
    AiQuestionsModule,
    NotificationsModule,
    AnalyticsModule,
    AuditLogsModule,
    SearchModule,
    StorageModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
