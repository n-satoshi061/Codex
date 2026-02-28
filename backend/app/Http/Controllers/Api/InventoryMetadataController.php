<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\StorageLocation;
use Illuminate\Http\JsonResponse;

class InventoryMetadataController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'data' => [
                'categories' => Category::query()
                    ->orderBy('sort_order')
                    ->orderBy('name')
                    ->get(['id', 'name', 'slug']),
                'storageLocations' => StorageLocation::query()
                    ->orderBy('sort_order')
                    ->orderBy('name')
                    ->get(['id', 'name', 'slug']),
            ],
        ]);
    }
}
