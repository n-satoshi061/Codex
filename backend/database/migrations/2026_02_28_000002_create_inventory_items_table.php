<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('category_id')->constrained('categories')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignUuid('storage_location_id')->constrained('storage_locations')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('name');
            $table->unsignedInteger('quantity')->default(0);
            $table->unsignedInteger('threshold')->default(0);
            $table->string('unit', 30)->default('個');
            $table->date('expires_at')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};
