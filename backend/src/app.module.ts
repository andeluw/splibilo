import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { GroupsModule } from './modules/groups/groups.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { SettlementsModule } from './modules/settlements/settlements.module';
import { MailModule } from './modules/mail/mail.module';
import { InvitesModule } from './modules/invites/invites.module';
import { UsersModule } from './modules/users/users.module';
import { UploadModule } from './modules/upload/upload.module';
import { ReceiptOcrModule } from './modules/receipt-ocr/receipt-ocr.module';

@Module({
  imports: [
    AuthModule,
    GroupsModule,
    ExpensesModule,
    SettlementsModule,
    MailModule,
    InvitesModule,
    UsersModule,
    UploadModule,
    ReceiptOcrModule,
  ],
})
export class AppModule { }
