import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ReceiptItem } from '../constants/types';
import { CATEGORY_CONFIG } from '../constants/categories';

const COLORS = {
  background: '#FAF9F6',
  primary: '#4ECDC4',
  primaryDark: '#3DBDB5',
  card: '#FFFFFF',
  text: '#2D3436',
  textLight: '#636E72',
  textMuted: '#B2BEC3',
  border: '#F0EDED',
  inputBg: '#F4F2EF',
};

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

type Props = {
  visible: boolean;
  items: ReceiptItem[];
  onConfirm: (selected: ReceiptItem[], store: string) => void;
  onCancel: () => void;
};

export default function ReceiptReviewModal({ visible, items, onConfirm, onCancel }: Props) {
  const [selected, setSelected] = useState<Set<number>>(() => new Set(items.map((_, i) => i)));
  const [store, setStore] = useState('');

  useEffect(() => {
    setSelected(new Set(items.map((_, i) => i)));
    setStore('');
  }, [items]);

  function toggle(index: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  function handleConfirm() {
    const chosen = items.filter((_, i) => selected.has(i));
    onConfirm(chosen, store);
  }

  const selectedCount = selected.size;
  const selectedTotal = items
    .filter((_, i) => selected.has(i))
    .reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>Itens da nota fiscal ({items.length})</Text>
          <Text style={styles.subtitle}>Desmarque os que não quer registrar</Text>

          <TextInput
            style={styles.storeInput}
            value={store}
            onChangeText={setStore}
            placeholder="Nome do supermercado (opcional)"
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="done"
          />

          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.empty}>Nenhum item identificado na nota.</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(_, i) => String(i)}
              style={styles.list}
              renderItem={({ item, index }) => {
                const catConfig = CATEGORY_CONFIG[item.category];
                const isSelected = selected.has(index);
                return (
                  <Pressable
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                    onPress={() => toggle(index)}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={isSelected ? COLORS.primary : COLORS.textMuted}
                      style={styles.checkboxIcon}
                    />
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, !isSelected && styles.itemDeselected]}>
                        {item.name}
                      </Text>
                      <View style={styles.itemDetails}>
                        <View style={[styles.categoryBadge, { backgroundColor: catConfig.color + '20' }]}>
                          <Ionicons
                            name={catConfig.icon as keyof typeof Ionicons.glyphMap}
                            size={10}
                            color={catConfig.color}
                          />
                          <Text style={[styles.categoryText, { color: catConfig.color }]}>
                            {item.category}
                          </Text>
                        </View>
                        <Text style={styles.qtyText}>
                          {item.quantity}{item.unit}
                        </Text>
                        <Text style={styles.priceText}>
                          {formatCurrency(item.unitPrice)}/{item.unit}
                        </Text>
                      </View>
                      <Text style={styles.totalText}>
                        Total: {formatCurrency(item.totalPrice)}
                      </Text>
                      <Text style={styles.originalName} numberOfLines={1}>
                        &quot;{item.originalName}&quot;
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          )}

          {selectedCount > 0 && (
            <View style={styles.totalBar}>
              <Ionicons name="receipt-outline" size={16} color={COLORS.primaryDark} />
              <Text style={styles.totalBarText}>
                Total: {formatCurrency(selectedTotal)}
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.confirmBtn,
                selectedCount === 0 && styles.confirmBtnDisabled,
                pressed && styles.btnPressed,
              ]}
              onPress={handleConfirm}
              disabled={selectedCount === 0}
            >
              <Ionicons name="save-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.confirmText}>
                Salvar {selectedCount > 0 ? `${selectedCount} ` : ''}
                {selectedCount === 1 ? 'item' : 'itens'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  storeInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    marginVertical: 32,
    gap: 8,
  },
  empty: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 15,
  },
  list: {
    maxHeight: 320,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowPressed: {
    opacity: 0.7,
  },
  checkboxIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  itemInfo: {
    flex: 1,
    gap: 3,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  itemDeselected: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    gap: 3,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
  },
  qtyText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  priceText: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '500',
  },
  totalText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
  originalName: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  totalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
    gap: 6,
  },
  totalBarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  btnPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.85,
  },
  cancelText: {
    color: COLORS.textLight,
    fontSize: 15,
    fontWeight: '500',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#B8E8E4',
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
