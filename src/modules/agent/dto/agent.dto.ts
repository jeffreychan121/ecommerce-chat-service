import { IsString, IsObject, IsOptional } from 'class-validator';

export class AgentRequestDto {
  @IsString()
  system: string;  // order / member / product / after-sale

  @IsString()
  action: string; // query / logistics / create / cancel / ...

  @IsObject()
  @IsOptional()
  params?: Record<string, any>;

  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}

export class AgentResponseDto {
  success: boolean;
  data: any;
  message: string;
}