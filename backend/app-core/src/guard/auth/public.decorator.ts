import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';



// MARCA UN ENDPOINT ESPECIFICO COMO PUBLICO PERMITIENDO EL ACCESO A CUALQUIER USUARIO SIN NECESIDAD DE AUTENTICACION
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
