import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Category, ReceiptItem } from '../constants/types';
import { parseCategory } from '../constants/categories';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const RECEIPT_PROMPT = `You are a Brazilian receipt (NFC-e / nota fiscal) data extractor.
Analyze the image of a receipt and extract ALL purchased items with their prices.

For each item, extract:
- name: Product name, simplified to 2-4 words in Title Case Portuguese
  (e.g., "ARROZ PARBOIL TIO JOAO 5KG" → "Arroz Parboilizado")
- originalName: The exact text from the receipt
- quantity: Number of units purchased
- unit: Unit of measurement — normalize to lowercase (un, kg, g, L, ml)
- unitPrice: Price per unit in R$ (number, no currency symbol)
- totalPrice: Total price for this item (quantity × unitPrice)
- category: Exactly one of:
  "Hortifruti", "Carnes e Aves", "Laticínios e Frios", "Padaria", "Mercearia",
  "Bebidas", "Congelados", "Higiene Pessoal", "Limpeza", "Outros"

Rules:
- Parse ALL items, including tax-exempt items
- Ignore lines that are totals, subtotals, payment method, change, store info, tax info
- If quantity is not explicit, assume 1 un
- Output ONLY a valid JSON array. No explanation, no markdown, no code block.
- Format: [{"name":"...","originalName":"...","quantity":1,"unit":"un","unitPrice":5.99,"totalPrice":5.99,"category":"..."}, ...]
- If no items found, return: []`;

function parseReceiptItems(text: string): ReceiptItem[] {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed = JSON.parse(cleaned) as Array<{
    name: string;
    originalName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    category: string;
  }>;
  return parsed.map(item => ({
    name: String(item.name),
    originalName: String(item.originalName ?? item.name),
    quantity: Number(item.quantity) || 1,
    unit: String(item.unit ?? 'un').toLowerCase(),
    unitPrice: Number(item.unitPrice) || 0,
    totalPrice: Number(item.totalPrice) || 0,
    category: parseCategory(item.category),
  }));
}

async function extractReceiptFromBase64(base64: string): Promise<ReceiptItem[]> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_KEY ?? '';

  if (!apiKey || apiKey === 'cole_sua_chave_aqui') {
    throw new Error('API key não configurada. Crie um arquivo .env com EXPO_PUBLIC_ANTHROPIC_KEY.');
  }

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
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
            { type: 'text', text: RECEIPT_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API retornou ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string = data.content?.[0]?.text?.trim() ?? '';
  return parseReceiptItems(text);
}

export function useReceiptScanner() {
  const [isLoading, setIsLoading] = useState(false);

  async function scanReceiptFromGallery(): Promise<ReceiptItem[] | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão negada', 'Permita o acesso à galeria nas configurações do app.');
      return [];
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      base64: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]?.base64) return [];

    return runExtraction(result.assets[0].base64);
  }

  async function scanReceiptFromCamera(): Promise<ReceiptItem[] | null> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão negada', 'Permita o acesso à câmera nas configurações do app.');
      return [];
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]?.base64) return [];

    return runExtraction(result.assets[0].base64);
  }

  async function runExtraction(base64: string): Promise<ReceiptItem[] | null> {
    setIsLoading(true);
    try {
      return await extractReceiptFromBase64(base64);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Erro ao analisar nota fiscal', msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { scanReceiptFromGallery, scanReceiptFromCamera, isLoading };
}
