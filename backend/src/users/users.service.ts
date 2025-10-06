import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { randomUUID as uuid } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    username: string,
    email: string,
    password: string,
  ): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new ConflictException('Username already exists');
      }
      if (existingUser.email === email) {
        throw new ConflictException('Email already exists');
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      id: `user-${uuid()}`,
      username,
      email,
      passwordHash,
    });

    return await this.userRepository.save(user);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findByUsernameOrEmail(usernameOrEmail: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.passwordHash);
  }

  async updateProfile(
    userId: string,
    updates: { username?: string; email?: string },
  ): Promise<User> {
    const user = await this.findById(userId);

    if (updates.username && updates.username !== user.username) {
      const existingUser = await this.findByUsername(updates.username);
      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
      user.username = updates.username;
    }

    if (updates.email && updates.email !== user.email) {
      const existingUser = await this.findByEmail(updates.email);
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
      user.email = updates.email;
    }

    return await this.userRepository.save(user);
  }

  async changePassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.findById(userId);
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
  }

  async remove(userId: string): Promise<void> {
    const user = await this.findById(userId);
    await this.userRepository.remove(user);
  }
}
