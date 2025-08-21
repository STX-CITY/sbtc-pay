export interface Product {
  id: string;
  name: string;
  description?: string;
  type: string;
  price: number;
  price_usd?: number;
  currency: string;
  images?: string[];
  active: boolean;
  created: number;
  updated: number;
  metadata?: Record<string, string>;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  price_usd?: number;
  images?: string[];
  active?: boolean;
  metadata?: Record<string, string>;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  price_usd?: number;
  images?: string[];
  active?: boolean;
  metadata?: Record<string, string>;
}