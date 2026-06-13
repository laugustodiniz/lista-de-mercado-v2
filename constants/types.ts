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
  price?: number; // preço unitário em R$ — estimado do histórico ou editado manualmente
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

export type PriceEstimate = {
  price: number; // preço unitário da compra mais recente que casou com o nome
  unit: string;
  date: string;
  store?: string;
  count: number; // quantas compras embasam a estimativa (indicador de confiança)
};
