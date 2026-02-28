<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Support\InventoryDashboardBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class InventoryItemController extends Controller
{
    public function __construct(
        private readonly InventoryDashboardBuilder $dashboardBuilder,
    ) {
    }

    public function index(): JsonResponse
    {
        $items = InventoryItem::query()
            ->with(['category', 'storageLocation'])
            ->get();

        return response()->json([
            'data' => $this->dashboardBuilder->sortItems($items)
                ->map(fn (InventoryItem $item) => $this->dashboardBuilder->presentInventoryItem($item))
                ->values(),
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
            'data' => $this->dashboardBuilder->presentInventoryItem($item->load(['category', 'storageLocation'])),
        ], 201);
    }

    public function update(Request $request, InventoryItem $inventoryItem): JsonResponse
    {
        $validated = $this->validatedPayload($request, partial: true);

        $inventoryItem->fill($validated);
        $inventoryItem->save();

        return response()->json([
            'data' => $this->dashboardBuilder->presentInventoryItem($inventoryItem->fresh(['category', 'storageLocation'])),
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
            'name' => [$required, 'string', 'min:1', 'max:255'],
            'categoryId' => [$required, 'uuid', 'exists:categories,id'],
            'storageLocationId' => [$required, 'uuid', 'exists:storage_locations,id'],
            'quantity' => [$required, 'integer', 'min:0'],
            'threshold' => [$required, 'integer', 'min:0'],
            'unit' => [$required, 'string', 'min:1', 'max:30'],
            'expiresAt' => ['sometimes', 'nullable', 'date'],
            'note' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ]);

        foreach (['name', 'unit', 'note'] as $field) {
            if (array_key_exists($field, $validated) && is_string($validated[$field])) {
                $validated[$field] = trim($validated[$field]);
            }
        }

        foreach (['name', 'unit'] as $field) {
            if (array_key_exists($field, $validated) && $validated[$field] === '') {
                throw ValidationException::withMessages([
                    $field => '入力内容を確認してください。',
                ]);
            }
        }

        if (array_key_exists('note', $validated) && $validated['note'] === '') {
            $validated['note'] = null;
        }

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
}
