import { Injectable, UnauthorizedException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { VerifyTokenDto } from 'src/two-factor/dto';
import { UserService } from '../user/user.service';
import { HashService } from '../user/hash.service';
import { TwoFactorAuthService } from '../two-factor/verification.module';
import { EmailService } from '../user/email.service';


// This service handles authentication-related operations such as validating user credentials, logging in users, and verifying two-factor authentication tokens. It interacts with the UserService to retrieve user information, HashService to compare passwords, TwoFactorAuthService to manage 2FA tokens, and EmailService to send login notifications. The service provides methods for validating user credentials, performing login operations, and verifying 2FA tokens before allowing access to protected resources.
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly hashService: HashService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
    private readonly emailService: EmailService,
  ) {}


  // This method validates the user's credentials by retrieving the user information based on the provided email and comparing the provided password with the stored hashed password. If the credentials are valid, it returns a safe user object without the password; otherwise, it returns null.
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.getUserByEmail(email);
    if (user && await this.hashService.comparePassword(password, user.password)) {
      const { password: _p, ...safeUser } = (user as any).toObject ? user.toObject() : user;
      return safeUser;
    }
    return null;
  }


  // Handle login given an already-validated `user` (from Passport `req.user`).
  // This avoids re-querying the database and re-checking the password.
  async login(user: any, req: any): Promise<any> {
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }
    if ((user as any).isTokenEnabled) {
      // send token for 2FA flow
      await this.twoFactorAuthService.sendToken((user as any).email);
      return { requires2FA: true, msg: 'Código de verificación enviado a tu correo electrónico.' };
    }

    return this.performLogin(user, req);
  }


  // This method verifies the provided two-factor authentication token for the user. It retrieves the user information based on the email, checks if 2FA is enabled, and then calls the TwoFactorAuthService to verify the token. If the token is valid, it proceeds to perform the login operation; otherwise, it throws an UnauthorizedException with an appropriate message.
  async verifyAndLogin(verifyTokenDto: VerifyTokenDto, req: any): Promise<any> {
    const { email, token } = verifyTokenDto;
    const user = await this.userService.getUserByEmail(email);
    if (!user) throw new UnauthorizedException('Usuario no encontrado.');
    if (!user.isTokenEnabled) throw new UnauthorizedException('2FA no está activado.');

    const { isValid, message } = await this.twoFactorAuthService.verifyToken(email, token);
    if (!isValid) {
      throw new UnauthorizedException(message || 'Código inválido o expirado.');
    }

    return this.performLogin(user, req);
  }


  // This private method performs the login operation by using Passport's req.login to establish a session for the user. It returns a promise that resolves with a success message if the login is successful, or rejects with an UnauthorizedException if there is an error during the login process. Additionally, it sends a login notification email to the user after a successful login.
  private performLogin(user: any, req: any) {
    return new Promise((resolve, reject) => {
      req.login(user, async (err) => {
        if (err) return reject(new UnauthorizedException('Error al iniciar sesión.'));

        void this.emailService.sendLoginNotificationEmail((user as any).email).catch(console.error);

        resolve({ msg: 'Logged in!' });
      });
    });
  }
}
