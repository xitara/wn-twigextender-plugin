<?php

use Xitara\TwigExtender\Classes\TwigFilter;

$winterRoot = dirname(__DIR__, 4);

require $winterRoot . '/bootstrap/autoload.php';
$app = require $winterRoot . '/bootstrap/app.php';
$request = Illuminate\Http\Request::create('/', 'GET');
$app->instance('request', $request);
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

function assertTwigExtension($condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

try {
    $extension = new TwigFilter();
    $tags = $extension->registerMarkupTags();
    $expectedFilters = [
        'backenduser',
        'backtrans',
        'css_var',
        'email_link',
        'filesize',
        'frontenduser',
        'image_text',
        'inject',
        'link',
        'localize',
        'mediadata',
        'parentlink',
        'phone_link',
        'plugin',
        'qrcode',
        'regex_replace',
        'scrset',
        'slug',
        'storage',
        'strip_html',
        'truncate',
        'truncate_html',
        'unique',
    ];
    $expectedFunctions = ['config', 'd', 'uid'];
    $registeredFilters = array_keys($tags['filters'] ?? []);
    $registeredFunctions = array_keys($tags['functions'] ?? []);

    sort($expectedFilters);
    sort($expectedFunctions);
    sort($registeredFilters);
    sort($registeredFunctions);

    assertTwigExtension(
        $registeredFilters === $expectedFilters,
        'The registered Twig filters differ.',
    );
    assertTwigExtension(
        $registeredFunctions === $expectedFunctions,
        'The registered Twig functions differ.',
    );
    assertTwigExtension(
        class_exists(Sabberworm\CSS\Parser::class),
        'The direct CSS parser dependency is unavailable.',
    );
    assertTwigExtension(
        class_exists(chillerlan\QRCode\QRCode::class),
        'The direct QR-code dependency is unavailable.',
    );

    Config::set('app.locale', 'de');
    Config::set('app.timezone', 'UTC');

    assertTwigExtension(
        $extension->filterSlug('Über uns') === 'ueber-uns',
        'Slug fallback failed.',
    );
    assertTwigExtension(
        $extension->filterLocalize('2026-09-02 12:00:00') === '2026-09-02 12:00:00',
        'Application time-zone fallback failed.',
    );
    assertTwigExtension(
        $extension->filterParentLink('one/two/three') === 'one/two',
        'Parent-link filter failed.',
    );
    assertTwigExtension(
        str_starts_with($extension->filterQrCode('Xitara'), '<svg'),
        'QR-code filter did not return SVG markup.',
    );

    echo "TwigExtender runtime checks passed.\n";
} catch (Throwable $exception) {
    fwrite(STDERR, $exception->getMessage() . "\n");
    exit(1);
}
