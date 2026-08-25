import { Controller, Post, Body, Get, Param, Request, UseGuards, Patch, Delete, ForbiddenException } from '@nestjs/common';
import { ProviderService } from './provider.service';
import { CreateProviderDto } from './dto/provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { AddPaymentMethodDto, UpdateDestinationWalletDto, ToggleDestinationWalletDto } from './dto/provider-settings.dto';
import { Provider } from './schemas/provider.schema';
import { AuthenticatedGuard } from '../guard/auth/authenticated.guard';

@Controller('providers')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}



  // CREA UN NUEVO PERFIL DE PROVEEDOR ASOCIANDOLO AL CORREO ELECTRONICO DEL USUARIO ACTUALMENTE AUTENTICADO
  @UseGuards(AuthenticatedGuard)
  @Post('create')
  createProvider(
    @Request() req,
    @Body() createProviderDto: CreateProviderDto
  ): Promise<Provider> {
    createProviderDto.email = req.user.email;
    return this.providerService.createProvider(createProviderDto);
  }



  // REGISTRA LA ACEPTACION DE LOS TERMINOS Y CONDICIONES POR PARTE DEL USUARIO PARA ACTIVAR SU CUENTA
  @UseGuards(AuthenticatedGuard)
  @Post('terms/accept')
  async acceptTerms(@Request() req): Promise<any> {
    const terms = await this.providerService.acceptTerms(req.user.email);
    return { accepted: terms.accepted };
  }



  // VERIFICA SI EL USUARIO YA HA ACEPTADO LOS TERMINOS Y CONDICIONES PREVIAMENTE EN LA PLATAFORMA
  @UseGuards(AuthenticatedGuard)
  @Get('terms/check')
  async checkTerms(@Request() req): Promise<{ accepted: boolean }> {
    const accepted = await this.providerService.checkTerms(req.user.email);
    return { accepted };
  }



  // BUSCA UN PROVEEDOR POR SU CORREO VERIFICANDO ESTRICTAMENTE QUE COINCIDA CON LA SESION DEL USUARIO SOLICITANTE
  @UseGuards(AuthenticatedGuard)
  @Get('findByEMail/:email')
  findByEMail(@Request() req, @Param('email') email: string): Promise<Provider> {
    if (req.user.email !== email) {
      throw new ForbiddenException('You can only access your own provider profile');
    }
    return this.providerService.findProviderByEmail(email);
  }



  // RECUPERA DIRECTAMENTE EL PERFIL DE PROVEEDOR ASOCIADO A LA SESION ACTUAL DEL USUARIO
  @UseGuards(AuthenticatedGuard)
  @Get('my-profile')
  findMyProvider(@Request() req): Promise<Provider> {
    return this.providerService.findProviderByEmail(req.user.email);
  }



  // OBTIENE LA LISTA DE TODOS LOS PROVEEDORES VALIDADOS EXCLUYENDO AL USUARIO QUE REALIZA LA PETICION
  @UseGuards(AuthenticatedGuard)
  @Get('allProviders')
  findAllProviders(@Request() req): Promise<Provider[]> {
    return this.providerService.findAllProviders(req.user.email);
  }



  // MODIFICA LOS DATOS DEL PERFIL DEL PROVEEDOR COMO SUS METODOS DE PAGO Y BILLETERAS DE DESTINO
  @UseGuards(AuthenticatedGuard)
  @Patch('update')
  updateProvider(
    @Request() req,
    @Body() updateProviderDto: UpdateProviderDto
  ): Promise<Provider> {
    return this.providerService.updateProvider(req.user.email, updateProviderDto);
  }



  // SOLICITA TODA LA CONFIGURACION ASOCIADA AL PERFIL DEL PROVEEDOR EN LA SESION ACTUAL
  @UseGuards(AuthenticatedGuard)
  @Get('settings')
  getSettings(@Request() req): Promise<Provider> {
    return this.providerService.getProviderSettings(req.user.email);
  }



  // AGREGA UN NUEVO METODO DE PAGO A LA LISTA DE OPCIONES DISPONIBLES DEL PROVEEDOR
  @UseGuards(AuthenticatedGuard)
  @Post('settings/payment-methods')
  addPaymentMethod(
    @Request() req,
    @Body() dto: AddPaymentMethodDto
  ): Promise<Provider> {
    return this.providerService.addPaymentMethod(req.user.email, dto);
  }



  // ELIMINA UN METODO DE PAGO ESPECIFICO DE LA CONFIGURACION DEL PROVEEDOR
  @UseGuards(AuthenticatedGuard)
  @Delete('settings/payment-methods/:method')
  deletePaymentMethod(
    @Request() req,
    @Param('method') method: string
  ): Promise<Provider> {
    return this.providerService.deletePaymentMethod(req.user.email, method);
  }



  // ACTUALIZA LA DIRECCION Y RED DE UNA BILLETERA DE DESTINO O LA AGREGA SI AUN NO EXISTE
  @UseGuards(AuthenticatedGuard)
  @Patch('settings/destination-wallet')
  updateDestinationWallet(
    @Request() req,
    @Body() dto: UpdateDestinationWalletDto
  ): Promise<Provider> {
    return this.providerService.updateDestinationWallet(req.user.email, dto);
  }



  // ALTERNA EL ESTADO DE ACTIVACION DE UNA BILLETERA DE DESTINO HABILITANDOLA O DESHABILITANDOLA SEGUN CORRESPONDA
  @UseGuards(AuthenticatedGuard)
  @Post('settings/destination-wallets/toggle')
  toggleDestinationWallet(
    @Request() req,
    @Body() dto: ToggleDestinationWalletDto
  ): Promise<Provider> {
    return this.providerService.toggleDestinationWallet(req.user.email, dto);
  }
}
