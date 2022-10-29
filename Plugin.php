<?php

namespace Xitara\TwigExtender;

use Backend;
use Backend\Models\UserRole;
use System\Classes\PluginBase;
use Xitara\TwigExtender\Classes\TwigFilter;

/**
 * TwigExtender Plugin Information File
 */
class Plugin extends PluginBase
{
    /**
     * Returns information about this plugin.
     */
    public function pluginDetails(): array
    {
        return [
            'name'        => 'xitara.twigextender::lang.plugin.name',
            'description' => 'xitara.twigextender::lang.plugin.description',
            'author'      => 'Xitara',
            'icon'        => 'icon-leaf'
        ];
    }

    public function registerMarkupTags()
    {
        return (new TwigFilter())->registerMarkupTags();
    }
}
