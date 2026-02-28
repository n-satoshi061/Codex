import { FormEvent } from 'react';
import { InventoryFormMode, InventoryFormState, MasterRecord } from '../types';
import { FormPageLayout } from '../styles/appStyles';
import { InventoryForm } from './InventoryForm';

type InventoryFormPageProps = {
  formMode: InventoryFormMode;
  categories: MasterRecord[];
  form: InventoryFormState;
  isLoading: boolean;
  storageLocations: MasterRecord[];
  onCancelEdit: () => void;
  onChange: (updater: (current: InventoryFormState) => InventoryFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export const InventoryFormPage = ({
  formMode,
  categories,
  form,
  isLoading,
  storageLocations,
  onCancelEdit,
  onChange,
  onSubmit,
}: InventoryFormPageProps) => (
  <FormPageLayout>
    <InventoryForm
      categories={categories}
      formMode={formMode}
      form={form}
      isLoading={isLoading}
      storageLocations={storageLocations}
      onCancelEdit={onCancelEdit}
      onChange={onChange}
      onSubmit={onSubmit}
    />
  </FormPageLayout>
);
