<?php

use Illuminate\Support\Str;

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_filter(array_map(
        static fn (string $origin) => trim($origin),
        explode(',', (string) env('FRONTEND_URLS', env('FRONTEND_URL', 'http://localhost:5173')))
    ), static fn (string $origin) => $origin !== '' && Str::startsWith($origin, ['http://', 'https://']))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Accept', 'Authorization', 'Content-Type', 'Origin', 'X-Requested-With'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
