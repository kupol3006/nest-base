import { name } from './../../node_modules/@types/ejs/index.d';
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDto, CheckCodeAuthDto, CreateAuthDto, GoogleLoginDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './passport/jwt-auth.guard';
import { Public, ResponseMessage } from 'src/decorator/customize';
import { MailerService } from '@nestjs-modules/mailer';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mailerService: MailerService
  ) { }

  @Public()
  @Post('login')
  @UseGuards(AuthGuard('local'))
  @ResponseMessage('Fetch login')
  handleLogin(@Request() req) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('register')
  register(@Body() registerDto: CreateAuthDto) {
    return this.authService.handleRegister(registerDto);
  }

  @Public()
  @Post('check-code')
  checkCode(@Body() registerDto: CheckCodeAuthDto) {
    return this.authService.handleCheckCode(registerDto);
  }

  @Public()
  @Post('retry-active')
  retryActive(@Body("email") email: string) {
    return this.authService.handleRetryActive(email);
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body("email") email: string) {
    return this.authService.handleForgotPassword(email);
  }

  @Public()
  @Post('change-password')
  changePassword(@Body() data: ChangePasswordDto) {
    return this.authService.handleChangePassword(data);
  }

  @Public()
  @Post('login-by-google')
  loginByGoogle(@Body() data: GoogleLoginDto) {
    return this.authService.handleLoginByGoogle(data);
  }


  // @Get('mail')
  // @Public()
  // async sendMail() {
  //   await this.mailerService.sendMail({
  //     to: 'phattruongdieu@gmail.com',
  //     // from: ' <your-email>',
  //     subject: 'Testing Nest MailerModule ✔',
  //     text: 'welcome',
  //     template: 'register',
  //     context: {
  //       name: 'Phat Truong',
  //       activationCode: 123456
  //     }
  //   });
  //   return 'Mail sent';

  // }

}
