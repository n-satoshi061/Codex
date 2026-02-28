<?php

namespace App\Support;

use App\Models\InventoryItem;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class InventoryDashboardBuilder
{
    public function build(Collection $allItems, Collection $filteredItems): array
    {
        return [
            'items' => $this->presentItems($filteredItems)->values()->all(),
            'groupedItems' => $this->buildGroupedItems($filteredItems)->values()->all(),
            'shoppingList' => $this->buildShoppingList($allItems)->values()->all(),
            'summary' => $this->buildSummary($allItems),
        ];
    }

    public function applyFilters(Collection $items, ?string $search, ?string $categoryId): Collection
    {
        $query = mb_strtolower(trim((string) $search));

        return $items
            ->filter(function (InventoryItem $item) use ($categoryId, $query): bool {
                if ($categoryId && $categoryId !== 'すべて' && $item->category_id !== $categoryId) {
                    return false;
                }

                if ($query === '') {
                    return true;
                }

                $haystack = mb_strtolower(implode(' ', [
                    $item->name,
                    $item->note ?? '',
                    $item->category?->name ?? '',
                    $item->storageLocation?->name ?? '',
                ]));

                return str_contains($haystack, $query);
            })
            ->values();
    }

    public function sortItems(Collection $items): Collection
    {
        return $items->sort(function (InventoryItem $left, InventoryItem $right): int {
            $leftLowStock = $this->effectiveQuantity($left) <= $left->threshold;
            $rightLowStock = $this->effectiveQuantity($right) <= $right->threshold;

            if ($leftLowStock !== $rightLowStock) {
                return $leftLowStock ? -1 : 1;
            }

            $leftDays = $this->daysUntil($left->expires_at?->toDateString());
            $rightDays = $this->daysUntil($right->expires_at?->toDateString());

            if ($leftDays === null) {
                return 1;
            }

            if ($rightDays === null) {
                return -1;
            }

            if ($leftDays !== $rightDays) {
                return $leftDays <=> $rightDays;
            }

            return strcmp($left->name, $right->name);
        })->values();
    }

    public function presentInventoryItem(InventoryItem $item): array
    {
        return $this->presentItem($item);
    }

    private function presentItems(Collection $items): Collection
    {
        return $this->sortItems($items)->map(fn (InventoryItem $item) => $this->presentItem($item));
    }

    private function buildSummary(Collection $items): array
    {
        return [
            'lowStock' => $items->filter(fn (InventoryItem $item) => $this->effectiveQuantity($item) <= $item->threshold)->count(),
            'expiringSoon' => $items->filter(function (InventoryItem $item): bool {
                $remaining = $this->daysUntil($item->expires_at?->toDateString());
                return $remaining !== null && $remaining >= 0 && $remaining <= 7;
            })->count(),
            'totalQuantity' => $items->sum(fn (InventoryItem $item) => $this->effectiveQuantity($item)),
        ];
    }

    private function buildShoppingList(Collection $items): Collection
    {
        return $items
            ->groupBy('name')
            ->map(function (Collection $group, string $name): array {
                /** @var InventoryItem $first */
                $first = $group->first();

                return [
                    'name' => $name,
                    'quantity' => $group->sum(fn (InventoryItem $item) => $this->effectiveQuantity($item)),
                    'expiredQuantity' => $group->sum(fn (InventoryItem $item) => $this->isExpired($item->expires_at?->toDateString()) ? $item->quantity : 0),
                    'threshold' => $group->sum('threshold'),
                    'unit' => $first->unit,
                ];
            })
            ->filter(fn (array $item): bool => $item['quantity'] <= $item['threshold'])
            ->sortBy('name')
            ->values();
    }

    private function buildGroupedItems(Collection $items): Collection
    {
        return $items
            ->groupBy('name')
            ->map(function (Collection $group, string $name): array {
                $sortedGroup = $group->sort(function (InventoryItem $left, InventoryItem $right): int {
                    $leftDays = $this->daysUntil($left->expires_at?->toDateString());
                    $rightDays = $this->daysUntil($right->expires_at?->toDateString());

                    if ($leftDays === null) {
                        return 1;
                    }

                    if ($rightDays === null) {
                        return -1;
                    }

                    return $leftDays <=> $rightDays;
                })->values();

                /** @var InventoryItem $first */
                $first = $sortedGroup->first();
                $nearestItem = $sortedGroup->first(function (InventoryItem $item): bool {
                    return $item->expires_at !== null;
                }) ?? $first;
                $nearestExpiresAt = $nearestItem->expires_at?->toDateString() ?? '';
                $nearestExpirationDays = $this->daysUntil($nearestExpiresAt);
                $quantity = $sortedGroup->sum(fn (InventoryItem $item) => $this->effectiveQuantity($item));
                $threshold = $sortedGroup->sum('threshold');

                return [
                    'id' => $name,
                    'name' => $name,
                    'categoryName' => $this->mergeLabel($sortedGroup, fn (InventoryItem $item) => $item->category?->name ?? '', '複数カテゴリ'),
                    'storageLocationName' => $this->mergeLabel($sortedGroup, fn (InventoryItem $item) => $item->storageLocation?->name ?? '', '複数の保管場所'),
                    'quantity' => $quantity,
                    'registeredQuantity' => $sortedGroup->sum('quantity'),
                    'threshold' => $threshold,
                    'unit' => $first->unit,
                    'note' => (string) ($sortedGroup->first(fn (InventoryItem $item) => filled($item->note))?->note ?? ''),
                    'entryCount' => $sortedGroup->count(),
                    'expiredCount' => $sortedGroup->filter(fn (InventoryItem $item) => $this->isExpired($item->expires_at?->toDateString()))->count(),
                    'expiredQuantity' => $sortedGroup->sum(fn (InventoryItem $item) => $this->isExpired($item->expires_at?->toDateString()) ? $item->quantity : 0),
                    'nearestExpiresAt' => $nearestExpiresAt,
                    'nearestExpirationDays' => $nearestExpirationDays,
                    'hasExpiredItems' => $sortedGroup->contains(fn (InventoryItem $item) => $this->isExpired($item->expires_at?->toDateString())),
                    'lowStock' => $quantity <= $threshold,
                    'expiringSoon' => $nearestExpirationDays !== null && $nearestExpirationDays >= 0 && $nearestExpirationDays <= 7,
                    'items' => $sortedGroup->map(fn (InventoryItem $item) => $this->presentItem($item))->values()->all(),
                ];
            })
            ->sort(function (array $left, array $right): int {
                if ($left['lowStock'] !== $right['lowStock']) {
                    return $left['lowStock'] ? -1 : 1;
                }

                if ($left['nearestExpirationDays'] === null) {
                    return 1;
                }

                if ($right['nearestExpirationDays'] === null) {
                    return -1;
                }

                if ($left['nearestExpirationDays'] !== $right['nearestExpirationDays']) {
                    return $left['nearestExpirationDays'] <=> $right['nearestExpirationDays'];
                }

                return strcmp($left['name'], $right['name']);
            })
            ->values();
    }

    private function presentItem(InventoryItem $item): array
    {
        $expiresAt = $item->expires_at?->toDateString();
        $daysUntilExpiration = $this->daysUntil($expiresAt);
        $isExpired = $this->isExpired($expiresAt);

        return [
            'id' => $item->id,
            'name' => $item->name,
            'categoryId' => $item->category_id,
            'categoryName' => $item->category?->name ?? '',
            'storageLocationId' => $item->storage_location_id,
            'storageLocationName' => $item->storageLocation?->name ?? '',
            'quantity' => $item->quantity,
            'effectiveQuantity' => $isExpired ? 0 : $item->quantity,
            'threshold' => $item->threshold,
            'unit' => $item->unit,
            'expiresAt' => $expiresAt ?? '',
            'daysUntilExpiration' => $daysUntilExpiration,
            'isExpired' => $isExpired,
            'isExpiringSoon' => $daysUntilExpiration !== null && $daysUntilExpiration >= 0 && $daysUntilExpiration <= 7,
            'updatedAt' => optional($item->updated_at)->toISOString(),
            'note' => $item->note ?? '',
        ];
    }

    private function effectiveQuantity(InventoryItem $item): int
    {
        return $this->isExpired($item->expires_at?->toDateString()) ? 0 : $item->quantity;
    }

    private function isExpired(?string $dateString): bool
    {
        $remaining = $this->daysUntil($dateString);
        return $remaining !== null && $remaining < 0;
    }

    private function daysUntil(?string $dateString): ?int
    {
        if (! $dateString) {
            return null;
        }

        return CarbonImmutable::today()->diffInDays(CarbonImmutable::parse($dateString)->startOfDay(), false);
    }

    private function mergeLabel(Collection $items, callable $resolver, string $fallback): string
    {
        $labels = $items->map($resolver)->filter()->unique()->values();

        return $labels->count() === 1 ? (string) $labels->first() : $fallback;
    }
}
