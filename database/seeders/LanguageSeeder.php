<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LanguageSeeder extends Seeder
{
    private const LOCALES = ['en', 'pl', 'vn'];

    public function run(): void
    {
        $now = now();

        foreach (self::LOCALES as $locale) {
            $messages = require __DIR__ . "/../translations/{$locale}.php";

            $rows = array_map(fn (string $key, string $value): array => [
                'locale' => $locale,
                'key' => $key,
                'value' => $value,
                'created_at' => $now,
                'updated_at' => $now,
            ], array_keys($messages), array_values($messages));

            foreach (array_chunk($rows, 500) as $chunk) {
                DB::table('translations')->upsert(
                    $chunk,
                    ['locale', 'key'],
                    ['value', 'updated_at']
                );
            }
        }
    }
}
