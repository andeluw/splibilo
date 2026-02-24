import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';
import { MAIL_TRANSPORTER } from './mail.constants';

@Module({
  providers: [
    {
      provide: MAIL_TRANSPORTER,
      useFactory: async () => {
        const transporter = nodemailer.createTransport({
          host: process.env.MAIL_HOST,
          port: Number(process.env.MAIL_PORT ?? 587),
          secure: false,
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
        });

        await transporter.verify().catch((err) => {
          console.error('Error verifying mail transporter:', err);
        });

        return transporter;
      },
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
