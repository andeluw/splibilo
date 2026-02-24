import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { SettlementsQueryDto } from './dto/settlements-query.dto';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';

@Controller('groups/:groupId/settlements')
@UseGuards(JwtAuthGuard)
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSettlement(
    @Request() req,
    @Param('groupId') groupId: string,
    @Body() dto: CreateSettlementDto,
  ) {
    const settlement = await this.settlementsService.createSettlement(
      groupId,
      req.user.userId,
      dto,
    );

    return {
      message: 'Settlement created successfully',
      data: settlement,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async listSettlements(
    @Request() req,
    @Param('groupId') groupId: string,
    @Query() query: SettlementsQueryDto,
  ) {
    const { data, meta } = await this.settlementsService.listSettlements(
      groupId,
      req.user.userId,
      query,
    );

    return {
      message: 'Settlements fetched successfully',
      data,
      meta,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getSettlementDetail(
    @Request() req,
    @Param('groupId') groupId: string,
    @Param('id') id: string,
  ) {
    const settlement = await this.settlementsService.getSettlementDetail(
      groupId,
      req.user.userId,
      id,
    );

    return {
      message: 'Settlement detail fetched successfully',
      data: settlement,
    };
  }
}
