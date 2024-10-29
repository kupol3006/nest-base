import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateAuthDto {
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    password: string;

    @IsOptional()
    name: string;
}

export class CheckCodeAuthDto {
    @IsNotEmpty()
    id: string;

    @IsNotEmpty()
    code: string;
}

export class ChangePasswordDto {
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    code: string;

    @IsNotEmpty()
    password: string;
}

export class GoogleLoginDto {
    @IsNotEmpty()
    id_token: string;

    @IsNotEmpty()
    accountType: string;
}