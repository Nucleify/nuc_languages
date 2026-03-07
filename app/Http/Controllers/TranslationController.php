<?php

namespace App\Http\Controllers;

use App\Http\Requests\Translation\PostRequest;
use App\Http\Requests\Translation\PutRequest;
use App\Services\TranslationService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TranslationController extends Controller
{
    private TranslationService $service;

    public function __construct(TranslationService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $result = $this->service->index($request);

            return response()->json($result);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function categories(string $locale): JsonResponse
    {
        try {
            $result = $this->service->categories($locale);

            return response()->json($result);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getByLocale(string $locale): JsonResponse
    {
        try {
            $result = $this->service->getByLocale($locale);

            return response()->json($result);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $result = $this->service->show($id);

            return response()->json($result);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function store(PostRequest $request): JsonResponse
    {
        try {
            $input = $request->validated();
            $result = $this->service->create($input);

            return response()->json([
                $result,
                'message' => 'Successfully created translation: ' . $result['key'],
            ]);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(PutRequest $request, int $id): JsonResponse
    {
        try {
            $input = $request->validated();
            $result = $this->service->update($id, $input);

            return response()->json([
                $result,
                'message' => 'Successfully updated translation: ' . $result['key'],
            ]);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function batchUpdate(Request $request): JsonResponse
    {
        try {
            $items = $request->validate([
                'items' => 'required|array|min:1',
                'items.*.id' => 'required|integer|exists:translations,id',
                'items.*.value' => 'required|string',
            ]);

            $result = $this->service->batchUpdate($items['items']);

            return response()->json([
                'data' => $result,
                'message' => 'Successfully updated ' . count($result) . ' translations',
            ]);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->delete($id);

            return response()->json([
                'deleted' => true,
                'message' => 'Successfully deleted translation',
            ]);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
