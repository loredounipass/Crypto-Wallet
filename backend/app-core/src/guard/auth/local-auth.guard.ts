import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {



  // VALIDA LAS CREDENCIALES LOCALES DEL USUARIO SIN ESTABLECER AUN LA SESION HASTA PASAR EL DOBLE FACTOR
  async canActivate(context: ExecutionContext) {
    const result = (await super.canActivate(context)) as boolean;
    return result;
  }
}