import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

// Runs AFTER JwtAuthGuard (use as @UseGuards(JwtAuthGuard, AdminGuard)):
// lets the request through only when the authenticated user is an admin.
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: User }>();
    if (!request.user?.isAdmin) {
      throw new ForbiddenException('ადმინის უფლებები არ გაქვს');
    }
    return true;
  }
}
