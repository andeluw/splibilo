import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesQueryDto } from './dto/expenses-query.dto';

@Controller('groups/:groupId/expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createExpense(
    @Request() req,
    @Param('groupId') groupId: string,
    @Body() dto: CreateExpenseDto,
  ) {
    const expense = await this.expensesService.createExpense(
      groupId,
      req.user.userId,
      dto,
    );

    return {
      message: 'Expense created successfully',
      data: expense,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async listExpenses(
    @Request() req,
    @Param('groupId') groupId: string,
    @Query() query: ExpensesQueryDto,
  ) {
    const { data, meta } = await this.expensesService.listExpenses(
      groupId,
      req.user.userId,
      query,
    );

    return {
      message: 'Expenses fetched successfully',
      data,
      meta,
    };
  }

  @Get(':expenseId')
  @HttpCode(HttpStatus.OK)
  async getExpenseDetail(
    @Request() req,
    @Param('groupId') groupId: string,
    @Param('expenseId') expenseId: string,
  ) {
    const expense = await this.expensesService.getExpenseDetail(
      groupId,
      expenseId,
      req.user.userId,
    );

    return {
      message: 'Expense detail fetched successfully',
      data: expense,
    };
  }

  @Patch(':expenseId')
  @HttpCode(HttpStatus.OK)
  async updateExpense(
    @Request() req,
    @Param('groupId') groupId: string,
    @Param('expenseId') expenseId: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    const expense = await this.expensesService.updateExpense(
      groupId,
      expenseId,
      req.user.userId,
      dto,
    );

    return {
      message: 'Expense updated successfully',
      data: expense,
    };
  }

  @Delete(':expenseId')
  @HttpCode(HttpStatus.OK)
  async deleteExpense(
    @Request() req,
    @Param('groupId') groupId: string,
    @Param('expenseId') expenseId: string,
  ) {
    await this.expensesService.deleteExpense(
      groupId,
      expenseId,
      req.user.userId,
    );

    return {
      message: 'Expense deleted successfully',
      data: null,
    };
  }
}
