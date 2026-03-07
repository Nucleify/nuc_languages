<?php

namespace App\Services;

use App\Models\Translation;
use App\Resources\TranslationResource;
use App\Traits\Setters\RequestSetterTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class TranslationService
{
    use RequestSetterTrait;

    public function __construct(
        private readonly Translation $model,
        protected string $entity = 'translation',
        private readonly LoggerService $logger = new LoggerService
    ) {}

    public function index(Request $request): LengthAwarePaginator
    {
        $this->defineRequestData($request);

        $query = $this->model->newQuery();

        if ($request->has('locale')) {
            $query->where('locale', $request->input('locale'));
        }

        if ($request->has('category')) {
            $query->where('key', 'like', $request->input('category') . '-%');
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search): void {
                $q->where('key', 'like', "%{$search}%")
                    ->orWhere('value', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) $request->input('per_page', 100), 200);

        return $query->orderBy('key')->paginate($perPage);
    }

    /**
     * @return array<int, array{name: string, count: int}>
     */
    public function categories(string $locale): array
    {
        $rows = $this->model
            ->where('locale', $locale)
            ->selectRaw("SUBSTRING_INDEX(`key`, '-', 1) as prefix, COUNT(*) as total")
            ->groupBy('prefix')
            ->orderBy('prefix')
            ->get();

        return $rows->map(fn ($row): array => [
            'name' => $row->prefix,
            'count' => (int) $row->total,
        ])->toArray();
    }

    /**
     * @return array<string, string>
     */
    public function getByLocale(string $locale): array
    {
        return $this->model
            ->where('locale', $locale)
            ->pluck('value', 'key')
            ->toArray();
    }

    /**
     * @return TranslationResource
     */
    public function show(int $id): TranslationResource
    {
        $result = $this->model::findOrFail($id);

        return new TranslationResource($result);
    }

    /**
     * @return TranslationResource
     */
    public function create(array $data): TranslationResource
    {
        $result = $this->model::create($data);
        $this->syncTranslationFiles();

        $this->logger->log('system', $result->getKey(), $this->entity, 'created');

        return new TranslationResource($result);
    }

    /**
     * @return TranslationResource
     */
    public function update(int $id, array $data): TranslationResource
    {
        $result = $this->model::findOrFail($id);
        $result->update($data);
        $this->syncTranslationFiles();

        $this->logger->log('system', $result->getKey(), $this->entity, 'updated');

        return new TranslationResource($result->fresh());
    }

    /**
     * @return array<int, TranslationResource>
     */
    public function batchUpdate(array $items): array
    {
        $updated = [];

        foreach ($items as $item) {
            $record = $this->model::findOrFail($item['id']);
            $record->update(['value' => $item['value']]);
            $this->logger->log('system', $record->getKey(), $this->entity, 'updated');
            $updated[] = new TranslationResource($record->fresh());
        }

        $this->syncTranslationFiles();

        return $updated;
    }

    /**
     * @return void
     */
    public function delete(int $id): void
    {
        $result = $this->model::findOrFail($id);
        $result->delete();
        $this->syncTranslationFiles();

        $this->logger->log('system', $result->getKey(), $this->entity, 'deleted');
    }

    private function syncTranslationFiles(): void
    {
        $translations = $this->model
            ->newQuery()
            ->orderBy('locale')
            ->orderBy('key')
            ->get(['locale', 'key', 'value'])
            ->groupBy('locale');

        $phpDirectory = base_path('modules/nuc_languages/database/translations');
        $jsonDirectory = base_path('modules/nuc_languages/locales');
        File::ensureDirectoryExists($phpDirectory);
        File::ensureDirectoryExists($jsonDirectory);
        $activeLocales = [];

        foreach ($translations as $locale => $items) {
            $messages = $items->pluck('value', 'key')->all();

            ksort($messages);
            $activeLocales[] = (string) $locale;

            $this->writePhpTranslations($phpDirectory, (string) $locale, $messages);
            $this->writeJsonTranslations($jsonDirectory, (string) $locale, $messages);
        }

        $this->deleteStaleLocaleFiles($phpDirectory, 'php', $activeLocales);
        $this->deleteStaleLocaleFiles($jsonDirectory, 'json', $activeLocales);
    }

    /**
     * @param array<string, string> $messages
     */
    private function writePhpTranslations(string $directory, string $locale, array $messages): void
    {
        $lines = ['<?php', '', 'return ['];

        foreach ($messages as $key => $value) {
            $escapedKey = str_replace(['\\', '\''], ['\\\\', '\\\''], $key);
            $escapedValue = str_replace(['\\', '\''], ['\\\\', '\\\''], $value);

            $lines[] = "    '{$escapedKey}' => '{$escapedValue}',";
        }

        $lines[] = '];';
        $lines[] = '';

        File::put("{$directory}/{$locale}.php", implode(PHP_EOL, $lines));
    }

    /**
     * @param array<string, string> $messages
     */
    private function writeJsonTranslations(string $directory, string $locale, array $messages): void
    {
        $json = json_encode(
            $messages,
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );

        if ($json === false) {
            return;
        }

        File::put(
            "{$directory}/{$locale}.json",
            $this->jsonWithTwoSpaceIndent($json) . PHP_EOL
        );
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

    /**
     * @param array<int, string> $activeLocales
     */
    private function deleteStaleLocaleFiles(
        string $directory,
        string $extension,
        array $activeLocales
    ): void {
        $files = File::files($directory);

        foreach ($files as $file) {
            if ($file->getExtension() !== $extension) {
                continue;
            }

            $locale = $file->getBasename(".{$extension}");
            if (!in_array($locale, $activeLocales, true)) {
                File::delete($file->getPathname());
            }
        }
    }
}
