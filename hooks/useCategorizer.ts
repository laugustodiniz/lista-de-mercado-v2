import { useState } from 'react';
import { Category } from '../constants/types';
import { VALID_CATEGORIES } from '../constants/categories';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const CATEGORIZE_PROMPT = `You are a Brazilian supermarket item categorizer.
Given an item name, return ONLY one of these exact category strings (in Portuguese):
"Hortifruti", "Carnes e Aves", "Laticínios e Frios", "Padaria", "Mercearia",
"Bebidas", "Congelados", "Higiene Pessoal", "Limpeza", "Outros"

Return ONLY the category string. No explanation, no quotes, no markdown.`;

async function categorizeItem(itemName: string): Promise<Category> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_KEY ?? '',
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: `${CATEGORIZE_PROMPT}\n\nItem: "${itemName}"`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`${res.status}`);
  }

  const data = await res.json();
  const text: string = data.content?.[0]?.text?.trim() ?? '';

  if (VALID_CATEGORIES.has(text)) {
    return text as Category;
  }

  return 'Outros';
}

export function useCategorizer() {
  const [isLoading, setIsLoading] = useState(false);

  async function categorize(itemName: string): Promise<Category> {
    setIsLoading(true);
    try {
      return await categorizeItem(itemName);
    } catch {
      return 'Outros';
    } finally {
      setIsLoading(false);
    }
  }

  return { categorize, isLoading };
}
