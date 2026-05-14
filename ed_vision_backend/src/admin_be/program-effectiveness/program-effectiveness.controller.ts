import { Controller, Get, Query } from '@nestjs/common';
import { ProgramEffectivenessService } from './program-effectiveness.service';
import {
  ProgramEffectivenessQueryDto,
  ProgramEffectivenessResponse,
} from './dto/program-effectiveness.dto';

@Controller('admin/dashboard/program-effectiveness')
export class ProgramEffectivenessController {
  constructor(
    private readonly programEffectivenessService: ProgramEffectivenessService,
  ) {}

  /**
   * GET /admin/dashboard/program-effectiveness?certType=ielts|toeic|all
   *
   * Aggregated payload for the admin "Hiệu quả chương trình học" dashboard
   * (`/admin/program-effectiveness`): score comparison entry vs exit per
   * skill, standards-achievement doughnut, module impact list and group
   * effectiveness table.
   */
  @Get()
  async getProgramEffectiveness(
    @Query() query: ProgramEffectivenessQueryDto,
  ): Promise<ProgramEffectivenessResponse> {
    return this.programEffectivenessService.getProgramEffectiveness(query);
  }
}
