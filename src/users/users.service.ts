import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type SafeUser = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<SafeUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user ? this.toSafeUser(user) : null;
  }

  toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
