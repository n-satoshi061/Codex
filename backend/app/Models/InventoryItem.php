<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class InventoryItem extends Model
{
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'category_id',
        'storage_location_id',
        'name',
        'quantity',
        'threshold',
        'unit',
        'expires_at',
        'note',
    ];

    protected $casts = [
        'expires_at' => 'date',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $item): void {
            if (! $item->id) {
                $item->id = (string) Str::uuid();
            }
        });
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function storageLocation(): BelongsTo
    {
        return $this->belongsTo(StorageLocation::class);
    }
}
