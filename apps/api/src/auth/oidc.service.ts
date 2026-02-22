import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class OidcService {
  private config: any = null;
  private readonly logger = new Logger(OidcService.name);
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    this.enabled = this.configService.get<string>('OIDC_ENABLED') === 'true';
  }

  async getConfig() {
    if (!this.enabled) {
      return null;
    }

    if (this.config) {
      return this.config;
    }

    try {
      const issuerUrl = this.configService.get<string>('OIDC_ISSUER_URL');
      const clientId = this.configService.get<string>('OIDC_CLIENT_ID');
      const clientSecret = this.configService.get<string>('OIDC_CLIENT_SECRET');
      const redirectUri = this.configService.get<string>('OIDC_REDIRECT_URI');

      if (!issuerUrl || !clientId || !redirectUri) {
        this.logger.warn('OIDC is enabled but not fully configured');
        return null;
      }

      // Discover OIDC configuration
      const response = await fetch(`${issuerUrl}/.well-known/openid-configuration`);
      const metadata = await response.json();

      this.config = {
        issuer: issuerUrl,
        clientId,
        clientSecret,
        redirectUri,
        authorizationEndpoint: metadata.authorization_endpoint,
        tokenEndpoint: metadata.token_endpoint,
        userinfoEndpoint: metadata.userinfo_endpoint,
      };

      this.logger.log(`Discovered OIDC issuer: ${issuerUrl}`);
      return this.config;
    } catch (error) {
      this.logger.error('Failed to initialize OIDC client', error);
      return null;
    }
  }

  async getAuthorizationUrl(state: string, nonce: string): Promise<string | null> {
    const config = await this.getConfig();
    if (!config) {
      return null;
    }

    const scope = this.configService.get<string>('OIDC_SCOPE') || 'openid profile email';

    // Generate PKCE parameters
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // Store code_verifier for later use (in production, use Redis)
    global[`pkce_${state}`] = codeVerifier;

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope,
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    // Replace host.docker.internal with localhost for browser-facing URL
    const authEndpoint = config.authorizationEndpoint.replace('host.docker.internal', 'localhost');
    return `${authEndpoint}?${params.toString()}`;
  }

  async handleCallback(code: string, state: string) {
    const config = await this.getConfig();
    if (!config) {
      throw new Error('OIDC client not configured');
    }

    const codeVerifier = global[`pkce_${state}`];
    if (!codeVerifier) {
      throw new Error('PKCE code verifier not found');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    // Get user info
    const userinfoResponse = await fetch(config.userinfoEndpoint, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userinfoResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo = await userinfoResponse.json();

    // Clean up PKCE verifier
    delete global[`pkce_${state}`];

    return {
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      preferredUsername: userInfo.preferred_username,
    };
  }

  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const hash = crypto.createHash('sha256').update(verifier).digest();
    return hash.toString('base64url');
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
