import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ExternalService {
  private readonly http = axios;
  private readonly baseUrl =
    'https://stg-api.haytek.com.br/api/v1/test-haytek-api';

  async getOrders(): Promise<any[]> {
    const response = await this.http.get(`${this.baseUrl}/orders`);
    return response.data;
  }

  async getAddresses(): Promise<any[]> {
    const response = await this.http.get(`${this.baseUrl}/adresses`);
    return response.data;
  }

  async getCarriers(): Promise<any[]> {
    const response = await this.http.get(`${this.baseUrl}/carriers`);
    return response.data;
  }

  async getBoxes(): Promise<any[]> {
    const response = await this.http.get(`${this.baseUrl}/boxes`);
    return response.data;
  }
}