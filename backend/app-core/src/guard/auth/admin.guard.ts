import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('User not authenticated.');
    }

    // 1. Verificamos si el usuario es admin en base de datos
    // user._doc or user object depending on how passport deserializes it
    const userObj = user._doc || user;
    const isDbAdmin = userObj.isAdmin === true;

    // 2. Verificamos si el usuario es admin por variable de entorno (fallback/superadmin)
    const envAdminsStr = this.configService.get<string>('ADMIN_EMAILS') || '';
    const adminEmails = envAdminsStr.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const isEnvAdmin = adminEmails.includes((userObj.email || '').toLowerCase());

    if (!isDbAdmin && !isEnvAdmin) {
      throw new ForbiddenException('Only administrators can access this resource.');
    }

    return true;
  }
}
