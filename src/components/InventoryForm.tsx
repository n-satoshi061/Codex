import { ChangeEvent, FormEvent } from 'react';
import { InventoryFormMode, InventoryFormState, MasterRecord } from '../types';
import {
  ButtonRow,
  FieldInput,
  FieldLabel,
  FieldSelect,
  FieldTextarea,
  FormGrid,
  Panel,
  PanelHeading,
  PrimaryButton,
  SecondaryButton,
  ThreeColumns,
  TwoColumns,
} from '../styles/appStyles';

type InventoryFormProps = {
  formMode: InventoryFormMode;
  categories: MasterRecord[];
  form: InventoryFormState;
  isLoading: boolean;
  storageLocations: MasterRecord[];
  onCancelEdit: () => void;
  onChange: (updater: (current: InventoryFormState) => InventoryFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export const InventoryForm = ({
  formMode,
  categories,
  form,
  isLoading,
  storageLocations,
  onCancelEdit,
  onChange,
  onSubmit,
}: InventoryFormProps) => {
  const handleTextChange = (field: keyof InventoryFormState) => (event: ChangeEvent<HTMLInputElement>) => {
    onChange((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleTextareaChange = (field: 'note') => (event: ChangeEvent<HTMLTextAreaElement>) => {
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
        <h2>{formMode === 'edit' ? '在庫を編集' : '在庫を追加'}</h2>
        <p>
          {formMode === 'edit'
            ? 'カテゴリ、保管場所、期限、メモなどを更新'
            : 'カテゴリと保管場所を選んで登録'}
        </p>
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
        <FieldLabel>
          賞味・使用期限
          <FieldInput type="date" value={form.expiresAt} onChange={handleTextChange('expiresAt')} />
        </FieldLabel>
        <FieldLabel>
          メモ
          <FieldTextarea value={form.note} onChange={handleTextareaChange('note')} placeholder="特売日、銘柄、補充の目安など" />
        </FieldLabel>
        <ButtonRow>
          <PrimaryButton type="submit" disabled={isLoading || categories.length === 0}>
            {formMode === 'edit' ? '在庫を更新' : '在庫に追加'}
          </PrimaryButton>
          {formMode === 'edit' && (
            <SecondaryButton type="button" onClick={onCancelEdit}>
              編集をやめる
            </SecondaryButton>
          )}
        </ButtonRow>
      </FormGrid>
    </Panel>
  );
};
