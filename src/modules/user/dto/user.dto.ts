import { IsString, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class UserResponseDto {
  id: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}
