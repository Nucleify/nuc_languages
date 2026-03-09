<?php

namespace Modules\nuc_languages;

use Illuminate\Support\ServiceProvider;

class nuc_languages extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/database/migrations');
        $this->loadRoutesFrom(__DIR__ . '/routes/api.php');
    }
}
