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

export type Item = {
  id: string;
  name: string;
  bought: boolean;
  category: Category;
};

export type CategorizedItem = {
  name: string;
  category: Category;
};
