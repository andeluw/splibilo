import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminGroupsController } from './admin-groups.controller';
import { GroupBalanceService } from './group-balance.service';

@Module({
  controllers: [GroupsController, AdminGroupsController],
  providers: [GroupsService, PrismaService, GroupBalanceService],
  exports: [GroupsService, GroupBalanceService],
})
export class GroupsModule {}
