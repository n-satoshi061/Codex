<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => '食品', 'slug' => 'foods', 'sort_order' => 10],
            ['name' => '飲料', 'slug' => 'drinks', 'sort_order' => 20],
            ['name' => '調味料', 'slug' => 'seasonings', 'sort_order' => 30],
            ['name' => 'お菓子', 'slug' => 'snacks', 'sort_order' => 40],
            ['name' => '缶詰・乾物', 'slug' => 'canned-and-dry-foods', 'sort_order' => 50],
            ['name' => '日用品', 'slug' => 'daily-goods', 'sort_order' => 60],
            ['name' => 'キッチン用品', 'slug' => 'kitchen-supplies', 'sort_order' => 70],
            ['name' => '衛生用品', 'slug' => 'sanitary-goods', 'sort_order' => 80],
            ['name' => '掃除用品', 'slug' => 'cleaning-supplies', 'sort_order' => 90],
            ['name' => 'ベビー用品', 'slug' => 'baby-supplies', 'sort_order' => 100],
            ['name' => 'ペット用品', 'slug' => 'pet-supplies', 'sort_order' => 110],
            ['name' => '防災用品', 'slug' => 'emergency-supplies', 'sort_order' => 120],
            ['name' => 'その他', 'slug' => 'others', 'sort_order' => 130],
        ];

        foreach ($categories as $category) {
            Category::query()->updateOrCreate(
                ['slug' => $category['slug']],
                $category,
            );
        }
    }
}
