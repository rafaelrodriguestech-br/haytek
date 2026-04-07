import { Module } from '@nestjs/common';
import { DeliveryModule } from './modules/delivery/delivery.module';

@Module({
  imports: [DeliveryModule],
})
export class AppModule {}