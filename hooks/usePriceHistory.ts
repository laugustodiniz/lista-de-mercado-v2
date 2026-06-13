import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PriceEstimate, PriceRecord, ReceiptItem } from '../constants/types';

const PRICE_HISTORY_KEY = '@historico_precos';

// Tokens normalizados: sem acento, minúsculos, sem plural simples e sem palavras curtas (de, do, com).
function tokenize(name: string): string[] {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9 ]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 2)
    .map(t => t.replace(/s$/, ''));
}

// "Banana" casa com "Banana Prata": os tokens do nome menor precisam estar todos no maior.
function namesMatch(a: string, b: string): boolean {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.length === 0 || tokensB.length === 0) return false;
  const [shorter, longer] = tokensA.length <= tokensB.length
    ? [tokensA, tokensB]
    : [tokensB, tokensA];
  return shorter.every(t => longer.includes(t));
}

export function usePriceHistory() {
  const [isLoading, setIsLoading] = useState(false);

  async function getAllHistory(): Promise<PriceRecord[]> {
    try {
      const json = await AsyncStorage.getItem(PRICE_HISTORY_KEY);
      if (!json) return [];
      return JSON.parse(json) as PriceRecord[];
    } catch {
      return [];
    }
  }

  async function saveReceipt(items: ReceiptItem[], store?: string): Promise<void> {
    setIsLoading(true);
    try {
      const existing = await getAllHistory();
      const now = Date.now();
      const dateStr = new Date().toISOString();

      const newRecords: PriceRecord[] = items.map((item, i) => ({
        id: (now + i).toString(),
        itemName: item.name.trim(),
        price: item.unitPrice,
        unit: item.unit,
        quantity: item.quantity,
        date: dateStr,
        store: store?.trim() || undefined,
      }));

      const updated = [...existing, ...newRecords];
      await AsyncStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(updated));
    } finally {
      setIsLoading(false);
    }
  }

  async function getPriceEstimate(itemName: string): Promise<PriceEstimate | null> {
    const history = await getAllHistory();
    const matches = history.filter(r => namesMatch(r.itemName, itemName));
    if (matches.length === 0) return null;

    matches.sort((a, b) => b.date.localeCompare(a.date));
    const latest = matches[0];
    return {
      price: latest.price,
      unit: latest.unit,
      date: latest.date,
      store: latest.store,
      count: matches.length,
    };
  }

  return { saveReceipt, getPriceEstimate, getAllHistory, isLoading };
}
