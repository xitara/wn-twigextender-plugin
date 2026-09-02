<?php

/*
 * Prettier uebernimmt die eigentliche Formatierung. PHP CS Fixer ergaenzt nur
 * Regeln, die ueber reine Darstellung hinausgehen, damit beide Werkzeuge sich
 * nicht bei jedem Durchlauf gegenseitig umformatieren.
 */

$finder = PhpCsFixer\Finder::create()
    ->in(__DIR__)
    ->exclude(['.docs', 'assets', 'dist', 'node_modules', 'static', 'vendor'])
    ->name('*.php')
    ->ignoreDotFiles(false)
    ->ignoreVCS(true);

return (new PhpCsFixer\Config())
    ->setRiskyAllowed(false)
    ->setRules([
        'array_syntax' => ['syntax' => 'short'],
        'no_unused_imports' => true,
        'ordered_imports' => ['sort_algorithm' => 'alpha'],
        'single_quote' => true,
    ])
    ->setFinder($finder)
    ->setCacheFile(__DIR__ . '/.php-cs-fixer.cache');
