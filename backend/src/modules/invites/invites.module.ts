import { Module } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { MailModule } from '../mail/mail.module';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [MailModule],
  providers: [InvitesService, PrismaService],
  controllers: [InvitesController],
})
export class InvitesModule {}
