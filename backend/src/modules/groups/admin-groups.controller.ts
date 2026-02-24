import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { GroupsService } from './groups.service';
import { GroupsQueryDto } from './dto/groups-query.dto';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/groups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminGroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async listAllGroups(@Query() query: GroupsQueryDto) {
    const { data, meta } = await this.groupsService.listAllGroupsAsAdmin(query);

    return {
      message: 'All groups fetched successfully',
      data,
      meta,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getGroupDetail(@Param('id') id: string) {
    const group = await this.groupsService.getGroupDetailAsAdmin(id);

    return {
      message: 'Group detail fetched successfully',
      data: group,
    };
  }
}
