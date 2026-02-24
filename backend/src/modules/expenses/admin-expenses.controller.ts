import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExpensesService } from './expenses.service';
import { AdminExpensesQueryDto } from './dto/admin-expenses-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('admin/expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async listAllExpenses(@Query() query: AdminExpensesQueryDto) {
    const { data, meta } =
      await this.expensesService.listAllExpensesAsAdmin(query);

    return {
      message: 'All expenses fetched successfully',
      data,
      meta,
    };
  }

  @Get(':expenseId')
  @HttpCode(HttpStatus.OK)
  async getExpenseDetail(@Param('expenseId') expenseId: string) {
    const expense =
      await this.expensesService.getExpenseDetailAsAdmin(expenseId);

    return {
      message: 'Expense detail fetched successfully',
      data: expense,
    };
  }

  @Delete(':expenseId/receipt')
  @HttpCode(HttpStatus.OK)
  async removeReceipt(@Param('expenseId') expenseId: string) {
    await this.expensesService.removeReceiptAsAdmin(expenseId);

    return {
      message: 'Receipt removed successfully',
      data: null,
    };
  }
}
