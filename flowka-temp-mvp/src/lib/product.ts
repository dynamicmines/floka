export type Category = 'flowers' | 'toys';
export type Product = {
  id: string;
  externalId: string;
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  oldPrice: number | null;
  available: boolean;
  category: Category;
  tags: string[];
  stockQuantity: number | null;
};
export type CartItem = {
  externalId: string;
  name: string;
  imageUrl?: string;
  category: Category;
  unitPrice: number;
  quantity: number;
};
