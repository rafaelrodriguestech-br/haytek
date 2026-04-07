import { Injectable } from '@nestjs/common';
import { ExternalService } from './external.service';

export interface DeliveryResponse {
  shippingDate: string;
  carrier: string;
  address: {
    city: string;
    neighborhood: string;
    street: string;
    complement: string;
    zipcode: string;
  };
  totalItems: number;
  totalBoxes: number;
  boxes: {
    type: string;
    quantity: number;
    capacity: number;
    orders: string[];
  }[];
}

@Injectable()
export class DeliveryService {
  constructor(private readonly externalService: ExternalService) {}

  async getDeliveries(): Promise<DeliveryResponse[]> {
    console.log('🚀 Buscando dados das APIs externas...');

    const [orders, addresses, carriers, boxes] = await Promise.all([
      this.externalService.getOrders(),
      this.externalService.getAddresses(),
      this.externalService.getCarriers(),
      this.externalService.getBoxes(),
    ]);

    console.log(`📦 Orders: ${orders.length}`);
    console.log(`📍 Addresses: ${addresses.length}`);
    console.log(`🚚 Carriers: ${carriers.length}`);
    console.log(`📦 Boxes: ${boxes.length}`);

    // 🔥 1. ENRIQUECER COM SHIPPING DATE
    const enrichedOrders = orders.map((order) => {
      const carrier = carriers.find((c) => c.Id === order.carrierId);

      const shippingDate = this.calculateShippingDate(
        order.createdAt,
        carrier?.cutOffTime || '23:59'
      );

      return {
        ...order,
        shippingDate,
      };
    });

    // 🔥 2. ORDENAR POR SHIPPING DATE
    enrichedOrders.sort((a, b) => {
      if (a.shippingDate === b.shippingDate) {
        return a.Id.localeCompare(b.Id);
      }
      return new Date(a.shippingDate).getTime() - new Date(b.shippingDate).getTime();
    });

    // 🔥 3. AGRUPAR
    const grouped = new Map<string, any>();

    for (const order of enrichedOrders) {
      const carrier = carriers.find((c) => c.Id === order.carrierId);
      const address = addresses.find((a) => a.Id === order.addressId);

      if (!carrier || !address) continue;

      const key = `${order.shippingDate}_${carrier.Id}_${address.Id}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          shippingDate: order.shippingDate,
          carrier: carrier.name,
          address: {
            city: address.city,
            neighborhood: address.neighborhood,
            street: address.street,
            complement: address.complement,
            zipcode: address.zipcode,
          },
          totalItems: 0,
          totalBoxes: 0,
          boxes: [],
          _orders: [],
        });
      }

      const group = grouped.get(key);

      group.totalItems += order.quantity;
      group._orders.push(order);
    }

    // 🔥 4. PROCESSAR CAIXAS (BIN PACKING)
    const result: DeliveryResponse[] = [];

    for (const group of grouped.values()) {
      console.log('📦 Processando grupo:', group.shippingDate, group.carrier);

      const boxesResult = this.packBoxes(group._orders, boxes);

      const totalBoxes = boxesResult.reduce((sum, b) => sum + b.quantity, 0);

      result.push({
        shippingDate: group.shippingDate,
        carrier: group.carrier,
        address: group.address,
        totalItems: group.totalItems,
        totalBoxes: totalBoxes,
        boxes: boxesResult,
      });
    }

    console.log('✅ Resultado final gerado');
    console.log(JSON.stringify(result, null, 2));

    return result;
  }

  // 🔥 CALCULA SHIPPING DATE COM CUTOFF
  private calculateShippingDate(createdAt: string, cutOffTime: string): string {
    const orderDate = new Date(createdAt);

    const [cutHour, cutMinute] = cutOffTime.split(':').map(Number);

    const cutoffDate = new Date(orderDate);
    cutoffDate.setHours(cutHour, cutMinute, 0, 0);

    if (orderDate > cutoffDate) {
      orderDate.setDate(orderDate.getDate() + 1);
    }

    return orderDate.toISOString().split('T')[0];
  }

  private packBoxes(orders: any[], boxes: any[]) {
  console.log('📦 BOXES RAW:', boxes);

  if (!boxes || boxes.length === 0) {
    return [];
  }

  // 🔥 Normaliza boxes
  const validBoxes = boxes
    .map(b => ({
      type: b.type,
      capacity: Number(b.maxQuantity),
    }))
    .filter(b => b.capacity > 0);

  if (validBoxes.length === 0) {
    return [];
  }

  // 🔥 Ordena MAIOR → MENOR
  const sortedBoxes = [...validBoxes].sort((a, b) => b.capacity - a.capacity);

  // 🔥 Total de itens + IDs únicos
  let totalItems = 0;
  const orderIds: string[] = [];

  for (const order of orders) {
    totalItems += order.quantity;

    if (!orderIds.includes(order.Id)) {
      orderIds.push(order.Id);
    }
  }

  console.log('📦 TOTAL ITEMS:', totalItems);

  const result: any[] = [];

  // 🔥 GREEDY → usa maiores caixas primeiro
  for (const box of sortedBoxes) {
    if (totalItems <= 0) break;

    const quantity = Math.floor(totalItems / box.capacity);

    if (quantity > 0) {
      result.push({
        type: box.type,
        quantity: quantity,
        capacity: box.capacity,
        orders: orderIds,
      });

      totalItems -= quantity * box.capacity;
    }
  }

  // 🔥 SOBRA → pega menor caixa que caiba
  if (totalItems > 0) {
    const smallestBox = [...validBoxes]
      .sort((a, b) => a.capacity - b.capacity)
      .find(b => b.capacity >= totalItems);

    if (smallestBox) {
      result.push({
        type: smallestBox.type,
        quantity: 1,
        capacity: smallestBox.capacity,
        orders: orderIds,
      });
    }
  }

  // 🔥 🔥 🔥 FIX FINAL: AGRUPAR POR TIPO
  const grouped = new Map<string, any>();

  for (const box of result) {
    if (!grouped.has(box.type)) {
      grouped.set(box.type, {
        type: box.type,
        quantity: 0,
        capacity: box.capacity,
        orders: box.orders,
      });
    }

    grouped.get(box.type).quantity += box.quantity;
  }

  // 🔥 Ordena saída: G → M → P (opcional, mas elegante)
  const finalResult = Array.from(grouped.values()).sort(
    (a, b) => b.capacity - a.capacity
  );

  console.log('📦 RESULTADO FINAL AGRUPADO:', finalResult);

  return finalResult;
}
}