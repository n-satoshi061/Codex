<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Category extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'slug',
        'sort_order',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $category): void {
            if (! $category->id) {
                $category->id = (string) Str::uuid();
            }
        });
    }

    public function inventoryItems(): HasMany
    {
        return $this->hasMany(InventoryItem::class);
    }
}
