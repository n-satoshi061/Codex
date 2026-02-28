import { InventoryFormState, MetadataResponse, StockItem } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

const fetchJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error('API request failed');
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
};

export const fetchInventoryItems = async (signal?: AbortSignal) => {
  const response = await fetchJson<{ data: StockItem[] }>(`${API_BASE_URL}/inventory-items`, { signal });
  return response.data;
};

export const fetchInventoryMetadata = async (signal?: AbortSignal) => {
  const response = await fetchJson<{ data: MetadataResponse }>(`${API_BASE_URL}/inventory-metadata`, { signal });
  return response.data;
};

export const createInventoryItem = async (payload: InventoryFormState) => {
  const response = await fetchJson<{ data: StockItem }>(`${API_BASE_URL}/inventory-items`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.data;
};

export const updateInventoryItem = async (id: string, payload: Partial<InventoryFormState>) => {
  const response = await fetchJson<{ data: StockItem }>(`${API_BASE_URL}/inventory-items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  return response.data;
};

export const deleteInventoryItem = async (id: string) => {
  await fetchJson(`${API_BASE_URL}/inventory-items/${id}`, {
    method: 'DELETE',
  });
};
