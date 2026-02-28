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
            ['name' => '日用品', 'slug' => 'daily-goods', 'sort_order' => 30],
            ['name' => '衛生用品', 'slug' => 'sanitary-goods', 'sort_order' => 40],
            ['name' => 'ペット用品', 'slug' => 'pet-supplies', 'sort_order' => 50],
            ['name' => 'その他', 'slug' => 'others', 'sort_order' => 60],
        ];

        foreach ($categories as $category) {
            Category::query()->updateOrCreate(
                ['slug' => $category['slug']],
                $category,
            );
        }
    }
}
