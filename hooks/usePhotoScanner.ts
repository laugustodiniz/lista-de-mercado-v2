import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Category, CategorizedItem } from '../constants/types';
import { VALID_CATEGORIES } from '../constants/categories';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const EXTRACTION_PROMPT = `You are a shopping list extractor for a Brazilian supermarket app.
Analyze the image and extract items that someone would buy at a supermarket.

Rules:
- If it's a handwritten or printed list: extract each item exactly as written.
- If it's a receipt: extract only product names. Ignore prices, totals, taxes, store info.
  Shorten names to 2-4 words (e.g. "ARROZ PARBORIZADO TIO JOAO 5KG" becomes "Arroz Parborizado").
- For each item, assign exactly one category from this list:
  "Hortifruti", "Carnes e Aves", "Laticínios e Frios", "Padaria", "Mercearia",
  "Bebidas", "Congelados", "Higiene Pessoal", "Limpeza", "Outros"
- Use Title Case in Portuguese for item names.
- Output ONLY a valid JSON array. No explanation, no markdown, no code block.
- Format: [{ "name": "Item Name", "category": "Category" }, ...]
- If no items found, return: []

Example: [{"name": "Arroz Parborizado", "category": "Mercearia"}, {"name": "Leite Integral", "category": "Laticínios e Frios"}]`;

function validateCategory(value: string): Category {
  return VALID_CATEGORIES.has(value) ? (value as Category) : 'Outros';
}

function parseCategorizedItems(text: string): CategorizedItem[] {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed = JSON.parse(cleaned) as Array<{ name: string; category: string }>;
  return parsed.map(item => ({
    name: String(item.name),
    category: validateCategory(item.category),
  }));
}

async function extractItemsFromBase64(base64: string): Promise<CategorizedItem[]> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_KEY ?? '',
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64,
              },
            },
            { type: 'text', text: EXTRACTION_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  const text: string = data.content?.[0]?.text?.trim() ?? '';
  return parseCategorizedItems(text);
}

export function usePhotoScanner() {
  const [isLoading, setIsLoading] = useState(false);

  async function scanFromGallery(): Promise<CategorizedItem[] | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão negada', 'Permita o acesso à galeria nas configurações do app.');
      return [];
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      base64: true,
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]?.base64) return [];

    return runExtraction(result.assets[0].base64);
  }

  async function scanFromCamera(): Promise<CategorizedItem[] | null> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão negada', 'Permita o acesso à câmera nas configurações do app.');
      return [];
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]?.base64) return [];

    return runExtraction(result.assets[0].base64);
  }

  async function runExtraction(base64: string): Promise<CategorizedItem[] | null> {
    setIsLoading(true);
    try {
      return await extractItemsFromBase64(base64);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Erro', msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { scanFromGallery, scanFromCamera, isLoading };
}
