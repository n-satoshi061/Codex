<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Support\InventoryDashboardBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryDashboardController extends Controller
{
    public function __invoke(Request $request, InventoryDashboardBuilder $builder): JsonResponse
    {
        $allItems = InventoryItem::query()
            ->with(['category', 'storageLocation'])
            ->get();

        $filteredItems = $builder->sortItems(
            $builder->applyFilters(
                $allItems,
                $request->string('search')->toString(),
                $request->string('categoryId')->toString(),
            )
        );

        return response()->json([
            'data' => $builder->build($allItems, $filteredItems),
        ]);
    }
}
