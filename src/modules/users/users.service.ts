import { MailerService } from '@nestjs-modules/mailer';
import { hashPassword } from './../../helpers/utils';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import aqp from 'api-query-params';
import { ChangePasswordDto, CheckCodeAuthDto, CreateAuthDto } from 'src/auth/dto/create-auth.dto';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly mailerService: MailerService,
  ) { }


  isEmailExist = async (email: string) => {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (user) {
      return true;
    }
    return false;
  }

  async create(createUserDto: CreateUserDto) {
    const { name, email, password, phone, address, image } = createUserDto;

    // Check if email is already exist
    const isEmailExist = await this.isEmailExist(email);
    if (isEmailExist) {
      throw new BadRequestException('Email already exist');
    }

    const hashPasswordValue = await hashPassword(password);
    const user = this.usersRepository.create({
      name,
      email,
      password: hashPasswordValue,
      phone,
      address,
      image
    });
    return this.usersRepository.save(user);
  }

  async findAll(query: string, current: number, pageSize: number) {
    const { filter, sort } = aqp(query);
    if (filter.current) delete filter.current;
    if (filter.pageSize) delete filter.pageSize;
    if (!current) {
      current = 1;
    }
    if (!pageSize) {
      pageSize = 10;
    }

    const totalItems = await this.usersRepository.count({ where: filter });
    const totalPages = Math.ceil(totalItems / pageSize);
    const offset = (current - 1) * pageSize;
    const skip = offset > 0 ? offset : 0;

    const users = await this.usersRepository.find({
      skip,
      take: pageSize,
      order: sort,
      select: ['id', 'name', 'email', 'phone', 'address', 'image', 'role', 'accountType', 'isActive', 'codeId', 'codeExpired'],
      where: filter
    });
    return { users, totalPages };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async findOneByEmail(email: string) {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (!id) {
      throw new BadRequestException('ID is required');
    }
    return await this.usersRepository.update(id, updateUserDto);
  }

  async remove(id: string) {
    return await this.usersRepository.delete(id);
  }

  async handleRegister(registerDto: CreateAuthDto) {
    const { email, password, name } = registerDto;
    const isEmailExist = await this.isEmailExist(email);
    if (isEmailExist) {
      throw new BadRequestException('Email already exist');
    }
    const hashPasswordValue = await hashPassword(password);

    const codeId = uuidv4();
    const user = await this.usersRepository.create({
      name,
      email,
      password: hashPasswordValue,
      isActive: false,
      codeId: codeId,
      codeExpired: dayjs().add(5, 'minutes').toDate(),
      phone: '', // Default value
      address: '', // Default value
      image: '', // Default value
    });
    await this.usersRepository.save(user);


    // send email
    this.mailerService.sendMail({
      to: user.email,
      subject: 'Activate your account',
      template: 'register',
      context: {
        name: user?.name ?? user.email,
        activationCode: user.codeId
      }
    });
    // response
    return {
      id: user.id,
      email: user.email,
    }
  }

  async handleActive(data: CheckCodeAuthDto) {
    const user = await this.usersRepository.findOne({
      where: {
        id: data.id,
        codeId: data.code,
      }
    });
    if (!user) {
      throw new BadRequestException('User not found or invalid code');
    }
    // Check if code is expired
    if (dayjs().isAfter(user.codeExpired)) {
      throw new BadRequestException('Code expired');
    }
    else {
      user.isActive = true;
      await this.usersRepository.save(user);
      return user;
    }
  }

  async handleRetryActive(email: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.isActive) {
      throw new BadRequestException('User already active');
    }
    user.codeId = uuidv4();
    user.codeExpired = dayjs().add(5, 'minutes').toDate();
    await this.usersRepository.save(user);

    // send email
    this.mailerService.sendMail({
      to: user.email,
      subject: 'Activate your account',
      template: 'register',
      context: {
        name: user?.name ?? user.email,
        activationCode: user.codeId
      }
    });
    return {
      id: user.id,
      email: user.email,
    }
  }

  async handleForgotPassword(email: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.codeId = uuidv4();
    user.codeExpired = dayjs().add(5, 'minutes').toDate();
    await this.usersRepository.save(user);

    // send email
    this.mailerService.sendMail({
      to: user.email,
      subject: 'Change your account',
      template: 'register',
      context: {
        name: user?.name ?? user.email,
        activationCode: user.codeId
      }
    });
    return {
      id: user.id,
      email: user.email,
    }
  }
  async handleChangePassword(data: ChangePasswordDto) {
    const user = await this.usersRepository.findOne({
      where: {
        email: data.email,
        codeId: data.code,
      }
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    // Check if code is expired
    if (dayjs().isAfter(user.codeExpired)) {
      throw new BadRequestException('Code expired');
    }
    else {
      user.password = await hashPassword(data.password);
      await this.usersRepository.save(user);
      return user;
    }
  }

}
