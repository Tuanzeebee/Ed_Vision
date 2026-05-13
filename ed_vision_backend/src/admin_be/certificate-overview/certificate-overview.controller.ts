import { Controller, Get, Query } from '@nestjs/common';
import { CertificateOverviewService } from './certificate-overview.service';
import {
  CertificateOverviewQueryDto,
  CertificateOverviewResponse,
} from './dto/certificate-overview.dto';

@Controller('admin/dashboard/certificate-overview')
export class CertificateOverviewController {
  constructor(
    private readonly certificateOverviewService: CertificateOverviewService,
  ) {}

  /**
   * GET /admin/dashboard/certificate-overview?timeRange=this-month|last-month|this-quarter|this-year
   *
   * Aggregated payload for the admin "Executive Overview" dashboard
   * (`/admin/dashboard/certificate`): KPIs, daily traffic, certificate-type
   * distribution, weekly new vs returning students and recent platform-wide
   * activity highlights.
   */
  @Get()
  async getCertificateOverview(
    @Query() query: CertificateOverviewQueryDto,
  ): Promise<CertificateOverviewResponse> {
    return this.certificateOverviewService.getCertificateOverview(query);
  }
}
