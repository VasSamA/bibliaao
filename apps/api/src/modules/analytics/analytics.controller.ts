import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Post('eventos')
  track(@CurrentUser() user: { id: string } | undefined, @Body() body: { eventName: string; properties?: Record<string, unknown>; sessionId?: string }) {
    return this.analyticsService.track(body.eventName, user?.id, body.properties, body.sessionId);
  }

  @Roles(UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Get('dashboard')
  dashboard() {
    return this.analyticsService.dashboardMetrics();
  }
}
