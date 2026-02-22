import {ConflictException, Injectable, UnauthorizedException,} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {DrizzleService} from '../drizzle/drizzle.service';
import {users, oauthSessions} from '@pitbook/db';
import {eq, and, gt, lt} from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import {LoginDto} from './dto/login.dto';
import {RegisterDto} from './dto/register.dto';
import {SetupDto} from './dto/setup.dto';
import {AuthResponseDto} from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private drizzle: DrizzleService,
    private jwtService: JwtService,
  ) {}

  /**
   * Validate local user credentials
   */
  async validateLocalUser(email: string, password: string) {
    const user = await this.drizzle.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || user.authProvider !== 'LOCAL' || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    return user;
  }

  /**
   * Login with email and password
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateLocalUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login timestamp
    await this.drizzle.db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        authProvider: user.authProvider,
        isActive: user.isActive,
      },
    };
  }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if setup is complete
    const setupComplete = await this.isSetupComplete();
    if (!setupComplete) {
      throw new ConflictException('Please complete initial setup first');
    }

    // Check for existing user
    const existingUser = await this.drizzle.db.query.users.findFirst({
      where: (users, { or, eq }) =>
        or(
          eq(users.email, registerDto.email),
          eq(users.username, registerDto.username),
        ),
    });

    if (existingUser) {
      throw new ConflictException('Email or username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(registerDto.password, 12);

    // Create user
    const [newUser] = await this.drizzle.db
      .insert(users)
      .values({
        email: registerDto.email,
        username: registerDto.username,
        passwordHash,
        role: 'USER',
        authProvider: 'LOCAL',
      })
      .returning();

    const payload = {
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        authProvider: newUser.authProvider,
        isActive: newUser.isActive,
      },
    };
  }

  /**
   * Check if setup is complete (any users exist)
   */
  async isSetupComplete(): Promise<boolean> {
    const userCount = await this.drizzle.db
      .select()
      .from(users)
      .limit(1);

    return userCount.length > 0;
  }

  /**
   * Create first admin account during setup
   */
  async setupFirstAdmin(setupDto: SetupDto): Promise<AuthResponseDto> {
    const setupComplete = await this.isSetupComplete();
    if (setupComplete) {
      throw new ConflictException('Setup has already been completed');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(setupDto.password, 12);

    // Create admin user
    const [admin] = await this.drizzle.db
      .insert(users)
      .values({
        email: setupDto.email,
        username: setupDto.username,
        passwordHash,
        role: 'ADMIN',
        authProvider: 'LOCAL',
      })
      .returning();

    const payload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
        authProvider: admin.authProvider,
        isActive: admin.isActive,
      },
    };
  }

  /**
   * Validate JWT payload and return user
   */
  async validateJwtPayload(payload: any) {
    const user = await this.drizzle.db.query.users.findFirst({
      where: eq(users.id, payload.sub),
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    return user;
  }

  /**
   * Create OAuth session for state/nonce management
   */
  async createOAuthSession(redirectUri?: string) {
    const state = crypto.randomBytes(32).toString('hex');
    const nonce = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.drizzle.db.insert(oauthSessions).values({
      state,
      nonce,
      redirectUri,
      expiresAt,
    });

    return { state, nonce };
  }

  /**
   * Validate OAuth session and return nonce
   */
  async validateOAuthSession(state: string) {
    const session = await this.drizzle.db.query.oauthSessions.findFirst({
      where: and(
        eq(oauthSessions.state, state),
        gt(oauthSessions.expiresAt, new Date()),
      ),
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    // Delete session after use (one-time use)
    await this.drizzle.db
      .delete(oauthSessions)
      .where(eq(oauthSessions.state, state));

    return session;
  }

  /**
   * Validate OIDC user and auto-create if needed
   */
  async validateOidcUser(oidcSub: string, email: string, username?: string) {
    // Check if user exists by OIDC sub
    let user = await this.drizzle.db.query.users.findFirst({
      where: eq(users.oidcSub, oidcSub),
    });

    if (!user) {
      // Check if user exists by email (might be a local user wanting to link)
      const existingUser = await this.drizzle.db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser) {
        throw new ConflictException(
          'An account with this email already exists. Please use local login.',
        );
      }

      // Auto-create user from OIDC profile
      const [newUser] = await this.drizzle.db
        .insert(users)
        .values({
          email,
          username: username || email.split('@')[0],
          oidcSub,
          authProvider: 'OIDC',
          passwordHash: null, // No password for OIDC users
          role: 'USER',
        })
        .returning();

      user = newUser;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Update last login
    await this.drizzle.db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        authProvider: user.authProvider,
        isActive: user.isActive,
      },
    };
  }

  /**
   * Clean up expired OAuth sessions
   */
  async cleanupExpiredOAuthSessions() {
    await this.drizzle.db
      .delete(oauthSessions)
      .where(lt(oauthSessions.expiresAt, new Date()));
  }
}
