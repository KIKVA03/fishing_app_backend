import { Controller, Get } from '@nestjs/common';
import { FishInfoService } from './fish-info.service';

// Public: the app fetches the whole bait knowledge base in one call.
@Controller('fish-info')
export class FishInfoController {
  constructor(private readonly fishInfoService: FishInfoService) {}

  @Get()
  findAll() {
    return this.fishInfoService.findAll();
  }
}
