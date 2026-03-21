import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PriceRecord, ReceiptItem } from '../constants/types';

const PRICE_HISTORY_KEY = '@historico_precos';

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

  async function getLastPrice(itemName: string): Promise<PriceRecord | null> {
    const history = await getAllHistory();
    const normalized = itemName.trim().toLowerCase();

    const matches = history.filter(
      r => r.itemName.trim().toLowerCase() === normalized
    );

    if (matches.length === 0) return null;

    matches.sort((a, b) => b.date.localeCompare(a.date));
    return matches[0];
  }

  return { saveReceipt, getLastPrice, getAllHistory, isLoading };
}
