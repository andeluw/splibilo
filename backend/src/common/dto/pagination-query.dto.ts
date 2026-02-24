import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Expose({ name: 'page' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @Expose({ name: 'per_page' })
  perPage: number = 10;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  @Expose({ name: 'sort_dir' })
  sortDir: 'asc' | 'desc' = 'asc';

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  @Expose({ name: 'disable_pagination' })
  disablePagination: boolean = false;

  get offset(): number {
    const page = !this.page || this.page < 1 ? 1 : this.page;

    const perPage =
      !this.perPage || this.perPage < 1 || this.perPage > 100
        ? 10
        : this.perPage;

    return (page - 1) * perPage;
  }

  get limit(): number {
    const perPage =
      !this.perPage || this.perPage < 1 || this.perPage > 100
        ? 10
        : this.perPage;

    return perPage;
  }

  toMeta(count: number | null) {
    const page = this.page ?? 1;
    const perPage = this.perPage ?? 10;

    const maxPage =
      !count || perPage <= 0 ? 1 : Math.max(1, Math.ceil(count / perPage));

    return {
      page,
      per_page: perPage,
      max_page: maxPage,
      count,
    };
  }
}
