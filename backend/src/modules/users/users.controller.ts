import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateMeDto } from './dto/update-me.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { UserActivityQueryDto } from './dto/user-activity-query.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Self / Me endpoints

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@Request() req) {
    const user = await this.usersService.getMe(req.user.userId);

    return {
      message: 'Profile fetched successfully',
      data: user,
    };
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  async updateMe(@Request() req, @Body() dto: UpdateMeDto) {
    const user = await this.usersService.updateMe(req.user.userId, dto);

    return {
      message: 'Profile updated successfully',
      data: user,
    };
  }

  @Get('user/activity')
  @HttpCode(HttpStatus.OK)
  async getMyActivity(@Request() req, @Query() query: UserActivityQueryDto) {
    const activity = await this.usersService.getMyActivity(
      req.user.userId,
      query,
    );

    return {
      message: 'User activity fetched successfully',
      data: activity,
    };
  }

  // Admin endpoints

  @Get('admin/users')
  @HttpCode(HttpStatus.OK)
  async listUsersAsAdmin(@Request() req, @Query() query: UsersQueryDto) {
    const { data, meta } = await this.usersService.listUsersAsAdmin(
      query,
      req.user.role,
    );

    return {
      message: 'Users fetched successfully',
      data,
      meta,
    };
  }

  @Get('admin/users/:id')
  @HttpCode(HttpStatus.OK)
  async getUserDetailAsAdmin(@Request() req, @Param('id') id: string) {
    const user = await this.usersService.getUserDetailAsAdmin(
      id,
      req.user.role,
    );

    return {
      message: 'User detail fetched successfully',
      data: user,
    };
  }

  @Patch('admin/users/:id')
  @HttpCode(HttpStatus.OK)
  async updateUserAsAdmin(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateUserAdminDto,
  ) {
    const user = await this.usersService.updateUserAsAdmin(
      id,
      dto,
      req.user.role,
    );

    return {
      message: 'User updated successfully',
      data: user,
    };
  }
}
