import { createParamDecorator, ExecutionContext } from '@nestjs/common';



// EXTRAE DIRECTAMENTE LA INFORMACION DEL USUARIO DESDE LA PETICION HTTP PARA INYECTARLA EN LOS CONTROLADORES
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.user;
});
