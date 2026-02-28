<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InventoryItemController extends Controller
{
    public function index(): JsonResponse
    {
        $items = InventoryItem::query()
            ->with(['category', 'storageLocation'])
            ->orderByRaw('quantity <= threshold desc')
            ->orderBy('expires_at')
            ->orderBy('name')
            ->get()
            ->map(fn (InventoryItem $item) => $this->presentItem($item));

        return response()->json([
            'data' => $items,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatedPayload($request);

        $item = InventoryItem::query()->create([
            'id' => (string) Str::uuid(),
            ...$validated,
        ]);

        return response()->json([
            'data' => $this->presentItem($item),
        ], 201);
    }

    public function update(Request $request, InventoryItem $inventoryItem): JsonResponse
    {
        $validated = $this->validatedPayload($request, partial: true);

        $inventoryItem->fill($validated);
        $inventoryItem->save();

        return response()->json([
            'data' => $this->presentItem($inventoryItem->fresh()),
        ]);
    }

    public function destroy(InventoryItem $inventoryItem): Response
    {
        $inventoryItem->delete();

        return response()->noContent();
    }

    private function validatedPayload(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';
        $validated = $request->validate([
            'name' => [$required, 'string', 'max:255'],
            'categoryId' => [$required, 'uuid', 'exists:categories,id'],
            'storageLocationId' => [$required, 'uuid', 'exists:storage_locations,id'],
            'quantity' => [$required, 'integer', 'min:0'],
            'threshold' => [$required, 'integer', 'min:0'],
            'unit' => [$required, 'string', 'max:30'],
            'expiresAt' => ['sometimes', 'nullable', 'date'],
            'note' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ]);

        if (array_key_exists('expiresAt', $validated)) {
            $validated['expires_at'] = $validated['expiresAt'];
            unset($validated['expiresAt']);
        }

        if (array_key_exists('categoryId', $validated)) {
            $validated['category_id'] = $validated['categoryId'];
            unset($validated['categoryId']);
        }

        if (array_key_exists('storageLocationId', $validated)) {
            $validated['storage_location_id'] = $validated['storageLocationId'];
            unset($validated['storageLocationId']);
        }

        return $validated;
    }

    private function presentItem(InventoryItem $item): array
    {
        return [
            'id' => $item->id,
            'name' => $item->name,
            'categoryId' => $item->category_id,
            'categoryName' => $item->category?->name ?? '',
            'storageLocationId' => $item->storage_location_id,
            'storageLocationName' => $item->storageLocation?->name ?? '',
            'quantity' => $item->quantity,
            'threshold' => $item->threshold,
            'unit' => $item->unit,
            'expiresAt' => optional($item->expires_at)->toDateString(),
            'updatedAt' => optional($item->updated_at)->toISOString(),
            'note' => $item->note ?? '',
        ];
    }
}
