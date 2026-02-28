<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\InventoryItem;
use App\Models\StorageLocation;
use Illuminate\Database\Seeder;

class InventoryItemSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            [
                'name' => 'お米',
                'category_slug' => 'foods',
                'storage_slug' => 'room-temperature',
                'quantity' => 3,
                'threshold' => 1,
                'unit' => '袋',
                'expires_at' => null,
                'note' => '5kgを目安に管理',
            ],
            [
                'name' => '水',
                'category_slug' => 'drinks',
                'storage_slug' => 'storage-shelf',
                'quantity' => 8,
                'threshold' => 4,
                'unit' => '本',
                'expires_at' => null,
                'note' => '防災備蓄を兼ねる',
            ],
            [
                'name' => '洗濯洗剤',
                'category_slug' => 'daily-goods',
                'storage_slug' => 'washroom',
                'quantity' => 2,
                'threshold' => 1,
                'unit' => '個',
                'expires_at' => null,
                'note' => null,
            ],
        ];

        foreach ($items as $item) {
            $category = Category::query()->where('slug', $item['category_slug'])->firstOrFail();
            $storageLocation = StorageLocation::query()->where('slug', $item['storage_slug'])->firstOrFail();

            InventoryItem::query()->updateOrCreate(
                ['name' => $item['name'], 'storage_location_id' => $storageLocation->id],
                [
                    'category_id' => $category->id,
                    'storage_location_id' => $storageLocation->id,
                    'name' => $item['name'],
                    'quantity' => $item['quantity'],
                    'threshold' => $item['threshold'],
                    'unit' => $item['unit'],
                    'expires_at' => $item['expires_at'],
                    'note' => $item['note'],
                ],
            );
        }
    }
}
