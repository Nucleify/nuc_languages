<?php

namespace App\Services;

use App\Models\Translation;
use App\Resources\TranslationResource;
use App\Traits\Setters\RequestSetterTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

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

        return $updated;
    }

    /**
     * @return void
     */
    public function delete(int $id): void
    {
        $result = $this->model::findOrFail($id);
        $result->delete();

        $this->logger->log('system', $result->getKey(), $this->entity, 'deleted');
    }
}
