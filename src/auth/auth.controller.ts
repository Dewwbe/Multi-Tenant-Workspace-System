import { Body, Controller, Post } from '@nestjs/common';
import { apiResponse, ApiResponse } from '../common/dto/api-response.dto';
import { AuthResult, AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<ApiResponse<AuthResult>> {
    const result = await this.authService.register(dto);
    return apiResponse('User registered successfully', result);
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<ApiResponse<AuthResult>> {
    const result = await this.authService.login(dto);
    return apiResponse('Login successful', result);
  }
}