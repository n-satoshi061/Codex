<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryItem;
use App\Models\StorageLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class InventoryItemControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_inventory_item_can_be_updated_from_edit_form(): void
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

        $item = InventoryItem::query()->create([
            'id' => (string) Str::uuid(),
            'category_id' => $foodCategory->id,
            'storage_location_id' => $roomStorage->id,
            'name' => 'お米',
            'quantity' => 1,
            'threshold' => 2,
            'unit' => '袋',
            'expires_at' => '2026-03-10',
            'note' => '5kg',
        ]);

        $response = $this->patchJson("/api/inventory-items/{$item->id}", [
            'name' => '詰め替え用ハンドソープ',
            'categoryId' => $dailyCategory->id,
            'storageLocationId' => $bathStorage->id,
            'quantity' => 4,
            'threshold' => 1,
            'unit' => '個',
            'expiresAt' => '2026-06-01',
            'note' => '特売で購入',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.name', '詰め替え用ハンドソープ')
            ->assertJsonPath('data.categoryId', $dailyCategory->id)
            ->assertJsonPath('data.categoryName', '日用品')
            ->assertJsonPath('data.storageLocationId', $bathStorage->id)
            ->assertJsonPath('data.storageLocationName', '洗面所')
            ->assertJsonPath('data.quantity', 4)
            ->assertJsonPath('data.threshold', 1)
            ->assertJsonPath('data.unit', '個')
            ->assertJsonPath('data.expiresAt', '2026-06-01')
            ->assertJsonPath('data.note', '特売で購入');

        $this->assertDatabaseHas('inventory_items', [
            'id' => $item->id,
            'category_id' => $dailyCategory->id,
            'storage_location_id' => $bathStorage->id,
            'name' => '詰め替え用ハンドソープ',
            'quantity' => 4,
            'threshold' => 1,
            'unit' => '個',
            'note' => '特売で購入',
        ]);
    }

    public function test_inventory_item_input_is_trimmed_and_empty_note_is_normalized(): void
    {
        $foodCategory = Category::query()->create([
            'id' => (string) Str::uuid(),
            'name' => '食品',
            'slug' => 'foods',
            'sort_order' => 1,
        ]);

        $roomStorage = StorageLocation::query()->create([
            'id' => (string) Str::uuid(),
            'name' => '常温',
            'slug' => 'room-temperature',
            'sort_order' => 1,
        ]);

        $response = $this->postJson('/api/inventory-items', [
            'name' => '  お米  ',
            'categoryId' => $foodCategory->id,
            'storageLocationId' => $roomStorage->id,
            'quantity' => 2,
            'threshold' => 1,
            'unit' => '  袋  ',
            'expiresAt' => null,
            'note' => '   ',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'お米')
            ->assertJsonPath('data.unit', '袋')
            ->assertJsonPath('data.note', '');

        $this->assertDatabaseHas('inventory_items', [
            'name' => 'お米',
            'unit' => '袋',
            'note' => null,
        ]);
    }
}
