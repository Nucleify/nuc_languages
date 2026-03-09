<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class LanguageSeeder extends Seeder
{
    public function run(): void
    {
        $translationPath = __DIR__ . '/../translations';

        if (!File::isDirectory($translationPath)) {
            return;
        }

        $translationFiles = File::files($translationPath);
        if (count($translationFiles) === 0) {
            DB::table('translations')->truncate();

            return;
        }

        $now = now();
        $rows = [];

        foreach ($translationFiles as $file) {
            $locale = $file->getBasename('.php');
            $messages = require $file->getPathname();

            if (!is_array($messages)) {
                continue;
            }

            foreach ($messages as $key => $value) {
                if (!is_string($key) || !is_string($value)) {
                    continue;
                }

                $rows[] = [
                    'locale' => $locale,
                    'key' => $key,
                    'value' => $value,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        DB::table('translations')->truncate();

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('translations')->insert($chunk);
        }
    }
}
