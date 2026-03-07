<?php

namespace App\Contracts;

interface TranslationContract
{
    public function getId(): int;

    public function getLocale(): string;

    public function getKey(): string;

    public function getValue(): string;

    public function getCreatedAt(): string;

    public function getUpdatedAt(): string;
}
