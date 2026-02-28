import { StatusBar } from 'expo-status-bar';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { ComponentProps, ReactNode, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useDashboardView } from './src/hooks/useDashboardView';
import { useInventoryDashboard } from './src/hooks/useInventoryDashboard';
import { DashboardView, GroupedStockItem, InventoryFormState, MasterRecord, ShoppingMemoItem } from './src/types';

const theme = {
  background: '#f4eee2',
  surface: '#fffaf2',
  surfaceStrong: '#f7efe1',
  card: '#fffdf8',
  ink: '#2d241f',
  muted: '#7d6b5f',
  line: '#dfd1be',
  accent: '#bb5a32',
  accentSoft: '#f6d9cb',
  success: '#46705b',
  warning: '#b27a19',
  danger: '#9d4034',
};

const pageTitle: Record<DashboardView, string> = {
  inventory: '在庫一覧',
  add: '在庫追加',
  shopping: '買い物メモ',
};

const parseFormDate = (value: string) => {
  if (!value) {
    return new Date();
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const formatFormDate = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatExpiryText = (group: GroupedStockItem) => {
  if (!group.nearestExpiresAt) {
    return '期限設定なし';
  }
  if (group.nearestExpirationDays !== null && group.nearestExpirationDays < 0) {
    return `最短期限は${Math.abs(group.nearestExpirationDays)}日超過`;
  }
  return `最短期限まであと${group.nearestExpirationDays ?? 0}日`;
};

const formatItemExpiryText = (daysUntilExpiration: number | null, isExpired: boolean, expiresAt: string) => {
  if (!expiresAt) {
    return '期限設定なし';
  }
  if (isExpired) {
    return `期限切れ ${Math.abs(daysUntilExpiration ?? 0)}日 / 在庫数には含めません`;
  }
  return `期限まであと${daysUntilExpiration ?? 0}日`;
};

const SummaryCard = ({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'warning' | 'success';
}) => (
  <View
    style={[
      styles.summaryCard,
      tone === 'warning' && styles.summaryCardWarning,
      tone === 'success' && styles.summaryCardSuccess,
    ]}
  >
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

const ScreenTabs = ({
  activeView,
  onChange,
}: {
  activeView: DashboardView;
  onChange: (view: DashboardView) => void;
}) => (
  <View style={styles.tabRow}>
    {(['inventory', 'add', 'shopping'] as DashboardView[]).map((view) => (
      <Pressable
        key={view}
        onPress={() => onChange(view)}
        style={({ pressed }) => [
          styles.tabButton,
          activeView === view && styles.tabButtonActive,
          pressed && styles.tabButtonPressed,
        ]}
      >
        <Text style={[styles.tabButtonText, activeView === view && styles.tabButtonTextActive]}>
          {pageTitle[view]}
        </Text>
      </Pressable>
    ))}
  </View>
);

const ChipSelector = ({
  items,
  selectedValue,
  onSelect,
}: {
  items: { label: string; value: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
}) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
    {items.map((item) => (
      <Pressable
        key={item.value}
        onPress={() => onSelect(item.value)}
        style={({ pressed }) => [
          styles.chip,
          selectedValue === item.value && styles.chipActive,
          pressed && styles.chipPressed,
        ]}
      >
        <Text style={[styles.chipText, selectedValue === item.value && styles.chipTextActive]}>
          {item.label}
        </Text>
      </Pressable>
    ))}
  </ScrollView>
);

const FormField = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <View style={styles.fieldBlock}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
  </View>
);

const FormInput = (props: ComponentProps<typeof TextInput>) => (
  <TextInput
    placeholderTextColor={theme.muted}
    style={styles.input}
    {...props}
  />
);

const InventoryScreen = ({
  categories,
  editingItemId,
  groupedItems,
  isLoading,
  search,
  selectedCategory,
  onDelete,
  onEdit,
  onSearchChange,
  onSelectedCategoryChange,
  onUpdateQuantity,
}: {
  categories: MasterRecord[];
  editingItemId: string | null;
  groupedItems: GroupedStockItem[];
  isLoading: boolean;
  search: string;
  selectedCategory: string;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onSearchChange: (value: string) => void;
  onSelectedCategoryChange: (value: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
}) => {
  const [expandedNames, setExpandedNames] = useState<string[]>([]);

  const toggleExpanded = (name: string) => {
    setExpandedNames((current) =>
      current.includes(name) ? current.filter((value) => value !== name) : [...current, name],
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>検索と絞り込み</Text>
        <FormInput
          value={search}
          onChangeText={onSearchChange}
          placeholder="品名・メモ・カテゴリ・保管場所で検索"
        />
        <ChipSelector
          items={[{ label: 'すべて', value: 'すべて' }, ...categories.map((category) => ({ label: category.name, value: category.id }))]}
          selectedValue={selectedCategory}
          onSelect={onSelectedCategoryChange}
        />
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>在庫一覧</Text>
        <Text style={styles.sectionMeta}>{groupedItems.length}件を表示中</Text>
      </View>

      {groupedItems.map((group) => {
        const expanded = expandedNames.includes(group.name);
        const showDetails = expanded || group.entryCount === 1;

        return (
          <View
            key={group.name}
            style={[
              styles.card,
              styles.inventoryCard,
              group.items.some((item) => item.id === editingItemId) && styles.inventoryCardEditing,
            ]}
          >
            <View style={styles.inventoryHeader}>
              <Text style={styles.inventoryTitle}>{group.name}</Text>
              <View style={styles.tagRow}>
                <Tag label={group.categoryName} />
                <Tag label={group.storageLocationName} />
                {group.lowStock && <Tag label="不足" tone="danger" />}
                {group.hasExpiredItems && <Tag label="期限切れあり" tone="danger" />}
                {group.expiringSoon && <Tag label="期限近い" tone="warning" />}
              </View>
            </View>

            <Text style={styles.inventoryQuantity}>
              {group.quantity}
              {group.unit}
              <Text style={styles.inventorySubtext}>
                {' '}登録 {group.registeredQuantity}{group.unit} / 合計下限 {group.threshold}{group.unit}
              </Text>
            </Text>
            <Text style={styles.metaText}>
              {group.entryCount}件の在庫
              {group.expiredCount > 0 ? ` / 期限切れ ${group.expiredCount}件` : ''}
              {` / ${formatExpiryText(group)}`}
            </Text>
            {group.note ? <Text style={styles.noteText}>{group.note}</Text> : null}

            {group.entryCount > 1 ? (
              <Pressable onPress={() => toggleExpanded(group.name)} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>
                  {expanded ? '期限別の明細を閉じる' : '期限別の明細を見る'}
                </Text>
              </Pressable>
            ) : null}

            {showDetails ? (
              <View style={styles.detailList}>
                {group.items.map((item) => (
                  <View key={item.id} style={styles.detailCard}>
                    <Text style={styles.detailQuantity}>
                      {item.effectiveQuantity}{item.unit}
                      <Text style={styles.inventorySubtext}>
                        {' '}登録 {item.quantity}{item.unit} / 下限 {item.threshold}{item.unit}
                      </Text>
                    </Text>
                    <Text style={styles.metaText}>
                      {formatItemExpiryText(item.daysUntilExpiration, item.isExpired, item.expiresAt)}
                    </Text>
                    {item.note ? <Text style={styles.noteText}>{item.note}</Text> : null}
                    <View style={styles.actionRow}>
                      <ActionButton
                        label={editingItemId === item.id ? '編集中' : '編集'}
                        onPress={() => onEdit(item.id)}
                      />
                      <ActionButton label="-1" onPress={() => onUpdateQuantity(item.id, -1)} />
                      <ActionButton label="+1" onPress={() => onUpdateQuantity(item.id, 1)} />
                      <ActionButton
                        label="削除"
                        tone="danger"
                        onPress={() =>
                          Alert.alert('在庫を削除', `「${item.name}」を削除します。`, [
                            { text: 'キャンセル', style: 'cancel' },
                            { text: '削除', style: 'destructive', onPress: () => onDelete(item.id) },
                          ])
                        }
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}

      {!isLoading && groupedItems.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.metaText}>表示できる在庫がまだありません。追加画面から登録してください。</Text>
        </View>
      ) : null}
    </View>
  );
};

const InventoryFormScreen = ({
  categories,
  form,
  formMode,
  isLoading,
  storageLocations,
  onCancelEdit,
  onChange,
  onSubmit,
}: {
  categories: MasterRecord[];
  form: InventoryFormState;
  formMode: 'create' | 'edit';
  isLoading: boolean;
  storageLocations: MasterRecord[];
  onCancelEdit: () => void;
  onChange: (updater: (current: InventoryFormState) => InventoryFormState) => void;
  onSubmit: () => void;
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const hasExpiresAt = Boolean(form.expiresAt);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type !== 'set' || !selectedDate) {
      return;
    }

    onChange((current) => ({
      ...current,
      expiresAt: formatFormDate(selectedDate),
    }));
  };

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{formMode === 'edit' ? '在庫を編集' : '在庫を追加'}</Text>
        <Text style={styles.sectionMeta}>
          {formMode === 'edit' ? 'カテゴリ、保管場所、期限、メモなどを更新' : 'カテゴリと保管場所を選んで登録'}
        </Text>

        <FormField label="品名">
          <FormInput
            value={form.name}
            onChangeText={(value) => onChange((current) => ({ ...current, name: value }))}
            placeholder="例: トイレットペーパー"
          />
        </FormField>

        <FormField label="カテゴリ">
          <ChipSelector
            items={categories.map((category) => ({ label: category.name, value: category.id }))}
            selectedValue={form.categoryId}
            onSelect={(value) => onChange((current) => ({ ...current, categoryId: value }))}
          />
        </FormField>

        <FormField label="保管場所">
          <ChipSelector
            items={storageLocations.map((location) => ({ label: location.name, value: location.id }))}
            selectedValue={form.storageLocationId}
            onSelect={(value) => onChange((current) => ({ ...current, storageLocationId: value }))}
          />
        </FormField>

        <View style={styles.formRow}>
          <View style={styles.formColumn}>
            <FormField label="数量">
              <FormInput
                keyboardType="number-pad"
                value={String(form.quantity)}
                onChangeText={(value) =>
                  onChange((current) => ({ ...current, quantity: Number(value.replace(/[^0-9]/g, '')) || 0 }))
                }
              />
            </FormField>
          </View>
          <View style={styles.formColumn}>
            <FormField label="単位">
              <FormInput
                value={form.unit}
                onChangeText={(value) => onChange((current) => ({ ...current, unit: value }))}
              />
            </FormField>
          </View>
          <View style={styles.formColumn}>
            <FormField label="下限">
              <FormInput
                keyboardType="number-pad"
                value={String(form.threshold)}
                onChangeText={(value) =>
                  onChange((current) => ({ ...current, threshold: Number(value.replace(/[^0-9]/g, '')) || 0 }))
                }
              />
            </FormField>
          </View>
        </View>

        <FormField label="賞味・使用期限">
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={({ pressed }) => [
              styles.dateField,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <Text style={hasExpiresAt ? styles.dateFieldText : styles.dateFieldPlaceholder}>
              {hasExpiresAt ? form.expiresAt : '日付を選択'}
            </Text>
          </Pressable>

          <View style={styles.actionRow}>
            <ActionButton label="日付を選ぶ" onPress={() => setShowDatePicker(true)} />
            {hasExpiresAt ? (
              <ActionButton
                label="期限をクリア"
                onPress={() => onChange((current) => ({ ...current, expiresAt: '' }))}
                tone="danger"
              />
            ) : null}
          </View>
        </FormField>

        <FormField label="メモ">
          <TextInput
            multiline
            numberOfLines={4}
            placeholderTextColor={theme.muted}
            style={[styles.input, styles.textArea]}
            value={form.note}
            onChangeText={(value) => onChange((current) => ({ ...current, note: value }))}
            placeholder="特売日、銘柄、補充の目安など"
          />
        </FormField>

        <View style={styles.actionRow}>
          <ActionButton
            label={formMode === 'edit' ? '在庫を更新' : '在庫に追加'}
            onPress={onSubmit}
            tone="accent"
            disabled={isLoading || categories.length === 0 || storageLocations.length === 0}
          />
          {formMode === 'edit' ? <ActionButton label="編集をやめる" onPress={onCancelEdit} /> : null}
        </View>
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDatePicker(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>賞味・使用期限を選択</Text>
            <DateTimePicker
              value={parseFormDate(form.expiresAt)}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={handleDateChange}
            />
            {Platform.OS === 'ios' ? (
              <View style={styles.actionRow}>
                <ActionButton label="閉じる" onPress={() => setShowDatePicker(false)} tone="accent" />
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const ShoppingScreen = ({ items }: { items: ShoppingMemoItem[] }) => (
  <View style={styles.section}>
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>買い物メモ</Text>
      <Text style={styles.sectionMeta}>不足している品目を品名単位で表示します</Text>
    </View>
    {items.length === 0 ? (
      <View style={styles.card}>
        <Text style={styles.metaText}>今のところ補充が必要な在庫はありません。</Text>
      </View>
    ) : (
      items.map((item) => (
        <View key={item.name} style={styles.card}>
          <Text style={styles.inventoryTitle}>{item.name}</Text>
          <Text style={styles.metaText}>
            残り {item.quantity}{item.unit} / 合計目標 {item.threshold}{item.unit}
            {item.expiredQuantity > 0 ? ` / 期限切れ除外 ${item.expiredQuantity}${item.unit}` : ''}
          </Text>
        </View>
      ))
    )}
  </View>
);

const Tag = ({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: 'default' | 'warning' | 'danger';
}) => (
  <View
    style={[
      styles.tag,
      tone === 'warning' && styles.tagWarning,
      tone === 'danger' && styles.tagDanger,
    ]}
  >
    <Text
      style={[
        styles.tagText,
        tone === 'warning' && styles.tagTextWarning,
        tone === 'danger' && styles.tagTextDanger,
      ]}
    >
      {label}
    </Text>
  </View>
);

const ActionButton = ({
  label,
  onPress,
  tone = 'default',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  tone?: 'default' | 'accent' | 'danger';
  disabled?: boolean;
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.actionButton,
      tone === 'accent' && styles.actionButtonAccent,
      tone === 'danger' && styles.actionButtonDanger,
      disabled && styles.actionButtonDisabled,
      pressed && !disabled && styles.actionButtonPressed,
    ]}
  >
    <Text
      style={[
        styles.actionButtonText,
        tone === 'accent' && styles.actionButtonTextAccent,
        tone === 'danger' && styles.actionButtonTextDanger,
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

export default function App() {
  const { activeView, openAddView, openInventoryView, openShoppingView, setActiveView } = useDashboardView();
  const {
    cancelEditingItem,
    categories,
    deleteItem,
    editingItemId,
    form,
    formMode,
    groupedItems,
    isLoading,
    search,
    selectedCategory,
    setForm,
    setSearch,
    setSelectedCategory,
    shoppingList,
    startEditingItem,
    statusMessage,
    storageLocations,
    submitInventoryForm,
    summary,
    updateQuantity,
  } = useInventoryDashboard();

  const summaryCards = useMemo(
    () => [
      { label: '不足品目', value: `${summary.lowStock}件`, tone: 'warning' as const },
      { label: '期限近い', value: `${summary.expiringSoon}件`, tone: 'default' as const },
      { label: '実効在庫数', value: `${summary.totalQuantity}`, tone: 'success' as const },
    ],
    [summary],
  );

  const handleEditItem = (id: string) => {
    startEditingItem(id);
    openAddView();
  };

  const handleCancelEdit = () => {
    cancelEditingItem();
    openInventoryView();
  };

  const handleSubmit = async () => {
    const wasEditing = formMode === 'edit';
    const submitted = await submitInventoryForm();
    if (submitted && wasEditing) {
      openInventoryView();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.select({ ios: 'padding', default: undefined })}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>React Native mobile</Text>
            <Text style={styles.heroTitle}>うちの在庫ノート</Text>
            <Text style={styles.heroBody}>
              家の在庫をまとめて確認し、不足と期限切れをスマホから判断できます。
            </Text>
            <Text style={styles.currentTitle}>{pageTitle[activeView]}</Text>
            <ScreenTabs
              activeView={activeView}
              onChange={(view) => {
                setActiveView(view);
                if (view === 'inventory') openInventoryView();
                if (view === 'add') openAddView();
                if (view === 'shopping') openShoppingView();
              }}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryRow}>
            {summaryCards.map((card) => (
              <SummaryCard key={card.label} label={card.label} value={card.value} tone={card.tone} />
            ))}
          </ScrollView>

          <View style={styles.statusBanner}>
            <Text style={styles.statusBannerText}>{statusMessage}</Text>
          </View>

          {activeView === 'inventory' ? (
            <InventoryScreen
              categories={categories}
              editingItemId={editingItemId}
              groupedItems={groupedItems}
              isLoading={isLoading}
              search={search}
              selectedCategory={selectedCategory}
              onDelete={deleteItem}
              onEdit={handleEditItem}
              onSearchChange={setSearch}
              onSelectedCategoryChange={setSelectedCategory}
              onUpdateQuantity={updateQuantity}
            />
          ) : null}

          {activeView === 'add' ? (
            <InventoryFormScreen
              categories={categories}
              form={form}
              formMode={formMode}
              isLoading={isLoading}
              storageLocations={storageLocations}
              onCancelEdit={handleCancelEdit}
              onChange={setForm}
              onSubmit={handleSubmit}
            />
          ) : null}

          {activeView === 'shopping' ? <ShoppingScreen items={shoppingList} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 16,
  },
  heroCard: {
    backgroundColor: theme.surface,
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: theme.line,
  },
  heroEyebrow: {
    color: theme.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroTitle: {
    marginTop: 6,
    color: theme.ink,
    fontSize: 30,
    fontWeight: '800',
  },
  heroBody: {
    marginTop: 10,
    color: theme.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  currentTitle: {
    marginTop: 18,
    color: theme.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  tabButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.line,
  },
  tabButtonActive: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  tabButtonPressed: {
    opacity: 0.82,
  },
  tabButtonText: {
    color: theme.ink,
    fontWeight: '700',
  },
  tabButtonTextActive: {
    color: '#fffaf4',
  },
  summaryRow: {
    gap: 12,
  },
  summaryCard: {
    minWidth: 132,
    borderRadius: 20,
    padding: 16,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
  },
  summaryCardWarning: {
    backgroundColor: '#fff2da',
  },
  summaryCardSuccess: {
    backgroundColor: '#e9f2ec',
  },
  summaryLabel: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryValue: {
    marginTop: 8,
    color: theme.ink,
    fontSize: 24,
    fontWeight: '800',
  },
  statusBanner: {
    backgroundColor: theme.surfaceStrong,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.line,
  },
  statusBannerText: {
    color: theme.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    color: theme.ink,
    fontSize: 19,
    fontWeight: '800',
  },
  sectionMeta: {
    color: theme.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.line,
    gap: 12,
  },
  inventoryCard: {
    gap: 10,
  },
  inventoryCardEditing: {
    borderColor: theme.accent,
    shadowColor: theme.accent,
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  inventoryHeader: {
    gap: 10,
  },
  inventoryTitle: {
    color: theme.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.surfaceStrong,
  },
  tagWarning: {
    backgroundColor: '#fff0cd',
  },
  tagDanger: {
    backgroundColor: theme.accentSoft,
  },
  tagText: {
    color: theme.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  tagTextWarning: {
    color: theme.warning,
  },
  tagTextDanger: {
    color: theme.danger,
  },
  inventoryQuantity: {
    color: theme.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  inventorySubtext: {
    color: theme.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  metaText: {
    color: theme.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  noteText: {
    color: theme.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  inlineButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  inlineButtonText: {
    color: theme.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  detailList: {
    gap: 10,
  },
  detailCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
    gap: 8,
  },
  detailQuantity: {
    color: theme.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: theme.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.line,
  },
  actionButtonAccent: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  actionButtonDanger: {
    backgroundColor: theme.accentSoft,
    borderColor: '#e6b19c',
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  actionButtonPressed: {
    opacity: 0.82,
  },
  actionButtonText: {
    color: theme.ink,
    fontWeight: '700',
  },
  actionButtonTextAccent: {
    color: '#fffaf4',
  },
  actionButtonTextDanger: {
    color: theme.danger,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    color: theme.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: theme.surface,
    color: theme.ink,
    fontSize: 15,
  },
  dateField: {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: theme.surface,
  },
  dateFieldText: {
    color: theme.ink,
    fontSize: 15,
  },
  dateFieldPlaceholder: {
    color: theme.muted,
    fontSize: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(45, 36, 31, 0.32)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.line,
    gap: 12,
  },
  modalTitle: {
    color: theme.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  textArea: {
    minHeight: 108,
    textAlignVertical: 'top',
  },
  chipRow: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: theme.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.line,
  },
  chipActive: {
    backgroundColor: theme.ink,
    borderColor: theme.ink,
  },
  chipPressed: {
    opacity: 0.82,
  },
  chipText: {
    color: theme.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#fffaf4',
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formColumn: {
    flex: 1,
  },
});
