import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
  };
}

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const user = await this.usersService.create(
      registerDto.username,
      registerDto.email,
      registerDto.password,
    );

    return this.buildAuthResponse(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByUsernameOrEmail(
      loginDto.usernameOrEmail,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      loginDto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user);
  }

  async validateUser(userId: string): Promise<User> {
    return await this.usersService.findById(userId);
  }

  private buildAuthResponse(user: User): AuthResponse {
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }
}
