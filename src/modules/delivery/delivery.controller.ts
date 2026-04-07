import { Controller, Get } from '@nestjs/common';
import { DeliveryService, DeliveryResponse } from './delivery.service';

@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get()
  async getDeliveries(): Promise<DeliveryResponse[]> {
    console.log('📥 [DeliveryController] Requisição recebida em /delivery');

    try {
      const result = await this.deliveryService.getDeliveries();

      console.log('📤 [DeliveryController] Resposta gerada:');
      console.dir(result, { depth: null }); // mostra objeto completo

      return result;
    } catch (error) {
      console.error('❌ [DeliveryController] Erro ao buscar entregas:');
      console.error(error);

      throw error;
    }
  }
}