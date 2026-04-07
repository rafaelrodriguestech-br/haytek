// src/modules/delivery/delivery.module.ts
import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { ExternalService } from './external.service';

@Module({
  imports: [],
  controllers: [DeliveryController],
  providers: [DeliveryService, ExternalService],
})
export class DeliveryModule {}