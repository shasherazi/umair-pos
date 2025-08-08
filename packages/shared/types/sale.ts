export type SaleItem = {
  productId: number;
  quantity: number;
  price: number;
};

export type Sale = {
  id: number;
  storeId: number;
  saleTime: string;
  discount: number;
  saleItems: SaleItem[];
  createdAt: string;
  total?: number;
};
