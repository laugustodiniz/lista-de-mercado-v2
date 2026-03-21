export type Category =
  | 'Hortifruti'
  | 'Carnes e Aves'
  | 'Laticínios e Frios'
  | 'Padaria'
  | 'Mercearia'
  | 'Bebidas'
  | 'Congelados'
  | 'Higiene Pessoal'
  | 'Limpeza'
  | 'Outros';

export type Unit = 'un' | 'kg' | 'g' | 'L' | 'ml';

export const UNIT_OPTIONS: Unit[] = ['un', 'kg', 'g', 'L', 'ml'];

export type Item = {
  id: string;
  name: string;
  bought: boolean;
  category: Category;
  quantity?: number;
  unit?: Unit;
};

export type CategorizedItem = {
  name: string;
  category: Category;
};

export type ReceiptItem = {
  name: string;
  originalName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  category: Category;
};

export type PriceRecord = {
  id: string;
  itemName: string;
  price: number;
  unit: string;
  quantity: number;
  date: string;
  store?: string;
};
