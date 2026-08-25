import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
export class AuthenticatedGuard implements CanActivate {



  // INTERCEPTA LA PETICION ENTRANTE Y PERMITE EL PASO SOLO SI LA SESION ACTUAL TIENE UN USUARIO AUTENTICADO
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    return request.isAuthenticated();
  }
}
