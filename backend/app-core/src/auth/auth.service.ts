import { Injectable, UnauthorizedException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { VerifyTokenDto } from 'src/two-factor/dto';
import { UserService } from '../user/user.service';
import { HashService } from '../user/hash.service';
import { TwoFactorAuthService } from '../two-factor/verification.module';
import { EmailService } from '../user/email.service';


// This service handles authentication-related operations such as validating user credentials, logging in users, and verifying two-factor authentication tokens. It interacts with the UserService to retrieve user information, HashService to compare passwords, TwoFactorAuthService to manage 2FA tokens, and EmailService to send login notifications. The service provides methods for validating user credentials, performing login operations, and verifying 2FA tokens before allowing access to protected resources.
@Injectable()
export class AuthService {
  // Dummy bcrypt hash used for constant-time comparison when user does not exist (VULN-01 fix)
  private static readonly DUMMY_HASH = '$2a$12$LJ3m4ys3Lk0TSwHgHgMr5eVMfGDI0UxpKn4eFNH8bR5y0ygI3Km6';
  // Maximum time (ms) allowed between login and 2FA verification (VULN-03 fix)
  private static readonly PENDING_2FA_TTL_MS = 10 * 60 * 1000;

  constructor(
    private readonly userService: UserService,
    private readonly hashService: HashService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
    private readonly emailService: EmailService,
  ) {}


  // VULN-01 FIX: Always execute bcrypt.compare to prevent timing-based user enumeration.
  // This method validates the user's credentials by retrieving the user information based on the provided email and comparing the provided password with the stored hashed password. If the credentials are valid, it returns a safe user object without the password; otherwise, it returns null.
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.getUserByEmail(email);
    const hash = user ? user.password : AuthService.DUMMY_HASH;
    const isValid = await this.hashService.comparePassword(password, hash);
    if (user && isValid) {
      const { password: _p, ...safeUser } = (user as any).toObject ? user.toObject() : user;
      return safeUser;
    }
    return null;
  }


  // VULN-03 FIX: Store pending2FA in session so verify-token can only be called after a successful credential check.
  // Handle login given an already-validated `user` (from Passport `req.user`).
  // This avoids re-querying the database and re-checking the password.
  async login(user: any, req: any): Promise<any> {
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    if ((user as any).isTokenEnabled) {
      // send token for 2FA flow
      await this.twoFactorAuthService.sendToken((user as any).email);
      // Store proof that credentials were validated in this session
      if (req.session) {
        req.session.pending2FA = {
          userId: (user as any)._id?.toString ? (user as any)._id.toString() : (user as any)._id,
          email: (user as any).email,
          timestamp: Date.now(),
        };
      }
      return { requires2FA: true, msg: 'Verification code sent to your email.' };
    }

    return this.performLogin(user, req);
  }


  // VULN-03 FIX: verify-token now requires a valid pending2FA session created by login().
  // The email is taken from the session (not the request body) to prevent email substitution attacks.
  // This method verifies the provided two-factor authentication token for the user. It retrieves the user information based on the email, checks if 2FA is enabled, and then calls the TwoFactorAuthService to verify the token. If the token is valid, it proceeds to perform the login operation; otherwise, it throws an UnauthorizedException with an appropriate message.
  async verifyAndLogin(verifyTokenDto: VerifyTokenDto, req: any): Promise<any> {
    // Require that the user completed the login (credential) step first
    const pending = req.session?.pending2FA;
    if (!pending || !pending.email || !pending.userId) {
      throw new UnauthorizedException('Must complete login step first.');
    }
    // Enforce a TTL on the pending 2FA window
    if (Date.now() - pending.timestamp > AuthService.PENDING_2FA_TTL_MS) {
      delete req.session.pending2FA;
      throw new UnauthorizedException('2FA session expired. Please login again.');
    }

    // Use the email from the session, not from the request body (prevents email substitution)
    const { token } = verifyTokenDto;
    const email = pending.email;

    const user = await this.userService.getUserByEmail(email);
    if (!user) throw new UnauthorizedException('User not found.');
    if (!user.isTokenEnabled) throw new UnauthorizedException('2FA is not enabled.');

    const { isValid, message } = await this.twoFactorAuthService.verifyToken(email, token);
    if (!isValid) {
      throw new UnauthorizedException(message || 'Invalid or expired code.');
    }

    // Clear the pending2FA flag before performing the actual login
    delete req.session.pending2FA;

    return this.performLogin(user, req);
  }


  // This private method performs the login operation by regenerating the session ID (to prevent session fixation) and using Passport's req.login to establish a session for the user. It returns a promise that resolves with a success message if the login is successful, or rejects with an UnauthorizedException if there is an error during the login process. Additionally, it sends a login notification email to the user after a successful login (throttled to once every 3 hours).
  private performLogin(user: any, req: any) {
    return new Promise((resolve, reject) => {
      const session = req.session;
      if (session) {
        session.regenerate((err) => {
          if (err) return reject(new UnauthorizedException('Error logging in.'));

          req.login(user, async (err) => {
            if (err) return reject(new UnauthorizedException('Error logging in.'));

            void this.sendThrottledLoginNotification((user as any).email).catch(console.error);

            resolve({ msg: 'Logged in!' });
          });
        });
      } else {
        req.login(user, async (err) => {
          if (err) return reject(new UnauthorizedException('Error logging in.'));

          void this.sendThrottledLoginNotification((user as any).email).catch(console.error);

          resolve({ msg: 'Logged in!' });
        });
      }
    });
  }


  // CONTROLA QUE EL EMAIL DE NOTIFICACION DE LOGIN SOLO SE ENVIE SI HAN PASADO MAS DE 3 HORAS DESDE EL ULTIMO ENVIO
  private static readonly LOGIN_EMAIL_COOLDOWN_MS = 3 * 60 * 60 * 1000; // 3 horas

  private async sendThrottledLoginNotification(email: string): Promise<void> {
    const user = await this.userService.getUserByEmail(email);
    if (!user) return;

    const lastSent = (user as any).lastLoginNotificationAt;
    const now = new Date();

    if (lastSent && (now.getTime() - new Date(lastSent).getTime()) < AuthService.LOGIN_EMAIL_COOLDOWN_MS) {
      return; // Aún dentro del cooldown de 3 horas, no enviar
    }

    // Actualizar timestamp y enviar el email
    await this.userService.updateLastLoginNotification(email, now);
    await this.emailService.sendLoginNotificationEmail(email);
  }
}

