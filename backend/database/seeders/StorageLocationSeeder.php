<?php

namespace Database\Seeders;

use App\Models\StorageLocation;
use Illuminate\Database\Seeder;

class StorageLocationSeeder extends Seeder
{
    public function run(): void
    {
        $storageLocations = [
            ['name' => '冷蔵', 'slug' => 'refrigerated', 'sort_order' => 10],
            ['name' => '冷凍', 'slug' => 'frozen', 'sort_order' => 20],
            ['name' => '常温', 'slug' => 'room-temperature', 'sort_order' => 30],
            ['name' => '洗面所', 'slug' => 'washroom', 'sort_order' => 40],
            ['name' => '収納棚', 'slug' => 'storage-shelf', 'sort_order' => 50],
        ];

        foreach ($storageLocations as $storageLocation) {
            StorageLocation::query()->updateOrCreate(
                ['slug' => $storageLocation['slug']],
                $storageLocation,
            );
        }
    }
}
