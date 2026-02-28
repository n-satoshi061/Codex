import { ChangeEvent, FormEvent } from 'react';
import { InventoryFormState, MasterRecord } from '../types';
import {
  FieldInput,
  FieldLabel,
  FieldSelect,
  FormGrid,
  Panel,
  PanelHeading,
  PrimaryButton,
  ThreeColumns,
  TwoColumns,
} from '../styles/appStyles';

type InventoryFormProps = {
  categories: MasterRecord[];
  form: InventoryFormState;
  isLoading: boolean;
  storageLocations: MasterRecord[];
  onChange: (updater: (current: InventoryFormState) => InventoryFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export const InventoryForm = ({
  categories,
  form,
  isLoading,
  storageLocations,
  onChange,
  onSubmit,
}: InventoryFormProps) => {
  const handleTextChange = (field: keyof InventoryFormState) => (event: ChangeEvent<HTMLInputElement>) => {
    onChange((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleNumberChange = (field: 'quantity' | 'threshold') => (event: ChangeEvent<HTMLInputElement>) => {
    onChange((current) => ({ ...current, [field]: Number(event.target.value) }));
  };

  const handleSelectChange =
    (field: 'categoryId' | 'storageLocationId') => (event: ChangeEvent<HTMLSelectElement>) => {
      onChange((current) => ({ ...current, [field]: event.target.value }));
    };

  return (
    <Panel>
      <PanelHeading>
        <h2>在庫を追加</h2>
        <p>マスタ選択肢も MySQL から取得</p>
      </PanelHeading>
      <FormGrid onSubmit={onSubmit}>
        <FieldLabel>
          品名
          <FieldInput value={form.name} onChange={handleTextChange('name')} placeholder="例: トイレットペーパー" />
        </FieldLabel>
        <TwoColumns>
          <FieldLabel>
            カテゴリ
            <FieldSelect value={form.categoryId} onChange={handleSelectChange('categoryId')} disabled={categories.length === 0}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </FieldSelect>
          </FieldLabel>
          <FieldLabel>
            保管場所
            <FieldSelect
              value={form.storageLocationId}
              onChange={handleSelectChange('storageLocationId')}
              disabled={storageLocations.length === 0}
            >
              {storageLocations.map((storageLocation) => (
                <option key={storageLocation.id} value={storageLocation.id}>
                  {storageLocation.name}
                </option>
              ))}
            </FieldSelect>
          </FieldLabel>
        </TwoColumns>
        <ThreeColumns>
          <FieldLabel>
            数量
            <FieldInput type="number" min="0" value={form.quantity} onChange={handleNumberChange('quantity')} />
          </FieldLabel>
          <FieldLabel>
            単位
            <FieldInput value={form.unit} onChange={handleTextChange('unit')} />
          </FieldLabel>
          <FieldLabel>
            下限
            <FieldInput type="number" min="0" value={form.threshold} onChange={handleNumberChange('threshold')} />
          </FieldLabel>
        </ThreeColumns>
        <TwoColumns>
          <FieldLabel>
            賞味・使用期限
            <FieldInput type="date" value={form.expiresAt} onChange={handleTextChange('expiresAt')} />
          </FieldLabel>
          <FieldLabel>
            メモ
            <FieldInput value={form.note} onChange={handleTextChange('note')} placeholder="特売日や銘柄など" />
          </FieldLabel>
        </TwoColumns>
        <PrimaryButton type="submit" disabled={isLoading || categories.length === 0}>
          在庫に追加
        </PrimaryButton>
      </FormGrid>
    </Panel>
  );
};
