import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  // UseGuards,
} from '@nestjs/common';
import { AccountManagementService } from './account-management.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountFilterDto } from './dto/account-filter.dto';
import { AccountResponse } from './models/account-response.type';
import { AccountListResponse } from './models/account-list.type';
// import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
// import { RolesGuard } from '../../common/guards/roles.guard';
// import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/accounts')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('admin', 'leader')
export class AccountManagementController {
  constructor(
    private readonly accountManagementService: AccountManagementService,
  ) {}

  @Get('filters/options')
  async getFilterOptions() {
    return this.accountManagementService.getFilterOptions();
  }

  @Get()
  async findAll(
    @Query() filterDto: AccountFilterDto,
  ): Promise<AccountListResponse> {
    return this.accountManagementService.findAll(filterDto);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AccountResponse> {
    return this.accountManagementService.findOne(id);
  }

  @Post()
  async create(
    @Body() createAccountDto: CreateAccountDto,
  ): Promise<AccountResponse> {
    return this.accountManagementService.create(createAccountDto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAccountDto: UpdateAccountDto,
  ): Promise<AccountResponse> {
    return this.accountManagementService.update(id, updateAccountDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.accountManagementService.remove(id);
  }

  @Patch(':id/lock')
  async lockAccount(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AccountResponse> {
    return this.accountManagementService.updateStatus(id, 'blocked');
  }

  @Patch(':id/unlock')
  async unlockAccount(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AccountResponse> {
    return this.accountManagementService.updateStatus(id, 'active');
  }
}
