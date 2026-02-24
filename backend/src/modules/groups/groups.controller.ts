import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { GroupsQueryDto } from './dto/groups-query.dto';
import { GroupAnalyticsQueryDto } from './dto/group-analytics-query.dto';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createGroup(@Request() req, @Body() dto: CreateGroupDto) {
    const group = await this.groupsService.createGroup(req.user.userId, dto);

    return {
      message: 'Group created successfully',
      data: group,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async listMyGroups(@Request() req, @Query() query: GroupsQueryDto) {
    const { data, meta } = await this.groupsService.listMyGroups(
      req.user.userId,
      query,
    );

    return {
      message: 'Groups fetched successfully',
      data,
      meta,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getGroupDetail(@Request() req, @Param('id') id: string) {
    const group = await this.groupsService.getGroupDetail(id, req.user.userId);

    return {
      message: 'Group detail fetched successfully',
      data: group,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateGroup(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateGroupDto,
  ) {
    const group = await this.groupsService.updateGroup(
      id,
      req.user.userId,
      dto,
    );

    return {
      message: 'Group updated successfully',
      data: group,
    };
  }

  @Patch(':id/archive')
  @HttpCode(HttpStatus.OK)
  async archiveGroup(@Request() req, @Param('id') id: string) {
    const group = await this.groupsService.archiveGroup(id, req.user.userId);

    return {
      message: 'Group archived successfully',
      data: group,
    };
  }

  @Patch(':id/unarchive')
  @HttpCode(HttpStatus.OK)
  async unarchiveGroup(@Request() req, @Param('id') id: string) {
    const group = await this.groupsService.unarchiveGroup(id, req.user.userId);

    return {
      message: 'Group unarchived successfully',
      data: group,
    };
  }

  @Get(':id/members')
  @HttpCode(HttpStatus.OK)
  async listMembers(@Request() req, @Param('id') id: string) {
    const members = await this.groupsService.listMembers(
      id,
      req.user.userId,
      req.user.role,
    );

    return {
      message: 'Group members fetched successfully',
      data: members,
    };
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  async joinGroup(@Request() req, @Body() dto: JoinGroupDto) {
    const group = await this.groupsService.joinByInviteCode(
      req.user.userId,
      dto,
    );

    return {
      message: 'Joined group successfully',
      data: group,
    };
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.OK)
  async removeMember(
    @Request() req,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    await this.groupsService.removeMember(id, memberId, req.user.userId);

    return {
      message: 'Member removed from group',
      data: null,
    };
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  async leaveGroup(@Request() req, @Param('id') id: string) {
    await this.groupsService.leaveGroup(id, req.user.userId);

    return {
      message: 'Left group successfully',
      data: null,
    };
  }

  @Get(':id/balances')
  @HttpCode(HttpStatus.OK)
  async getGroupBalances(@Request() req, @Param('id') id: string) {
    const balances = await this.groupsService.getGroupBalances(
      id,
      req.user.userId,
    );

    return {
      message: 'Group balances fetched successfully',
      data: balances,
    };
  }

  @Get(':id/analytics')
  @HttpCode(HttpStatus.OK)
  async getGroupAnalytics(
    @Request() req,
    @Param('id') id: string,
    @Query() query: GroupAnalyticsQueryDto,
  ) {
    const analytics = await this.groupsService.getGroupAnalytics(
      id,
      req.user.userId,
      query,
    );

    return {
      message: 'Group analytics fetched successfully',
      data: analytics,
    };
  }
}
