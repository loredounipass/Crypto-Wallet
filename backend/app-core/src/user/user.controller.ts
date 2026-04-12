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
import { CreateUserDto } from './dto/create-user.dto';
import { VerifyTokenDto } from 'src/two-factor/dto';
import { LocalAuthGuard } from '../guard/auth/local-auth.guard';
import { AuthenticatedGuard } from '../guard/auth/authenticated.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile';
import { UpdateTokenStatusDto } from './dto/update-token-status.dto';
import { ForgotPasswordService } from './forgot.password.service';
import { ResendTokenDto } from './dto/resend-token.dto';

// User controller for handling user-related routes such as registration, login, profile updates, and password management. It uses guards to protect certain routes and interacts with the UserService, AuthService, TwoFactorAuthService, and ForgotPasswordService to perform its operations.
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
    private readonly forgotPasswordService: ForgotPasswordService,
  ) {}

  // Route for user registration. It accepts a CreateUserDto object in the request body and calls the register method of the UserService to create a new user.
  @Post('register')
  registerUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.register(createUserDto);
  }


  // Route for user login. It uses the LocalAuthGuard to authenticate the user based on the provided credentials in the LoginUserDto. If authentication is successful, it calls the login method of the AuthService to generate a JWT token and handle two-factor authentication if enabled.
  @UseGuards(ThrottlerGuard, LocalAuthGuard)
  @Post('login')
  async loginUser(@Request() req) {
    // Passport has already validated credentials and populated `req.user`.
    return this.authService.login(req.user, req);
  }


  // Route for verifying the two-factor authentication token. It accepts a VerifyTokenDto object in the request body and calls the verifyAndLogin method of the AuthService to validate the token and complete the login process.
  @UseGuards(ThrottlerGuard)
  @Post('verify-token')
  async verifyToken(@Body() verifyTokenDto: VerifyTokenDto, @Request() req) {
    return this.authService.verifyAndLogin(verifyTokenDto, req);
  }


  // Route for resending the two-factor authentication token. 
  // Works for both authenticated users (uses session email) and unauthenticated users in 2FA flow (uses body email).
  @UseGuards(ThrottlerGuard)
  @Post('resend-token')
  async resendToken(@Request() req, @Body() resendTokenDto: ResendTokenDto) {
    // Use email from authenticated session if available, otherwise from body (for 2FA flow)
    const email = req.user?.email || resendTokenDto.email;
    
    if (!email) {
      throw new BadRequestException('Se requiere correo electrónico.');
    }
    
    try {
      await this.twoFactorAuthService.resendToken(email);
    } catch (err) {
      console.error('resendToken error:', err.message || err);
    }
    // Always return the same message to prevent email enumeration
    return { message: 'Si el correo existe, se ha enviado un código de verificación.' };
  }


  // Route for updating the status of two-factor authentication for the authenticated user. It uses the authenticated user's email to update the token status.
  @UseGuards(AuthenticatedGuard)
  @Patch('update-token-status')
  async updateTokenStatus(@Request() req, @Body() updateTokenStatusDto: UpdateTokenStatusDto) {
    const email = req.user.email;
    return this.userService.updateTokenStatus(email, updateTokenStatusDto.isTokenEnabled);
  }

  // Route for retrieving the current status of the two-factor authentication token for the authenticated user. It calls the getTokenStatus method of the UserService to fetch the token status based on the user's email.
  @UseGuards(AuthenticatedGuard)
  @Get('token-status')
  async getTokenStatus(@Request() req) {
    const email = req.user.email;
    return this.userService.getTokenStatus(email);
  }


  // Route for retrieving the authenticated user's information. It uses the AuthenticatedGuard to ensure that only authenticated users can access this route, and returns the user's data from the request object.
  @UseGuards(AuthenticatedGuard)
  @Get('info')
  getUsers(@Request() req) {
    return {
      data: req.user
    };
  }


  // Route for logging out the authenticated user. It uses the AuthenticatedGuard to ensure that only authenticated users can access this route, and calls the logout method on the request object to end the user's session.
  @UseGuards(AuthenticatedGuard)
  @Post('logout')
  logout(@Request() req) {
    req.logout(() => {});
  }


  // Route for changing the authenticated user's password. It accepts a ChangePasswordDto object in the request body and calls the changePassword method of the UserService to update the user's password based on their email.
  @UseGuards(AuthenticatedGuard)
  @Post('change-password')
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    const email = req.user.email; 
    return this.userService.changePassword(email, changePasswordDto);
  }


  // Route for updating the authenticated user's profile information. It accepts an UpdateProfileDto object in the request body and calls the updateProfile method of the UserService to update the user's profile based on their email.
  @UseGuards(AuthenticatedGuard)
  @Post('update-profile')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    const email = req.user.email;
    return this.userService.updateProfile(email, updateProfileDto, req);
  }


