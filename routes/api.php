<?php

use App\Http\Controllers\TranslationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web'])->prefix('api')->group(function (): void {
    Route::get('/translations/locale/{locale}', [TranslationController::class, 'getByLocale'])
        ->name('translations.getByLocale');

    Route::get('/translations/categories/{locale}', [TranslationController::class, 'categories'])
        ->name('translations.categories');

    Route::middleware(['auth'])->group(function (): void {
        Route::prefix('translations')->controller(TranslationController::class)->group(function (): void {
            Route::get('/', 'index')
                ->name('translations.index');

            Route::get('/{id}', 'show')
                ->name('translations.show');

            Route::post('/', 'store')
                ->name('translations.store');

            Route::put('/batch', 'batchUpdate')
                ->name('translations.batchUpdate');

            Route::post('/batch', 'batchUpdate')
                ->name('translations.batchUpdate.post');

            Route::put('/{id}', 'update')
                ->name('translations.update');

            Route::delete('/{id}', 'destroy')
                ->name('translations.destroy');
        });
    });
});
