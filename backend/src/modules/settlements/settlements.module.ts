import { Module } from '@nestjs/common';
import { SettlementsController } from './settlements.controller';
import { SettlementsService } from './settlements.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GroupsModule } from '../groups/groups.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [GroupsModule, MailModule],
  controllers: [SettlementsController],
  providers: [SettlementsService, PrismaService],
  exports: [SettlementsService],
})
export class SettlementsModule {}
