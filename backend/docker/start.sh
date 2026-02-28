#!/bin/sh
set -eu

cd /app

if [ ! -f .env ]; then
  cp .env.example .env
fi

mkdir -p bootstrap/cache
mkdir -p storage/app/public
mkdir -p storage/framework/cache
mkdir -p storage/framework/sessions
mkdir -p storage/framework/testing
mkdir -p storage/framework/views
mkdir -p storage/logs

chmod -R ug+rw bootstrap/cache storage

sed -i 's|^APP_URL=.*|APP_URL=http://localhost:8000|' .env
sed -i 's|^DB_HOST=.*|DB_HOST=mysql|' .env
sed -i 's|^DB_PORT=.*|DB_PORT=3306|' .env
sed -i 's|^DB_DATABASE=.*|DB_DATABASE=home_stock_manager|' .env
sed -i 's|^DB_USERNAME=.*|DB_USERNAME=stock_user|' .env
sed -i 's|^DB_PASSWORD=.*|DB_PASSWORD=stock_password|' .env

composer install --no-interaction --prefer-dist

if ! grep -Eq '^APP_KEY=base64:' .env; then
  php artisan key:generate --force
fi

php -r '
$host = getenv("DB_HOST") ?: "mysql";
$port = getenv("DB_PORT") ?: "3306";
$db = getenv("DB_DATABASE") ?: "home_stock_manager";
$user = getenv("DB_USERNAME") ?: "stock_user";
$pass = getenv("DB_PASSWORD") ?: "stock_password";
for ($i = 0; $i < 30; $i++) {
    try {
        new PDO("mysql:host={$host};port={$port};dbname={$db}", $user, $pass);
        exit(0);
    } catch (Throwable $e) {
        fwrite(STDERR, "Waiting for MySQL...\n");
        sleep(2);
    }
}
fwrite(STDERR, "MySQL did not become ready in time.\n");
exit(1);
'

php artisan migrate --seed --force

exec php artisan serve --host=0.0.0.0 --port=8000
