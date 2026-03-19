import { Category } from './types';

export const CATEGORY_ORDER: Category[] = [
  'Hortifruti',
  'Carnes e Aves',
  'Laticínios e Frios',
  'Padaria',
  'Mercearia',
  'Bebidas',
  'Congelados',
  'Higiene Pessoal',
  'Limpeza',
  'Outros',
];

export const CATEGORY_CONFIG: Record<Category, { icon: string; color: string }> = {
  'Hortifruti':         { icon: 'leaf-outline',                color: '#5DBB63' },
  'Carnes e Aves':      { icon: 'flame-outline',               color: '#E07B54' },
  'Laticínios e Frios': { icon: 'snow-outline',                color: '#5B9BD5' },
  'Padaria':            { icon: 'storefront-outline',          color: '#D4A017' },
  'Mercearia':          { icon: 'basket-outline',              color: '#9B59B6' },
  'Bebidas':            { icon: 'wine-outline',                color: '#3498DB' },
  'Congelados':         { icon: 'cube-outline',                color: '#1ABC9C' },
  'Higiene Pessoal':    { icon: 'heart-outline',               color: '#E91E63' },
  'Limpeza':            { icon: 'sparkles-outline',            color: '#FF9800' },
  'Outros':             { icon: 'ellipsis-horizontal-outline', color: '#B2BEC3' },
};

export const VALID_CATEGORIES = new Set<string>(CATEGORY_ORDER);
