import { IsEmail } from 'class-validator';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { comparePassword } from 'src/helpers/utils';
import { UsersService } from 'src/modules/users/users.service';
import { ChangePasswordDto, CheckCodeAuthDto, CreateAuthDto, GoogleLoginDto } from './dto/create-auth.dto';
import { In, Repository } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
  private client: OAuth2Client;
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.client = new OAuth2Client(configService.get('GOOGLE_CLIENT_ID'));
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(username);
    if (!user) {
      return null;
    }
    const isValidPassword = await comparePassword(pass, user.password);
    if (user && isValidPassword) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.email, sub: user.id };
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  async handleRegister(registerDto: CreateAuthDto) {
    return await this.usersService.handleRegister(registerDto);
  }

  async handleCheckCode(data: CheckCodeAuthDto) {
    return await this.usersService.handleActive(data);
  }

  async handleRetryActive(data: string) {
    return await this.usersService.handleRetryActive(data);
  }
  async handleForgotPassword(data: string) {
    return await this.usersService.handleForgotPassword(data);
  }

  async handleChangePassword(data: ChangePasswordDto) {
    return await this.usersService.handleChangePassword(data);
  }


  async handleLoginByGoogle(data: GoogleLoginDto) {
    const { id_token, accountType } = data;

    // Verify token
    const ticket = await this.client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new BadRequestException('Invalid Google token');
    }

    const { email, name, picture } = payload;

    // Check if user exists
    let user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      // Create new user if not exists
      user = this.usersRepository.create({
        email,
        name,
        image: picture,
        isActive: true,
        password: '',
        accountType: accountType,
      });
      await this.usersRepository.save(user);
    }

    const payload1 = { username: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload1);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        accountType: user.accountType,
      },
      access_token,
    };
  }
}