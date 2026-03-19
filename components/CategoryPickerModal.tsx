import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../constants/types';
import { CATEGORY_ORDER, CATEGORY_CONFIG } from '../constants/categories';

const COLORS = {
  card: '#FFFFFF',
  text: '#2D3436',
  textLight: '#636E72',
  textMuted: '#B2BEC3',
  border: '#F0EDED',
  primary: '#4ECDC4',
};

type Props = {
  visible: boolean;
  current: Category;
  onSelect: (category: Category) => void;
  onCancel: () => void;
};

export default function CategoryPickerModal({ visible, current, onSelect, onCancel }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>Alterar categoria</Text>
          <Text style={styles.subtitle}>Toque para selecionar o setor</Text>

          <FlatList
            data={CATEGORY_ORDER}
            keyExtractor={item => item}
            style={styles.list}
            renderItem={({ item: category }) => {
              const config = CATEGORY_CONFIG[category];
              const isSelected = category === current;
              return (
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() => onSelect(category)}
                >
                  <View style={[styles.iconCircle, { backgroundColor: config.color + '20' }]}>
                    <Ionicons
                      name={config.icon as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={config.color}
                    />
                  </View>
                  <Text style={[styles.categoryName, isSelected && styles.categoryNameSelected]}>
                    {category}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                  )}
                </Pressable>
              );
            }}
          />

          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
            onPress={onCancel}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
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
    maxHeight: '75%',
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
    marginBottom: 16,
  },
  list: {
    maxHeight: 400,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  rowPressed: {
    opacity: 0.7,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  categoryNameSelected: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginTop: 16,
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
});
