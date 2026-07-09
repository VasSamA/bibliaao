import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Regista em audit_logs as operações de escrita (POST/PATCH/PUT/DELETE)
 * feitas por utilizadores autenticados. Aplicar seletivamente aos módulos
 * administrativos/sensíveis via @UseInterceptors(AuditLogInterceptor).
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl, user, ip, headers } = request;

    return next.handle().pipe(
      tap(() => {
        if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method) && user) {
          this.prisma.auditLog
            .create({
              data: {
                userId: user.id,
                action: `${method} ${originalUrl}`,
                ipAddress: ip,
                userAgent: headers['user-agent'],
              },
            })
            .catch(() => undefined);
        }
      }),
    );
  }
}
