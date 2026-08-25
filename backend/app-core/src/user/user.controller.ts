import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UnauthorizedException,
  UseGuards,
  BadRequestException,
  Patch
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService } from '../auth/auth.service';
import { TwoFactorAuthService } from '../two-factor/verification.module';
import { UserService } from './user.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { VerifyTokenDto } from 'src/two-factor/dto';
import { LocalAuthGuard } from '../guard/auth/local-auth.guard';
import { AuthenticatedGuard } from '../guard/auth/authenticated.guard';
import { EmailThrottlerGuard } from '../guard/auth/email-throttler.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile';
import { UpdateTokenStatusDto } from './dto/update-token-status.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { ForgotPasswordService } from './forgot.password.service';
import { ResendTokenDto } from './dto/resend-token.dto';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
    private readonly forgotPasswordService: ForgotPasswordService,
  ) { }



  // REGISTRA UN NUEVO USUARIO EN EL SISTEMA CREANDO SU CUENTA EN BASE A LOS DATOS SUMINISTRADOS
  @UseGuards(EmailThrottlerGuard)
  @Post('register')
  registerUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.register(createUserDto);
  }



  // PROCESA LAS CREDENCIALES DEL USUARIO ESTABLECE LA SESION Y DESENCADENA LA AUTENTICACION DE DOS PASOS SI APLICA
  @UseGuards(EmailThrottlerGuard, LocalAuthGuard)
  @Post('login')
  async loginUser(@Request() req) {
    return this.authService.login(req.user, req);
  }



  // VERIFICA EL TOKEN PROPORCIONADO POR EL USUARIO PARA COMPLETAR SATISFACTORIAMENTE EL INICIO DE SESION SEGURO
  @UseGuards(EmailThrottlerGuard)
  @Post('verify-token')
  async verifyToken(@Body() verifyTokenDto: VerifyTokenDto, @Request() req) {
    return this.authService.verifyAndLogin(verifyTokenDto, req);
  }



  // GENERA Y ENVIA UN NUEVO TOKEN DE SEGURIDAD AL CORREO DEL USUARIO DURANTE EL PROCESO DE INICIO DE SESION
  @UseGuards(EmailThrottlerGuard)
  @Post('resend-token')
  async resendToken(@Request() req, @Body() resendTokenDto: ResendTokenDto) {
    const email = req.user?.email || resendTokenDto.email;
    if (!email) {
      throw new BadRequestException('Email is required.');
    }
    try {
      await this.twoFactorAuthService.resendToken(email);
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      console.error('resendToken error:', e.message);
    }
    return { message: 'If the email exists, a verification code has been sent.' };
  }



  // MODIFICA LA CONFIGURACION DE SEGURIDAD DEL USUARIO PERMITIENDOLE HABILITAR O DESHABILITAR LA AUTENTICACION DE DOS PASOS
  @UseGuards(AuthenticatedGuard, EmailThrottlerGuard)
  @Patch('update-token-status')
  async updateTokenStatus(@Request() req, @Body() updateTokenStatusDto: UpdateTokenStatusDto) {
    const email = req.user.email;
    return this.userService.updateTokenStatus(email, updateTokenStatusDto.isTokenEnabled);
  }



  // OBTIENE Y DEVUELVE EL ESTADO ACTUAL DE LA CONFIGURACION DE AUTENTICACION DE DOS PASOS PARA LA SESION ACTIVA
  @UseGuards(AuthenticatedGuard)
  @Get('token-status')
  async getTokenStatus(@Request() req) {
    const email = req.user.email;
    return this.userService.getTokenStatus(email);
  }



  // ACTUALIZA LA PREFERENCIA DE IDIOMA EN EL PERFIL DEL USUARIO PARA PERSONALIZAR SU EXPERIENCIA EN LA PLATAFORMA
  @UseGuards(AuthenticatedGuard, EmailThrottlerGuard)
  @Patch('language')
  async updateLanguage(@Request() req, @Body() updateLanguageDto: UpdateLanguageDto) {
    const email = req.user.email;
    return this.userService.updateLanguage(email, updateLanguageDto.language);
  }



  // RECUPERA EL IDIOMA ACTUAL CONFIGURADO POR EL USUARIO PARA MOSTRAR LA INTERFAZ DE FORMA ACORDE
  @UseGuards(AuthenticatedGuard)
  @Get('language')
  async getUserLanguage(@Request() req) {
    const email = req.user.email;
    return this.userService.getUserLanguage(email);
  }



  // DEVUELVE TODA LA INFORMACION NO CONFIDENCIAL DEL USUARIO AUTENTICADO OCULTANDO DATOS CRITICOS COMO SU CONTRASENA
  @UseGuards(AuthenticatedGuard)
  @Get('info')
  getUsers(@Request() req) {
    const userObj = req.user._doc || req.user;
    const { password, resetPasswordTokenHash, resetPasswordTokenPurpose, ...safeUser } = userObj;
    return {
      data: safeUser
    };
  }



  // TERMINA DEFINITIVAMENTE LA SESION ACTUAL DEL USUARIO DESTRUYENDO SUS DATOS EN EL SERVIDOR POR SEGURIDAD
  @UseGuards(AuthenticatedGuard)
  @Post('logout')
  logout(@Request() req) {
    req.logout((err) => {
      if (req.session) {
        req.session.destroy(() => { });
      }
    });
  }



  // VALIDA LA CONTRASENA ACTUAL Y APLICA LA NUEVA CONTRASENA ENCRIPTADA A LA CUENTA DEL USUARIO AUTENTICADO
  @UseGuards(AuthenticatedGuard, EmailThrottlerGuard)
  @Post('change-password')
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    const email = req.user.email;
    return this.userService.changePassword(email, changePasswordDto);
  }



  // ACTUALIZA LOS DATOS BASICOS DEL PERFIL DEL USUARIO COMO SU NOMBRE O CORREO REGISTRANDO LOS CAMBIOS REALIZADOS
  @UseGuards(AuthenticatedGuard, EmailThrottlerGuard)
  @Post('update-profile')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    const email = req.user.email;
    return this.userService.updateProfile(email, updateProfileDto, req);
  }



  // PROCESA EL TOKEN RECIBIDO Y CAMBIA EL ESTADO DE LA CUENTA A VERIFICADA SI LA INFORMACION ES CORRECTA
  @UseGuards(AuthenticatedGuard, EmailThrottlerGuard)
  @Post('verify-email')
  async verifyEmail(@Request() req, @Body() body: { token: string }): Promise<{ message: string }> {
    const userEmail = req.user.email;
    if (!body || !body.token) {
      throw new BadRequestException('The verification token is required.');
    }
    try {
      const result = await this.userService.verifyEmail(userEmail, body.token);
      return { message: 'Email verified successfully.' };
    } catch (error: unknown) {
      const e = error instanceof Error ? error : new Error(String(error));
      throw new BadRequestException(e.message || 'The email could not be verified.');
    }
  }



  // ACTIVA EL PROCESO PARA CREAR Y ENVIAR POR CORREO UN NUEVO ENLACE CON UN TOKEN PARA CONFIRMAR LA CUENTA
  @UseGuards(EmailThrottlerGuard, AuthenticatedGuard)
  @Post('send-verification-email')
  async sendVerificationEmail(@Request() req): Promise<{ message: string }> {
    const email = req.user.email;
    try {
      const result = await this.userService.sendVerificationEmail(email);
      return { message: 'Verification email sent successfully.' };
    } catch (error: unknown) {
      const e = error instanceof Error ? error : new Error(String(error));
      throw new BadRequestException(e.message || 'Could not send verification email.');
    }
  }



  // CONSULTA Y DEVUELVE EL ESTADO ACTUAL DE VERIFICACION DEL CORREO ELECTRONICO PARA EL USUARIO EN SESION
  @UseGuards(AuthenticatedGuard)
  @Get('is-email-verified')
  async isEmailVerified(@Request() req): Promise<{ isVerified: boolean; message: string }> {
    const email = req.user.email;
    return this.userService.isEmailVerified(email);
  }



  // BUSCA USUARIOS EN LA BASE DE DATOS MEDIANTE UN TEXTO COINCIDENTE Y RETORNA LOS RESULTADOS LIMITADOS Y SEGUROS
  @UseGuards(EmailThrottlerGuard, AuthenticatedGuard)
  @Get('search')
  async searchUsers(@Request() req) {
    const q = typeof req.query === 'object' ? req.query.q : undefined;
    const results = await this.userService.searchUsers(q);
    return { data: results };
  }



  // INICIA EL FLUJO DE RECUPERACION DE CONTRASENA GENERANDO UN TOKEN Y ENVIANDOLO AL CORREO SOLICITADO SI EXISTE
  @UseGuards(EmailThrottlerGuard)
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    const { email } = body;
    try {
      await this.forgotPasswordService.requestPasswordReset(email);
    } catch {
    }
    return { message: 'Reset email sent if the user exists.' };
  }



  // COMPRUEBA EL TOKEN DE RESTABLECIMIENTO Y ACTUALIZA LA CONTRASENA DEL USUARIO SI TODO EL PROCESO ES VALIDO
  @UseGuards(EmailThrottlerGuard)
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    const { email, token, newPassword, confirmNewPassword } = body;
    try {
      return await this.forgotPasswordService.resetPassword(email, token, newPassword, confirmNewPassword);
    } catch (error: unknown) {
      const e = error instanceof Error ? error : new Error(String(error));
      throw new BadRequestException(e.message || 'Could not reset the password.');
    }
  }
}
