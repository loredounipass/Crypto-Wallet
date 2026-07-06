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

// User controller for handling user-related routes such as registration, login, profile updates, and password management. It uses guards to protect certain routes and interacts with the UserService, AuthService, TwoFactorAuthService, and ForgotPasswordService to perform its operations.
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
    private readonly forgotPasswordService: ForgotPasswordService,
  ) { }

  // Route for user registration. It accepts a CreateUserDto object in the request body and calls the register method of the UserService to create a new user.
  @UseGuards(EmailThrottlerGuard)
  @Post('register')
  registerUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.register(createUserDto);
  }


  // Route for user login. It uses the LocalAuthGuard to authenticate the user based on the provided credentials in the LoginUserDto. If authentication is successful, it calls the login method of the AuthService to generate a JWT token and handle two-factor authentication if enabled.
  @UseGuards(EmailThrottlerGuard, LocalAuthGuard)
  @Post('login')
  async loginUser(@Request() req) {
    // Passport has already validated credentials and populated `req.user`.
    return this.authService.login(req.user, req);
  }


  // Route for verifying the two-factor authentication token. It accepts a VerifyTokenDto object in the request body and calls the verifyAndLogin method of the AuthService to validate the token and complete the login process.
  @UseGuards(EmailThrottlerGuard)
  @Post('verify-token')
  async verifyToken(@Body() verifyTokenDto: VerifyTokenDto, @Request() req) {
    return this.authService.verifyAndLogin(verifyTokenDto, req);
  }


  // Route for resending the two-factor authentication token. 
  // Works for both authenticated users (uses session email) and unauthenticated users in 2FA flow (uses body email).
  @UseGuards(EmailThrottlerGuard)
  @Post('resend-token')
  async resendToken(@Request() req, @Body() resendTokenDto: ResendTokenDto) {
    // Use email from authenticated session if available, otherwise from body (for 2FA flow)
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
    // Always return the same message to prevent email enumeration
    return { message: 'If the email exists, a verification code has been sent.' };
  }


  // Route for updating the status of two-factor authentication for the authenticated user. It uses the authenticated user's email to update the token status.
  @UseGuards(AuthenticatedGuard, EmailThrottlerGuard)
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


  // Route for updating the user's language preference
  @UseGuards(AuthenticatedGuard, EmailThrottlerGuard)
  @Patch('language')
  async updateLanguage(@Request() req, @Body() updateLanguageDto: UpdateLanguageDto) {
    const email = req.user.email;
    return this.userService.updateLanguage(email, updateLanguageDto.language);
  }

  // Route for retrieving the user's language preference
  @UseGuards(AuthenticatedGuard)
  @Get('language')
  async getUserLanguage(@Request() req) {
    const email = req.user.email;
    return this.userService.getUserLanguage(email);
  }

  // Route for retrieving the authenticated user's information. It uses the AuthenticatedGuard to ensure that only authenticated users can access this route, and returns the user's data from the request object.
  @UseGuards(AuthenticatedGuard)
  @Get('info')
  getUsers(@Request() req) {
    // Make sure to use the plain object (depending on how Passport serializes)
    const userObj = req.user._doc || req.user;
    // Omitir campos altamente sensibles
    const { password, resetPasswordTokenHash, resetPasswordTokenPurpose, ...safeUser } = userObj;
    return {
      data: safeUser
    };
  }


  // Route for logging out the authenticated user. It uses the AuthenticatedGuard to ensure that only authenticated users can access this route, and calls the logout method on the request object to end the user's session.
  @UseGuards(AuthenticatedGuard)
  @Post('logout')
  logout(@Request() req) {
    req.logout((err) => {
      if (req.session) {
        req.session.destroy(() => { });
      }
    });
  }


  // Route for changing the authenticated user's password. It accepts a ChangePasswordDto object in the request body and calls the changePassword method of the UserService to update the user's password based on their email.
  @UseGuards(AuthenticatedGuard, EmailThrottlerGuard)
  @Post('change-password')
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    const email = req.user.email;
    return this.userService.changePassword(email, changePasswordDto);
  }


  // Route for updating the authenticated user's profile information. It accepts an UpdateProfileDto object in the request body and calls the updateProfile method of the UserService to update the user's profile based on their email.
  @UseGuards(AuthenticatedGuard, EmailThrottlerGuard)
  @Post('update-profile')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    const email = req.user.email;
    return this.userService.updateProfile(email, updateProfileDto, req);
  }


  // Route for verifying the authenticated user's email address. It retrieves the user's email from the authenticated session and calls the verifyEmail method of the UserService to verify the email. If successful, it returns a success message; otherwise, it throws a BadRequestException with an error message.
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

  // Route for sending a verification email to the authenticated user. It accepts an email address in the request body and calls the sendVerificationEmail method of the UserService to send a verification email. If successful, it returns a success message; otherwise, it throws a BadRequestException with an error message.
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


  // Route for checking if the authenticated user's email address is verified. It retrieves the user's email from the request object and calls the isEmailVerified method of the UserService to check the verification status. It returns an object containing a boolean indicating whether the email is verified and a message.
  @UseGuards(AuthenticatedGuard)
  @Get('is-email-verified')
  async isEmailVerified(@Request() req): Promise<{ isVerified: boolean; message: string }> {
    const email = req.user.email;
    return this.userService.isEmailVerified(email);
  }

  // Search users endpoint used by frontend (e.g. /user/search?q=...)
  @UseGuards(EmailThrottlerGuard, AuthenticatedGuard)
  @Get('search')
  async searchUsers(@Request() req) {
    const q = typeof req.query === 'object' ? req.query.q : undefined;
    const results = await this.userService.searchUsers(q);
    return { data: results };
  }



  // Route for handling the forgot password functionality. It accepts an email address in the request body and calls the requestPasswordReset method of the ForgotPasswordService to initiate the password reset process. If successful, it returns a message indicating that a reset email has been sent; otherwise, it throws a BadRequestException with an error message.
  @UseGuards(EmailThrottlerGuard)
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    const { email } = body;
    try {
      await this.forgotPasswordService.requestPasswordReset(email);
    } catch {
      // Swallow all errors to prevent email enumeration
    }
    return { message: 'Reset email sent if the user exists.' };
  }



  // Route for resetting the user's password. It accepts an email address, a reset token, a new password, and a confirmation of the new password in the request body. It calls the resetPassword method of the ForgotPasswordService to update the user's password. If successful, it returns a success message; otherwise, it throws a BadRequestException with an error message.
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
