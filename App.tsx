import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SectionList,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category, CategorizedItem, Item, Unit, UNIT_OPTIONS } from './constants/types';
import { CATEGORY_ORDER, CATEGORY_CONFIG } from './constants/categories';
import { usePhotoScanner } from './hooks/usePhotoScanner';
import { useAudioScanner } from './hooks/useAudioScanner';
import { useCategorizer } from './hooks/useCategorizer';
import PhotoReviewModal from './components/PhotoReviewModal';
import CategoryPickerModal from './components/CategoryPickerModal';

const STORAGE_KEY = '@lista_mercado';

const COLORS = {
  background: '#FAF9F6',
  primary: '#4ECDC4',
  primaryDark: '#3DBDB5',
  secondary: '#FFB4A2',
  accent: '#B8B8FF',
  card: '#FFFFFF',
  text: '#2D3436',
  textLight: '#636E72',
  textMuted: '#B2BEC3',
  danger: '#FF6B6B',
  dangerLight: '#FFCCCC',
  border: '#F0EDED',
  inputBg: '#F4F2EF',
  gradientStart: '#4ECDC4',
  gradientEnd: '#44B09E',
};

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState('');
  const [reviewItems, setReviewItems] = useState<CategorizedItem[]>([]);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [editCategoryItem, setEditCategoryItem] = useState<Item | null>(null);
  const [editingQuantityId, setEditingQuantityId] = useState<string | null>(null);
  const [editQtyValue, setEditQtyValue] = useState('');
  const [editUnitValue, setEditUnitValue] = useState<Unit>('un');

  const { scanFromGallery, scanFromCamera, isLoading: photoLoading } = usePhotoScanner();
  const { startRecording, stopRecording, isRecording, isLoading: audioLoading, recordingDuration } = useAudioScanner();
  const { categorize, isLoading: categorizerLoading } = useCategorizer();

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const raw = JSON.parse(json) as Array<Partial<Item> & { id: string; name: string; bought: boolean }>;
        const migrated = raw.map(item => ({
          ...item,
          category: (item.category ?? 'Outros') as Category,
        }));
        setItems(migrated);
      }
    } catch {}
  }

  async function saveItems(newItems: Item[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch {}
  }

  async function addItem() {
    const name = input.trim();
    if (!name) return;
    Keyboard.dismiss();
    setInput('');
    const category = await categorize(name);
    const newItem = { id: Date.now().toString(), name, bought: false, category };
    setItems(prev => {
      const newItems = [...prev, newItem];
      saveItems(newItems);
      return newItems;
    });
  }

  function addMultipleItems(categorizedItems: CategorizedItem[]) {
    if (categorizedItems.length === 0) return;
    const now = Date.now();
    const newItems = [
      ...items,
      ...categorizedItems.map((ci, i) => ({
        id: (now + i).toString(),
        name: ci.name,
        bought: false,
        category: ci.category,
      })),
    ];
    setItems(newItems);
    saveItems(newItems);
  }

  function toggleItem(id: string) {
    const newItems = items.map(item =>
      item.id === id ? { ...item, bought: !item.bought } : item
    );
    setItems(newItems);
    saveItems(newItems);
  }

  function deleteItem(id: string) {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    saveItems(newItems);
  }

  function changeItemCategory(id: string, category: Category) {
    const newItems = items.map(item =>
      item.id === id ? { ...item, category } : item
    );
    setItems(newItems);
    saveItems(newItems);
    setEditCategoryItem(null);
  }

  function updateItemDetails(id: string, quantity: number | undefined, unit: Unit | undefined) {
    const newItems = items.map(item =>
      item.id === id ? { ...item, quantity, unit } : item
    );
    setItems(newItems);
    saveItems(newItems);
  }

  function startEditingQuantity(item: Item) {
    if (editingQuantityId && editingQuantityId !== item.id) {
      confirmQuantityEdit();
    }
    setEditingQuantityId(item.id);
    setEditQtyValue(item.quantity !== undefined ? item.quantity.toString() : '1');
    setEditUnitValue(item.unit ?? 'un');
  }

  function confirmQuantityEdit() {
    if (!editingQuantityId) return;
    const parsed = parseFloat(editQtyValue);
    if (editQtyValue === '' || isNaN(parsed) || parsed <= 0) {
      updateItemDetails(editingQuantityId, undefined, undefined);
    } else {
      updateItemDetails(editingQuantityId, parsed, editUnitValue);
    }
    setEditingQuantityId(null);
  }

  function removeQuantity(id: string) {
    updateItemDetails(id, undefined, undefined);
    setEditingQuantityId(null);
  }

  async function handleScanPhoto() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancelar', 'Galeria de fotos', 'Tirar foto'], cancelButtonIndex: 0 },
        async buttonIndex => {
          if (buttonIndex === 1) await runScan('gallery');
          if (buttonIndex === 2) await runScan('camera');
        }
      );
    } else {
      Alert.alert('Adicionar da foto', 'Escolha uma opção', [
        { text: 'Galeria de fotos', onPress: () => runScan('gallery') },
        { text: 'Tirar foto', onPress: () => runScan('camera') },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  }

  async function runScan(source: 'gallery' | 'camera') {
    const extracted = source === 'gallery'
      ? await scanFromGallery()
      : await scanFromCamera();
    if (extracted === null) return;
    if (extracted.length > 0) {
      setReviewItems(extracted);
      setReviewVisible(true);
    } else {
      Alert.alert('Nenhum item encontrado', 'Não foi possível identificar itens na imagem.');
    }
  }

  async function handleMicPress() {
    if (isRecording) {
      const extracted = await stopRecording();
      if (extracted === null) return;
      if (extracted.length > 0) {
        setReviewItems(extracted);
        setReviewVisible(true);
      } else {
        Alert.alert('Nenhum item encontrado', 'Não foi possível identificar itens no áudio.');
      }
    } else {
      await startRecording();
    }
  }

  function formatDuration(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function handleReviewConfirm(selected: CategorizedItem[]) {
    setReviewVisible(false);
    addMultipleItems(selected);
  }

  function formatListForSharing(listItems: Item[]): string {
    const lines: string[] = ['🛒 Lista de Mercado', ''];

    const grouped = new Map<Category, Item[]>();
    for (const item of listItems) {
      const cat = item.category ?? 'Outros';
      const group = grouped.get(cat);
      if (group) {
        group.push(item);
      } else {
        grouped.set(cat, [item]);
      }
    }

    for (const category of CATEGORY_ORDER) {
      const categoryItems = grouped.get(category);
      if (!categoryItems || categoryItems.length === 0) continue;

      const { emoji } = CATEGORY_CONFIG[category];
      lines.push(`${emoji} ${category}`);
      for (const item of categoryItems) {
        const check = item.bought ? '✅' : '⬚';
        const qtyStr = item.quantity != null && item.unit
          ? ` (${item.quantity}${item.unit})`
          : '';
        lines.push(`${check} ${item.name}${qtyStr}`);
      }
      lines.push('');
    }

    lines.push('Enviado pelo app Lista de Mercado');
    return lines.join('\n');
  }

  async function handleShareList() {
    if (items.length === 0) {
      Alert.alert('Lista vazia', 'Adicione itens antes de compartilhar.');
      return;
    }
    const message = formatListForSharing(items);
    await Share.share({ message });
  }

  const showLoading = photoLoading || audioLoading || categorizerLoading;
  const loadingMessage = audioLoading
    ? 'Processando áudio...'
    : categorizerLoading
    ? 'Categorizando item...'
    : 'Analisando imagem...';
  const pending = items.filter(i => !i.bought).length;

  const sections = CATEGORY_ORDER
    .map(category => ({
      title: category,
      data: items.filter(item => item.category === category),
    }))
    .filter(section => section.data.length > 0);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />

      {showLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        </View>
      )}

      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.title}>Lista de Mercado</Text>
            <Pressable onPress={handleShareList} hitSlop={8}>
              <Ionicons name="share-outline" size={24} color="#fff" />
            </Pressable>
          </View>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name="cart-outline" size={14} color="#fff" />
              <Text style={styles.badgeText}>
                {pending} {pending === 1 ? 'item' : 'itens'} pendente{pending !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="basket-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Lista vazia</Text>
          <Text style={styles.emptySubtitle}>Adicione itens usando o campo abaixo,{'\n'}uma foto ou gravação de áudio</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => {
            const config = CATEGORY_CONFIG[section.title as Category];
            return (
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconCircle, { backgroundColor: config.color + '20' }]}>
                  <Ionicons
                    name={config.icon as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={config.color}
                  />
                </View>
                <Text style={[styles.sectionTitle, { color: config.color }]}>
                  {section.title}
                </Text>
                <Text style={styles.sectionCount}>{section.data.length}</Text>
              </View>
            );
          }}
          renderItem={({ item }) => {
            const catConfig = CATEGORY_CONFIG[item.category];
            const isEditingQty = editingQuantityId === item.id;
            return (
              <View>
                <Pressable
                  style={({ pressed }) => [styles.itemRow, isEditingQty && styles.itemRowEditing, pressed && !isEditingQty && styles.itemRowPressed]}
                  onPress={() => { if (!isEditingQty) toggleItem(item.id); }}
                  onLongPress={() => { if (!isEditingQty) setEditCategoryItem(item); }}
                >
                  <Ionicons
                    name={item.bought ? 'checkmark-circle' : 'ellipse-outline'}
                    size={26}
                    color={item.bought ? COLORS.primary : COLORS.textMuted}
                    style={styles.checkboxIcon}
                  />
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemName, item.bought && styles.itemDone]}>
                      {item.name}
                    </Text>
                    <View style={styles.itemBadgeRow}>
                      <View style={[styles.itemCategoryBadge, { backgroundColor: catConfig.color + '15' }]}>
                        <Ionicons
                          name={catConfig.icon as keyof typeof Ionicons.glyphMap}
                          size={10}
                          color={catConfig.color}
                        />
                        <Text style={[styles.itemCategoryText, { color: catConfig.color }]}>
                          {item.category}
                        </Text>
                      </View>
                      {item.quantity != null && item.unit ? (
                        <Pressable
                          onPress={() => startEditingQuantity(item)}
                          style={styles.quantityBadge}
                          hitSlop={4}
                        >
                          <Ionicons name="scale-outline" size={10} color={COLORS.primaryDark} />
                          <Text style={styles.quantityBadgeText}>
                            {item.quantity}{item.unit}
                          </Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          onPress={() => startEditingQuantity(item)}
                          style={styles.addQuantityBtn}
                          hitSlop={4}
                        >
                          <Ionicons name="add-circle-outline" size={10} color={COLORS.textMuted} />
                          <Text style={styles.addQuantityText}>qtd</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                  <Pressable
                    onPress={() => deleteItem(item.id)}
                    style={styles.deleteBtn}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                  </Pressable>
                </Pressable>
                {isEditingQty && (
                  <View style={styles.quantityEditRow}>
                    <TextInput
                      style={styles.quantityInput}
                      value={editQtyValue}
                      onChangeText={setEditQtyValue}
                      keyboardType="decimal-pad"
                      placeholder="Qtd"
                      placeholderTextColor={COLORS.textMuted}
                      autoFocus
                      selectTextOnFocus
                    />
                    <View style={styles.unitSelector}>
                      {UNIT_OPTIONS.map(u => (
                        <Pressable
                          key={u}
                          style={[styles.unitBtn, editUnitValue === u && styles.unitBtnActive]}
                          onPress={() => setEditUnitValue(u)}
                        >
                          <Text style={[styles.unitBtnText, editUnitValue === u && styles.unitBtnTextActive]}>
                            {u}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <Pressable onPress={confirmQuantityEdit} style={styles.confirmQtyBtn} hitSlop={4}>
                      <Ionicons name="checkmark-circle" size={28} color={COLORS.primary} />
                    </Pressable>
                    {item.quantity != null && (
                      <Pressable onPress={() => removeQuantity(item.id)} style={styles.removeQtyBtn} hitSlop={4}>
                        <Ionicons name="close-circle" size={28} color={COLORS.danger} />
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {isRecording && (
        <View style={styles.recordingBanner}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>
            Gravando... {formatDuration(recordingDuration)} / 2:00
          </Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Adicionar item..."
          placeholderTextColor={COLORS.textMuted}
          onSubmitEditing={addItem}
          returnKeyType="done"
        />
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.addBtn, pressed && styles.actionBtnPressed]}
          onPress={addItem}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.cameraBtn, pressed && styles.actionBtnPressed]}
          onPress={handleScanPhoto}
        >
          <Ionicons name="camera-outline" size={22} color="#fff" />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            isRecording ? styles.micBtnRecording : styles.micBtn,
            pressed && styles.actionBtnPressed,
          ]}
          onPress={handleMicPress}
        >
          {isRecording ? (
            <Text style={styles.micTimerText}>{formatDuration(recordingDuration)}</Text>
          ) : (
            <Ionicons name="mic-outline" size={22} color="#fff" />
          )}
        </Pressable>
      </View>

      <PhotoReviewModal
        visible={reviewVisible}
        items={reviewItems}
        onConfirm={handleReviewConfirm}
        onCancel={() => setReviewVisible(false)}
      />

      <CategoryPickerModal
        visible={editCategoryItem !== null}
        current={editCategoryItem?.category ?? 'Outros'}
        onSelect={category => changeItemCategory(editCategoryItem!.id, category)}
        onCancel={() => setEditCategoryItem(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  loadingText: {
    color: COLORS.text,
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    gap: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: -0.5,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  badgeText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
  list: {
    padding: 16,
    paddingTop: 20,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textLight,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
    gap: 8,
  },
  sectionIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  sectionCount: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  itemRowPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  checkboxIcon: {
    marginRight: 14,
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '400',
  },
  itemDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  itemBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  itemCategoryText: {
    fontSize: 10,
    fontWeight: '500',
  },
  quantityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  quantityBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.primaryDark,
  },
  addQuantityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    gap: 2,
  },
  addQuantityText: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  itemRowEditing: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  quantityEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    gap: 8,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  quantityInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: COLORS.text,
    width: 56,
    textAlign: 'center',
  },
  unitSelector: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
  },
  unitBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.inputBg,
  },
  unitBtnActive: {
    backgroundColor: COLORS.primary,
  },
  unitBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textLight,
  },
  unitBtnTextActive: {
    color: '#fff',
  },
  confirmQtyBtn: {
    padding: 2,
  },
  removeQtyBtn: {
    padding: 2,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
  },
  inputRow: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  actionBtn: {
    borderRadius: 14,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.85,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
  },
  cameraBtn: {
    backgroundColor: '#5B9BD5',
  },
  micBtn: {
    backgroundColor: COLORS.accent,
  },
  micBtnRecording: {
    backgroundColor: COLORS.danger,
  },
  micTimerText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: 'bold',
  },
  recordingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dangerLight,
    paddingVertical: 10,
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  recordingText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '600',
  },
});
