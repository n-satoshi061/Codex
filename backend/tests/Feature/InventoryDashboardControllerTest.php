<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryItem;
use App\Models\StorageLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class InventoryDashboardControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_endpoint_returns_grouped_inventory_and_shopping_list(): void
    {
        $foodCategory = Category::query()->create([
            'id' => (string) Str::uuid(),
            'name' => '食品',
            'slug' => 'foods',
            'sort_order' => 1,
        ]);

        $dailyCategory = Category::query()->create([
            'id' => (string) Str::uuid(),
            'name' => '日用品',
            'slug' => 'daily-goods',
            'sort_order' => 2,
        ]);

        $roomStorage = StorageLocation::query()->create([
            'id' => (string) Str::uuid(),
            'name' => '常温',
            'slug' => 'room-temperature',
            'sort_order' => 1,
        ]);

        $bathStorage = StorageLocation::query()->create([
            'id' => (string) Str::uuid(),
            'name' => '洗面所',
            'slug' => 'washroom',
            'sort_order' => 2,
        ]);

        InventoryItem::query()->create([
            'id' => (string) Str::uuid(),
            'category_id' => $foodCategory->id,
            'storage_location_id' => $roomStorage->id,
            'name' => 'りんご',
            'quantity' => 1,
            'threshold' => 2,
            'unit' => '個',
            'expires_at' => now()->subDay()->toDateString(),
            'note' => '期限切れ',
        ]);

        InventoryItem::query()->create([
            'id' => (string) Str::uuid(),
            'category_id' => $foodCategory->id,
            'storage_location_id' => $roomStorage->id,
            'name' => 'りんご',
            'quantity' => 1,
            'threshold' => 1,
            'unit' => '個',
            'expires_at' => now()->addDays(5)->toDateString(),
            'note' => 'まだ食べられる',
        ]);

        InventoryItem::query()->create([
            'id' => (string) Str::uuid(),
            'category_id' => $dailyCategory->id,
            'storage_location_id' => $bathStorage->id,
            'name' => 'ハンドソープ',
            'quantity' => 3,
            'threshold' => 1,
            'unit' => '本',
            'expires_at' => null,
            'note' => '',
        ]);

        $response = $this->getJson('/api/inventory-dashboard?search=りんご&categoryId='.$foodCategory->id);

        $response
            ->assertOk()
            ->assertJsonPath('data.items.0.name', 'りんご')
            ->assertJsonPath('data.items.0.isExpired', true)
            ->assertJsonPath('data.groupedItems.0.name', 'りんご')
            ->assertJsonPath('data.groupedItems.0.entryCount', 2)
            ->assertJsonPath('data.groupedItems.0.quantity', 1)
            ->assertJsonPath('data.groupedItems.0.expiredQuantity', 1)
            ->assertJsonPath('data.shoppingList.0.name', 'りんご')
            ->assertJsonPath('data.shoppingList.0.quantity', 1)
            ->assertJsonPath('data.shoppingList.0.threshold', 3)
            ->assertJsonPath('data.summary.lowStock', 2)
            ->assertJsonPath('data.summary.expiringSoon', 1)
            ->assertJsonPath('data.summary.totalQuantity', 4);
    }
}
