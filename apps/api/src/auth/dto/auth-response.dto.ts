export class AuthResponseDto {
  access_token: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: 'ADMIN' | 'USER';
    authProvider: 'LOCAL' | 'OIDC';
    isActive: boolean;
  };
}
