import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { DrizzleService } from '../drizzle/drizzle.service';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let mockDrizzleService: any;
  let mockJwtService: any;

  const mockUser = {
    id: 'b69e41ac-14fb-4905-9305-9316d40f2931',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: '$2b$12$hashedpassword',
    role: 'USER' as const,
    authProvider: 'LOCAL' as const,
    isActive: true,
    oidcSub: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockChain = {
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([mockUser]),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([mockUser]),
      from: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    };

    mockDrizzleService = {
      db: {
        query: {
          users: {
            findFirst: jest.fn(),
          },
        },
        insert: jest.fn(() => mockChain),
        update: jest.fn(() => mockChain),
        select: jest.fn(() => mockChain),
      },
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock.jwt.token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DrizzleService,
          useValue: mockDrizzleService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateLocalUser', () => {
    it('should return user when credentials are valid', async () => {
      mockDrizzleService.db.query.users.findFirst.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateLocalUser('test@example.com', 'password');

      expect(result).toEqual(mockUser);
      expect(mockDrizzleService.db.query.users.findFirst).toHaveBeenCalled();
    });

    it('should return null when user is not found', async () => {
      mockDrizzleService.db.query.users.findFirst.mockResolvedValue(null);

      const result = await service.validateLocalUser('notfound@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      mockDrizzleService.db.query.users.findFirst.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateLocalUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null when user has no password hash (OAuth user)', async () => {
      const oauthUser = { ...mockUser, passwordHash: null, authProvider: 'OIDC' };
      mockDrizzleService.db.query.users.findFirst.mockResolvedValue(oauthUser);

      const result = await service.validateLocalUser('test@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when auth provider is not LOCAL', async () => {
      const oidcUser = { ...mockUser, authProvider: 'OIDC' };
      mockDrizzleService.db.query.users.findFirst.mockResolvedValue(oidcUser);

      const result = await service.validateLocalUser('test@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockDrizzleService.db.query.users.findFirst.mockResolvedValue(inactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.validateLocalUser('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('should return access token and user on successful login', async () => {
      jest.spyOn(service, 'validateLocalUser').mockResolvedValue(mockUser);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('access_token', 'mock.jwt.token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.role).toBe('USER');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should update lastLoginAt timestamp', async () => {
      jest.spyOn(service, 'validateLocalUser').mockResolvedValue(mockUser);

      await service.login(loginDto);

      expect(mockDrizzleService.db.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      jest.spyOn(service, 'validateLocalUser').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid email or password');
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'password123',
    };

    it('should create a new user and return access token', async () => {
      jest.spyOn(service, 'isSetupComplete').mockResolvedValue(true);
      mockDrizzleService.db.query.users.findFirst.mockResolvedValue(null);
      const newUser = { ...mockUser, email: registerDto.email, username: registerDto.username };
      const mockChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([newUser]),
      };
      mockDrizzleService.db.insert = jest.fn(() => mockChain);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('access_token');
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user.role).toBe('USER');
    });

    it('should hash password with bcrypt (12 rounds)', async () => {
      jest.spyOn(service, 'isSetupComplete').mockResolvedValue(true);
      mockDrizzleService.db.query.users.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
    });

    it('should throw ConflictException if setup is not complete', async () => {
      jest.spyOn(service, 'isSetupComplete').mockResolvedValue(false);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow(
        'Please complete initial setup first',
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      jest.spyOn(service, 'isSetupComplete').mockResolvedValue(true);
      mockDrizzleService.db.query.users.findFirst.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow(
        'Email or username already exists',
      );
    });

    it('should throw ConflictException if username already exists', async () => {
      jest.spyOn(service, 'isSetupComplete').mockResolvedValue(true);
      mockDrizzleService.db.query.users.findFirst.mockResolvedValue({
        ...mockUser,
        email: 'different@example.com',
        username: registerDto.username,
      });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('isSetupComplete', () => {
    it('should return true when users exist', async () => {
      mockDrizzleService.db.select().from().limit.mockResolvedValue([mockUser]);

      const result = await service.isSetupComplete();

      expect(result).toBe(true);
    });

    it('should return false when no users exist', async () => {
      mockDrizzleService.db.select().from().limit.mockResolvedValue([]);

      const result = await service.isSetupComplete();

      expect(result).toBe(false);
    });
  });

  describe('setupFirstAdmin', () => {
    const setupDto = {
      email: 'admin@example.com',
      username: 'admin',
      password: 'adminpassword',
    };

    it('should create first admin account', async () => {
      jest.spyOn(service, 'isSetupComplete').mockResolvedValue(false);
      const adminUser = { ...mockUser, ...setupDto, role: 'ADMIN' as const };
      const mockChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([adminUser]),
      };
      mockDrizzleService.db.insert = jest.fn(() => mockChain);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const result = await service.setupFirstAdmin(setupDto);

      expect(result).toHaveProperty('access_token');
      expect(result.user.role).toBe('ADMIN');
      expect(result.user.email).toBe(setupDto.email);
    });

    it('should throw ConflictException if setup already complete', async () => {
      jest.spyOn(service, 'isSetupComplete').mockResolvedValue(true);

      await expect(service.setupFirstAdmin(setupDto)).rejects.toThrow(ConflictException);
      await expect(service.setupFirstAdmin(setupDto)).rejects.toThrow(
        'Setup has already been completed',
      );
    });

    it('should hash admin password with bcrypt', async () => {
      jest.spyOn(service, 'isSetupComplete').mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      await service.setupFirstAdmin(setupDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(setupDto.password, 12);
    });
  });

  describe('validateJwtPayload', () => {
    const payload = {
      sub: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
    };

    it('should return user when payload is valid', async () => {
      mockDrizzleService.db.query.users.findFirst.mockResolvedValue(mockUser);

      const result = await service.validateJwtPayload(payload);

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockDrizzleService.db.query.users.findFirst.mockResolvedValue(null);

      await expect(service.validateJwtPayload(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateJwtPayload(payload)).rejects.toThrow('User not found');
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockDrizzleService.db.query.users.findFirst.mockResolvedValue(inactiveUser);

      await expect(service.validateJwtPayload(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateJwtPayload(payload)).rejects.toThrow('Account is inactive');
    });
  });
});
