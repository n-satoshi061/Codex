<?php

use App\Http\Controllers\Api\InventoryDashboardController;
use App\Http\Controllers\Api\InventoryItemController;
use App\Http\Controllers\Api\InventoryMetadataController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:60,1')->group(function (): void {
    Route::get('/inventory-metadata', InventoryMetadataController::class);
    Route::get('/inventory-dashboard', InventoryDashboardController::class);
    Route::get('/inventory-items', [InventoryItemController::class, 'index']);
    Route::post('/inventory-items', [InventoryItemController::class, 'store']);
    Route::patch('/inventory-items/{inventoryItem}', [InventoryItemController::class, 'update']);
    Route::delete('/inventory-items/{inventoryItem}', [InventoryItemController::class, 'destroy']);
});