// Route for verifying the authenticated user's email address. It retrieves the user's email from the authenticated session and calls the verifyEmail method of the UserService to verify the email. If successful, it returns a success message; otherwise, it throws a BadRequestException with an error message.
  @UseGuards(AuthenticatedGuard)
  @Post('verify-email')
  async verifyEmail(@Request() req): Promise<{ message: string }> {
    const userEmail = req.user.email;
    try {
        const result = await this.userService.verifyEmail(userEmail);
        return { message: 'Correo electrónico verificado con éxito.' };
    } catch (error) {
        throw new BadRequestException(error.message || 'El correo electrónico no pudo ser verificado.');
    }
}

// Route for sending a verification email to the authenticated user. It accepts an email address in the request body and calls the sendVerificationEmail method of the UserService to send a verification email. If successful, it returns a success message; otherwise, it throws a BadRequestException with an error message.
@UseGuards(AuthenticatedGuard)
@Post('send-verification-email')
async sendVerificationEmail(@Body() { email }: { email: string }): Promise<{ message: string }> {
    try {
        const result = await this.userService.sendVerificationEmail(email);
        return { message: 'Correo de verificación enviado con éxito.' };
    } catch (error) {
        throw new BadRequestException(error.message || 'No se pudo enviar el correo de verificación.');
    }
}


// Route for checking if the authenticated user's email address is verified. It retrieves the user's email from the request object and calls the isEmailVerified method of the UserService to check the verification status. It returns an object containing a boolean indicating whether the email is verified and a message.
@UseGuards(AuthenticatedGuard)
@Get('is-email-verified')
async isEmailVerified(@Request() req): Promise<{ isVerified: boolean; message: string }> {
    const email = req.user.email; 
    return this.userService.isEmailVerified(email); 
}


  // Search users endpoint used by frontend (e.g. /user/search?q=...)
  @UseGuards(ThrottlerGuard, AuthenticatedGuard)
  @Get('search')
  async searchUsers(@Request() req) {
    const q = typeof req.query === 'object' ? req.query.q : undefined;
    const results = await this.userService.searchUsers(q);
    return { data: results };
  }


// Route for handling the forgot password functionality. It accepts an email address in the request body and calls the requestPasswordReset method of the ForgotPasswordService to initiate the password reset process. If successful, it returns a message indicating that a reset email has been sent; otherwise, it throws a BadRequestException with an error message.
  @UseGuards(ThrottlerGuard)
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    const { email } = body;
    try {
      await this.forgotPasswordService.requestPasswordReset(email);
      return { message: 'Correo de restablecimiento enviado si el usuario existe.' };
    } catch (error) {
      throw new BadRequestException(error.message || 'No se pudo procesar la solicitud.');
    }
  }


  // Route for resetting the user's password. It accepts an email address, a reset token, a new password, and a confirmation of the new password in the request body. It calls the resetPassword method of the ForgotPasswordService to update the user's password. If successful, it returns a success message; otherwise, it throws a BadRequestException with an error message.
  @Post('reset-password')
  async resetPassword(@Body() body: { email: string; token: string; newPassword: string; confirmNewPassword: string }) {
    const { email, token, newPassword, confirmNewPassword } = body;
    try {
      return await this.forgotPasswordService.resetPassword(email, token, newPassword, confirmNewPassword);
    } catch (error) {
      throw new BadRequestException(error.message || 'No se pudo restableer la contraseña.');
    }
  }
}
