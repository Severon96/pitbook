import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { OidcService } from './oidc.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SetupDto } from './dto/setup.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private oidcService: OidcService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Get('setup/status')
  async getSetupStatus() {
    const setupComplete = await this.authService.isSetupComplete();
    return { setupComplete };
  }

  @Public()
  @Post('setup')
  async setup(@Body() setupDto: SetupDto) {
    return this.authService.setupFirstAdmin(setupDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      authProvider: user.authProvider,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  @Public()
  @Get('oauth/config')
  async getOAuthConfig() {
    return {
      enabled: this.oidcService.isEnabled(),
    };
  }

  @Public()
  @Get('oauth/login')
  async oauthLogin(@Query('redirect') redirectUri: string, @Res() res: Response) {
    if (!this.oidcService.isEnabled()) {
      throw new BadRequestException('OAuth is not enabled');
    }

    // Create OAuth session with state and nonce
    const { state, nonce } = await this.authService.createOAuthSession(redirectUri);

    // Get authorization URL from OIDC provider
    const authUrl = await this.oidcService.getAuthorizationUrl(state, nonce);

    if (!authUrl) {
      throw new BadRequestException('Failed to generate OAuth URL');
    }

    // Redirect user to OIDC provider
    res.redirect(authUrl);
  }

  @Public()
  @Get('oauth/callback')
  async oauthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!this.oidcService.isEnabled()) {
      throw new BadRequestException('OAuth is not enabled');
    }

    if (!code || !state) {
      throw new BadRequestException('Missing code or state parameter');
    }

    try {
      // Validate OAuth session
      const session = await this.authService.validateOAuthSession(state);

      // Exchange code for tokens and get user info
      const userInfo = await this.oidcService.handleCallback(code, state);

      // Validate or create OIDC user
      const authResponse = await this.authService.validateOidcUser(
        userInfo.sub,
        userInfo.email,
        userInfo.preferredUsername || userInfo.name,
      );

      // Redirect to frontend with token
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const redirectUrl = session.redirectUri || frontendUrl;

      res.redirect(
        `${redirectUrl}?token=${authResponse.access_token}&auth=success`,
      );
    } catch (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
    }
  }
}
