import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from 'passport-local';
import { AuthService } from "../auth.service";


// Local passport strategy: only validate credentials and return the authenticated user.
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly authService: AuthService,
    ) {
        super({
            usernameField: 'email'
        });
    }


    // Passport expects the strategy to return the authenticated user object.
    // Do NOT handle 2FA or side effects here. Those belong in AuthService.login().
    async validate(email: string, password: string): Promise<any> {
        const user = await this.authService.validateUser(email, password);
        if (!user) {
            throw new UnauthorizedException('Credenciales incorrectas!');
        }
        return user;
    }
}
