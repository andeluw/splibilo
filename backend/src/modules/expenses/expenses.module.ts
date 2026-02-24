import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminExpensesController } from './admin-expenses.controller';

@Module({
  controllers: [ExpensesController, AdminExpensesController],
  providers: [ExpensesService, PrismaService],
})
export class ExpensesModule {}
