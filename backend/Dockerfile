FROM php:8.3-cli

RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip libzip-dev libonig-dev libxml2-dev \
    && docker-php-ext-install bcmath mbstring pdo_mysql zip dom xml \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY docker/start.sh /usr/local/bin/start-laravel

RUN chmod +x /usr/local/bin/start-laravel

EXPOSE 8000

CMD ["start-laravel"]
