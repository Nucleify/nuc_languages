<?php

namespace App\Models;

use App\Contracts\TranslationContract;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int id
 * @property string locale
 * @property string key
 * @property string value
 * @property string created_at
 * @property string updated_at
 */
class Translation extends Model implements TranslationContract
{
    protected $fillable = [
        'locale',
        'key',
        'value',
    ];

    public function getId(): int
    {
        return $this->id;
    }

    public function getLocale(): string
    {
        return $this->locale;
    }

    public function getKey(): string
    {
        return $this->key;
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function getCreatedAt(): string
    {
        return $this->created_at;
    }

    public function getUpdatedAt(): string
    {
        return $this->updated_at;
    }

    public function scopeGetById(Builder $query, int $parameter): Builder
    {
        return $query->where('id', $parameter);
    }

    public function scopeGetByLocale(Builder $query, string $parameter): Builder
    {
        return $query->where('locale', $parameter);
    }

    public function scopeGetByKey(Builder $query, string $parameter): Builder
    {
        return $query->where('key', $parameter);
    }
}
