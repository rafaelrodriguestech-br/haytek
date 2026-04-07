
export interface DeliveryResponse {
  shippingDate: string;       // Data da entrega
  carrier: string;            // Nome da transportadora
  address: DeliveryAddress;   // Endereço de entrega
  boxes: BoxResult[];         // Caixas geradas para essa entrega
}

export interface DeliveryAddress {
  city: string;
  neighborhood?: string;
  street?: string;
  complement?: string;
  zipcode?: string;
}

export interface BoxResult {
  type: string;           // Tipo da caixa: G, M, P
  quantity: number;       // Quantidade de caixas desse tipo
  capacity: number;       // Capacidade da caixa
  orders: string[];       // IDs dos pedidos contidos nessa caixa
}