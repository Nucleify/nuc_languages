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
        $localesPath = __DIR__ . '/../../locales';

        if (!File::isDirectory($translationPath)) {
            return;
        }

        File::ensureDirectoryExists($localesPath);

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

            $json = json_encode(
                $messages,
                JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            );

            if ($json !== false) {
                File::put(
                    "{$localesPath}/{$locale}.json",
                    $this->jsonWithTwoSpaceIndent($json) . PHP_EOL
                );
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

    private function jsonWithTwoSpaceIndent(string $json): string
    {
        return preg_replace_callback('/^( +)/m', function (array $matches): string {
            $indentLength = strlen($matches[1]);
            if ($indentLength === 0) {
                return '';
            }

            return str_repeat(' ', (int) floor($indentLength / 2));
        }, $json) ?? $json;
    }
}
