<?php

namespace Xitara\TwigExtender\Classes;

use Carbon\Carbon;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Cms\Classes\Theme;
use Config;
use File;
use Html;
use Storage;
use League\Flysystem\FileNotFoundException;
use Sabberworm\CSS\Parser as CssParser;
use System\Classes\ImageResizer;
use Winter\Storm\Parse\Bracket;
use Xitara\TwigExtender\Plugin as TwigExtender;
use Str;

/**
 * additional twig filters
 */
class TwigFilter
{
    public function registerMarkupTags()
    {
        return [
            'filters'   => [
                'backenduser'   => [$this, 'filterBackendUser'],
                'backtrans'     => [$this, 'filterTranslate'],
                'css_var'       => [$this, 'filterCssVars'],
                'email_link'    => [$this, 'filterEmailLink'],
                'filesize'      => [$this, 'filterFileSize'],
                'frontenduser'  => [$this, 'filterFrontendUser'],
                'image_text'    => [$this, 'filterAddImageText'],
                'inject'        => [$this, 'filterInject'],
                'localize'      => [$this, 'filterLocalize'],
                'mediadata'     => [$this, 'filterMediaData'],
                'parentlink'    => [$this, 'filterParentLink'],
                'phone_link'    => [$this, 'filterPhoneLink'],
                'plugin'        => [$this, 'filterPluginsPath'],
                'regex_replace' => [$this, 'filterRegexReplace'],
                'scrset'        => [$this, 'filterScrset'],
                'slug'          => [$this, 'filterSlug'],
                'storage'       => [$this, 'filterStoragePath'],
                'strip_html'    => [$this, 'filterStripHtml'],
                'truncate' => [$this, 'filterTruncate'],
                'truncate_html' => [$this, 'filterTruncateHtml'],
                'unique'        => [$this, 'filterUnique'],
                'qrcode'        => [$this, 'filterQrCode'],
            ],
            'functions' => [
                'config' => [$this, 'functionConfig'],
                'd'      => [$this, 'functionDump'],
                'uid'    => [$this, 'functionGenerateUid'],
            ],
        ];
    }

    /**
     * adds link to given phone - |phone_link
     *
     * options: {
     *     'classes': 'class1 class2 classN',
     *     'text_before': '<strong>sample</strong>',
     *     'text_after': '<strong>sample</strong>',
     *     'hide_number': true|false (hide number in text or not)
     * }
     *
     * @param  string $text    text from twig
     * @param  array $options options from twig
     * @return string          complete link in html
     */
    public function filterPhoneLink($text, $options = null): string
    {
        /**
         * process options
         */
        $textBefore = $options['text_before'] ?? '';
        $textAfter  = $options['text_after'] ?? '';
        $classes    = $options['classes'] ?? null;
        $hideNubmer = $options['hide_number'] ?? false;

        /**
         * generate link
         */
        $link = '<a';

        if ($classes !== null) {
            $link .= ' class="' . $classes . '"';
        }

        $link .= ' href="tel:';
        $link .= preg_replace('/\(0\)|[^0-9\+]|\s+/', '', $text) . '">';
        $link .= $textBefore;

        if ($hideNubmer === false) {
            $link .= $text;
        }

        $link .= $textAfter;
        $link .= '</a>';

        return $link;
    }

    /**
     * adds link to given email - |email_link
     *
     * options: {
     *     'subject': Subject in Mail-Programm
     *     'body': Body in Mail-Programm
     *     'classes': 'class1 class2 classN',
     *     'text_before': '<strong>sample</strong>',
     *     'text_after': '<strong>sample</strong>',
     *     'hide_mail': true|false (hide mail-address in text or not),
     *     'image': this.theme.icon_email|media
     * }
     *
     * @param  string $text    text from twig
     * @param  array $options options from twig
     * @return string          complete link in html
     */
    public function filterEmailLink($text, $options = null): string
    {
        /**
         * remove subject and body from mail if given
         */
        $parts = explode('?', $text);
        $mail  = $parts[0];
        $query = isset($parts[1]) ? '?' . $parts[1] : '';

        /**
         * process options
         */
        $textBefore = $options['text_before'] ?? '';
        $textAfter  = $options['text_after'] ?? '';
        $classes    = $options['classes'] ?? null;
        $hideMail   = $options['hide_mail'] ?? false;
        $image      = $options['image'] ?? null;

        /**
         * generate link
         */
        $link = '<a';

        if ($classes !== null) {
            $link .= ' class="' . $classes . '"';
        }

        /**
         * generate subject and/or body is given
         */
        if (trim($query) == '' && isset($options['subject'])) {
            $query = '?subject=' . rawurlencode($options['subject']);
            $query .= isset($options['body']) ? '&body=' . rawurlencode($options['body']) : '';
        }

        $link .= ' href="mailto:' . Html::email($mail) . $query . '">';
        $link .= $textBefore;

        if ($image !== null) {
            if (is_array($image)) {
                $link .= '<img src="' . $image['image'] . '" alt="' . $mail;
                $link .= '" width="' . $image['width'] . '" height="';
                $link .= $image['height'] . '">';
            } else {
                $link .= '<img src="' . $image . '" alt="' . $mail . '">';
            }
        }

        if ($hideMail === false) {
            $link .= $mail;
        }

        $link .= $textAfter;
        $link .= '</a>';

        return $link;
    }

    /**
     * mediadata filter - |mediadata
     *
     * file should be in storage/app/[path], where path-default is "media"
     * for the media-manager
     *
     * @param  string $file filename
     * @param  string $path  relativ path in storage/app
     * @return array|boolean        filedata or false if file not exists
     */
    public function filterMediaData($file = null): array
    {
        $empty = [
            'size'      => 0,
            'mime_type' => 'none/none',
            'type'      => 'none',
            'art'       => 'none',
        ];

        if ($file === null || $file == '') {
            return $empty;
        }

        if (substr($file, 0, 1) == '/') {
            $file = base_path(substr($file, 1));
        }

        if (!File::exists($file) || File::isDirectory($file)) {
            return $empty;
        }

        if (strpos(File::mimeType($file), '/')) {
            list($type, $art) = explode('/', File::mimeType($file));
        }

        if (($art ?? null) == 'svg+xml') {
            $art = 'svg';
        }

        $data = [
            'size'      => File::size($file),
            'mime_type' => File::mimeType($file),
            'type'      => $type ?? null,
            'art'       => $art ?? null,
        ];

        return $data;
    }

    /**
     * filesize filter - |filesize
     *
     * returns filesize of given file
     *
     * @param  string $filename filename
     * @param  string $path      path relative to storage/app, default "media"
     * @return int|boolean           filesize in bytes or false if file not exists
     */
    public function filterFileSize($filename, $path = 'media'): string
    {
        $size = Storage::size($path . $filename);
        return $size;
    }

    /**
     * filter regex replace - |regex_replace
     *
     * replace a regex pattern with replacement in a given string
     *
     * @param  string $subject     source string
     * @param  string $pattern     pattern to replace
     * @param  string $replacement replacement string
     * @return string              new string
     */
    public function filterRegexReplace($subject, $pattern, $replacement): string
    {
        return preg_replace($pattern, $replacement, $subject);
    }

    /**
     * slugfilter with auto language from config if not given |slug
     * @param  string $text      text to slug
     * @param  string $seperator seperator, space will be replaced, default "-"
     * @param  string $lang      language for slug, default app.locale
     * @return string            slugged text
     */
    public function filterSlug($text, $seperator = '-', $lang = null)
    {
        if ($lang === null) {
            $lang = \Config::get('app.locale');
        }

        if (class_exists("\Xitara\Nexus\Plugin")) {
            return \Xitara\Nexus\Plugin::slug($text, $seperator, $lang);
        }

        return Str::slug($text, $seperator);
    }

    /**
     * strip html from a string - |strip_html
     * @param  string $text string to replace html within
     * @return string       string without html
     */
    public function filterStripHtml($text)
    {
        return Html::strip($text);
    }

    /**
     * truncate text and check html tags - |truncate
     * @param  string $text   string to truncate
     * @param  integer $lenght string length after truncate. Default: 100
     * @param  string $hint   hint after truncated text, default '...'
     * @return string         truncated string with html
     */
    public function filterTruncate($text, $lenght = 100, $type = 'text', $hint = '...'): string
    {
        switch ($type) {
            case 'html':
                return Html::limit($text, $lenght, $hint);
                break;
            case 'text':
            default:
                return Str::limit($text, $lenght, $hint);
                break;
        }
    }

    /**
     * truncate text and check html tags - |truncate_html
     * @param  string $text   string to truncate
     * @param  integer $lenght string length after truncate. Default: 100
     * @param  string $hint   hint after truncated text, default '...'
     * @return string         truncated string with html
     * @deprecated
     */
    public function filterTruncateHtml($text, $lenght = 100, $hint = '...'): string
    {
        \Log::warning('Filter |truncate_html is deprecated. Use |truncate instead');
        return Html::limit($text, $lenght, $hint);
    }

    /**
     * inject filecontent directly inside html. useful for svg or so - |inject
     *
     * options: {
     *     'first': 'title|description', // outputs title or description as default. default: title
     *     'alt': true|false, // show alt-attribute, default: true
     *     'title': true|false, // show title-attribute, default: false
     *     'classes': 'class-1 class-2 class-n', // optional. classes for image-tag. will ignored in SVG
     *     'default': { // optional. will be used if image has no title and description
     *         title: 'Foo',
     *         description: 'Bar',
     *     }
     * }
     *
     * @todo fix system for theme and plugin
     * @param  string $path filename relative to project root
     * @param  string $base theme, media or plugin
     * @return string       content of file
     */
    public function filterInject($file, $base = null, $options = []): string
    {
        /**
         * fix for backward compatibility
         */
        if (is_array($base)) {
            $options = $base;
            $base    = null;
        }

        if (substr($file, 0, 1) == '/') {
            $file = substr($file, 1);
        }

        /**
         * only for backward compatibility
         * @depricated
         */
        switch ($base) {
            case 'theme':
                $theme = Theme::getActiveTheme();
                $file  = $theme->getDirName() . '/' . $file;
                $file  = \Config::get('cms.themesPath') . '/' . $file;
                break;
            case 'media':
                $file = base_path(\Config::get('cms.storage.media.path') . '/' . $file);
                break;
            case 'plugin':
                $file = \Config::get('cms.pluginsPath') . '/' . $file;
                break;
            default:
                $file = base_path($file);
                break;
        }

        if (strpos($file, '://')) {
            $file = str_replace(url(''), '', $file);
        }

        if (!File::exists($file)) {
            return '';
        }

        if (strpos(mime_content_type($file), 'svg') === false) {
            $alt = $title = null;

            /**
             * generate alt, display as default -> alt: false
             */
            if ($options['alt'] ?? true === true) {
                $alt = $this->checkImageText($file, $options, 'alt');
            }

            /**
             * generate title, display as option -> title: true
             */
            if ($options['title'] ?? false === true) {
                $title = $this->checkImageText($file, $options, 'title');
            }

            /**
             * add classes if given
             */
            $classes = '';
            if ($options['classes'] ?? false === true) {
                $classes = ' class="' . $options['classes'] . '"';
            }

            $file = str_replace(base_path(), '', $file);

            return '<img src="' . url($file) . '"' . $alt . $title . $classes . '>';
        }

        $fileContent = File::get($file);
        $fileContent = preg_replace('/<!--(.|\s)*?\-->/', '', $fileContent);
        $fileContent = preg_replace('/<\?xml(.|\s)*?\?>/', '', $fileContent);
        $fileContent = str_replace(["\r", "\n"], '', $fileContent);
        $fileContent = preg_replace('/\s+/', ' ', $fileContent);

        return $fileContent;
    }

    /**
     * get data from config files - config()
     * @param  string $text config route like Config::get() -> example: app.name
     * @return string       config-data or null
     */
    public function functionConfig($text)
    {
        return Config::get($text);
    }

    /**
     * wrapper to phps var_dump - d()
     * @param  mixed $data data to var_dump()
     * @return string       var_dumped string
     */
    public function functionDump($data)
    {
        ob_start();
        var_dump($data);
        $result = ob_get_clean();

        return $result;
    }

    /**
     * adds alt and optional title attributes - |image_text
     *
     * options: {
     *     'first': 'title|description', // outputs title or description as default. default: title
     *     'alt': true|false, // show alt-attribute, default: true
     *     'title': true|false, // show title-attribute, default: false
     *     'default': { // optional. will be used if image has no title and description
     *         title: 'Foo',
     *         description: 'Bar',
     *     }
     * }
     *
     * @param  object $image   image object from attached image
     * @param  array $options some optional options
     * @return string          prefixed text with $art
     */
    public function filterAddImageText($image, $options = null): string
    {
        if ($image === null) {
            return '';
        }

        $alt = $title = null;

        /**
         * generate alt, display as default -> alt: false
         */
        if ($options['alt'] ?? true === true) {
            $alt = $this->checkImageText($image, $options, 'alt');
        }

        /**
         * generate title, display as option -> title: true
         */
        if ($options['title'] ?? false === true) {
            $title = $this->checkImageText($image, $options, 'title');
        }

        return $alt . $title;
    }

    /**
     * adds alt or title text and return prefixed string
     *
     * @see self::filterAddImageText()
     * @param  object $image   image object from attached image
     * @param  array $options some optional options
     * @param  string $art     alt or title
     * @return string          prefixed text with $art
     */
    private function checkImageText($image, $options, $art)
    {
        $text = $options[$art] ?? '';

        if ($text == '') {
            $text = $options['default']['description'] ?? '';
        }

        if (isset($image->description) && $image->description != '') {
            $text = Html::strip($image->description);
        }

        if ($text == '') {
            $text = $options['default']['title'] ?? '';
        }

        if (isset($image->title)
            && $image->title !== null
            && $image->title != ''
            && ($text == '' || ($options['first'] ?? 'title') == 'title')
        ) {
            $text = Html::strip($image->title);
        }

        if ($text != '') {
            $text = ' ' . $art . '="' . $text . '"';
        }

        return $text;
    }

    /**
     * uid() - generates a unique id
     *
     * @autor   mburghammer
     * @date    2021-01-01T15:26:37+01:00
     * @version 0.0.1
     * @since   0.0.1
     * @return  string      unique id
     */
    public function functionGenerateUid(): string
    {
        $id = uniqid(rand(), true);
        $id = str_replace('.', '-', $id);
        return $id;
    }

    /**
     * creates a link to parent page (one level up) - |parentlink
     * @param  string $text filename relative to project root
     * @return string       content of file
     */
    public function filterParentLink($text): string
    {
        $parts = explode('/', $text);
        array_pop($parts);

        return join('/', $parts);
    }

    /**
     * |localize(this.param.utcOffset) - generates date and time with utcOffset
     * @param  array $data   datetime-string, utc-offset
     * @return string       patched timestamp
     */
    public function filterLocalize(...$data)
    {
        $utcOffset = $data[1] ?? null;

        if ($utcOffset !== null && $utcOffset !== false) {
            $utcOffset *= -1;
            $utcOffset /= 60;

            $timezone = Carbon::now($utcOffset)->tzName;
        } else {
            $timezone = TwigExtender::getTimezone();
        }

        \Log::debug($timezone);

        $time = Carbon::parse($data[0]);
        $time->setTimezone($timezone);

        return $time->toDateTimeString();
    }

    /**
     * |css_var - parse string to match pathes
     *
     * @autor   mburghammer
     * @date    2021-02-14T00:22:14+01:00
     * @version 0.0.1
     * @since   0.0.1
     * @todo <mid>check for active URL with Briddle.MultiSite</mid>
     *
     * @param  string $string string to parse
     * @param  array $vars optional vars
     * @return  string      sprite with full path
     */

    public function filterCssVars($string, ...$vars)
    {
        $theme    = Theme::getActiveTheme();
        $mediaUrl = str_replace(base_path() . '/', '', storage_path('app/media'));

        $string = Bracket::parse($string, [
            'theme'  => url($theme->getDirName()),
            'media'  => url($mediaUrl),
            'plugin' => url(Config::get('cms.pluginsPath')),
        ]);

        if (is_numeric($string)) {
            return $string;
        } elseif (starts_with($string, 'http') === false) {
            return '"' . $string . '"';
        } else {
            return 'url(' . $string . ')';
        }

        return $string;
    }

    /**
     * |storage - add relative storage-path to string like |media or |theme
     *
     * @autor   mburghammer
     * @date    2021-05-18T11:35:08+02:00
     * @version 0.0.1
     * @since   0.0.1
     *
     * @param  string $string string to add storage-path to
     * @return string         $string with relative storage-path
     */
    public function filterStoragePath($string)
    {
        $appPath     = str_replace(base_path() . '/', '', app_path());
        $storagePath = str_replace(base_path() . '/', '', storage_path());

        return $storagePath . '/' . $appPath . '/' . $string;
    }

    /**
     * |plugin - add relative plugins-path to string like |media or |theme
     *
     * @autor   mburghammer
     * @date    2021-05-18T11:35:08+02:00
     * @version 0.0.1
     * @since   0.0.1
     *
     * @param  string $string string to add storage-path to
     * @return string         $string with relative storage-path
     */
    public function filterPluginsPath($string)
    {
        $pluginsPath = str_replace(base_path() . '/', '', plugins_path());

        return $pluginsPath . '/' . $string;
    }

    /**
     * |backtrans - translate from backend locales
     *
     * @autor   mburghammer
     * @date    2022-06-15T12:33:30+02:00
     * @version 0.0.1
     * @since   0.0.1
     *
     * @param  string $string string to translate
     * @return string         $string translated string
     */
    public function filterTranslate($string)
    {
        return e(trans($string));
    }

    /**
     * |srcset - generates image with scrset
     * if exists, bootstrap grid breakpoints will used
     *
     * @autor   mburghammer
     * @date    2022-07-14T15:27:16+02:00
     * @version 0.0.1
     * @since   0.0.1
     *
     * example:
     * {{ this.theme.default_header_image|media|scrset({
     *     xs: '30rem',
     *     sm: '40rem',
     *     md: '50rem',
     *     lg: '60rem',
     *     xl: '70rem',
     *     xxl: '80rem'
     * }, {
     *     'alt': 'alt-text',
     *     'title': 'title-text'
     * }, 'png', 70) }}
     *
     * @param  string $image relative image path
     * @param  array $sizes list with sizes (key is similar to breakpoint)
     * @param  array $text alt/title. use this as keys
     * @param  string $ext extension to convert image
     * @param  string $quality quality after resizing
     * @param  array $options see https://wintercms.com/docs/services/image-resizing#usage for details
     * @return string         $image translated string
     */
    public function filterScrset($image, $sizes, $text = null, $ext = null, $quality = 90, $options = null)
    {
        $theme = Theme::getActiveTheme();

        /**
         * remove trailing slash if exist
         */
        if (substr($image, 0, 1) == '/') {
            $image = substr($image, 1);
        }

        /**
         * remove url from file
         */
        if (strpos($image, '://')) {
            $image = str_replace(url(''), '', $image);
        }

        /**
         * if not found image return emtpy string
         */
        if (!File::exists(base_path($image))) {
            \Log::error('image ' . $image . ' not found');
            return '';
        }

        if (!File::exists(themes_path($theme->getDirName() . '/assets/css/breakpoints.css'))) {
            \Log::error('breakpoints.css not found in ' . themes_path($theme->getDirName()));
            return '';
        }

        $cssFile = File::get(themes_path($theme->getDirName() . '/assets/css/breakpoints.css'));

        /**
         * parse breakpoint-css and generate bp list
         */
        $css = (new CssParser($cssFile))->parse();

        /**
         * init vars
         */
        $scrList   = [];
        $scrset    = [];
        $sizesList = [];

        foreach ($css->getContents() as $content) {
            $scrList[str_replace('.', '', $content->getSelectors()[0]->getSelector())] = [
                'value' => $content->getRules('width')[0]->getValue()->getSize(),
                'unit'  => $content->getRules('width')[0]->getValue()->getUnit(),
            ];
        }

        foreach ($scrList as $selector => $rule) {
            if ($rule['unit'] == 'rem' || $rule['unit'] == 'em') {
                // convert to pixel with default em (16px)
                $rule['value'] = $rule['value'] * 16;
            }

            $width = (int) $sizes[$selector];
            $unit  = str_replace($width, '', $sizes[$selector]);

            if ($unit == 'rem' || $unit == 'em') {
                // convert to pixel with default em (16px)
                $width *= 16;
            }

            /**
             * resize image
             */
            $resized = ImageResizer::filterGetUrl(url($image), $width, null, [
                'extension' => $ext,
                'quality'   => $quality,
                'filters'   => $options,
            ]);

            // min is 1
            if ($rule['value'] == 0) {
                $scrset[]   = url($resized) . ' 1w';
                $ruleBefore = 0;
                continue;
            }

            $scrset[]    = url($resized) . ' ' . $rule['value'] . 'w';
            $sizesList[] = '(min-width: ' . $ruleBefore . $rule['unit'] .
                ') and (max-width: ' . ($rule['value'] - 1) . $rule['unit'] . ') ' .
                $sizes[$selector];

            $ruleBefore = $rule['value'];
        }

        $alt = $title = null;

        /**
         * generate alt, display as default -> alt: false
         */
        if ($text['alt'] ?? '' != '') {
            $alt = $this->checkImageText($image, $text, 'alt');
        }

        /**
         * generate title, display as option -> title: true
         */
        if ($text['title'] ?? '' != '') {
            $title = $this->checkImageText($image, $text, 'title');
        }

        $img = '<img ';
        $img .= 'src="' . url($image) . '" ';
        $img .= $alt . $title . ' ';
        $img .= 'srcset="' . join(',', $scrset) . '" ';
        $img .= 'sizes="' . join(',', $sizesList) . '">';

        return $img;
    }

    /**
     * get frontend user name from id
     * @param  interger $userId backend user-id
     * @return string         first name and last name or id if winter:user is not installed/active
     */
    public function filterFrontendUser($userId)
    {
        if (PluginManager::instance()->exists('Winter\User') === true) {
            $user = \Winter\User\Models\User::find($userId);
            return $user->first_name . ' ' . $user->last_name;
        }

        return $userId;
    }

    /**
     * get backend user name from id
     * @param  interger $userId backend user-id
     * @return string         first name and last name
     */
    public function filterBackendUser($userId)
    {
        $user = BackendUser::find($userId);
        return $user->first_name . ' ' . $user->last_name;
    }

    /**
     * |unique - drop duplicate entries from array
     *
     * @autor   mburghammer
     * @date    2022-05-19T13:11:09+02:00
     * @version 0.0.1
     * @since   0.0.1
     *
     * @param  array $array array to parse
     * @return  array      array with unique entries
     */
    public function filterUnique($array)
    {
        $array = array_unique($array);
        $array = array_values($array);
        sort($array);

        return $array;
    }

    /**
     * |qrcode - generate qrcode from string
     *
     * @autor   mburghammer
     * @date    2022-07-22T07:58:18+02:00
     * @version 0.0.1
     * @since   0.0.1
     *
     * @param  string $string string to generate qrcode from
     * @return  string      svg with qrcode-image
     */
    public function filterQrCode(string $string): string
    {
        $options = new QROptions([
            'version'      => 5,
            'outputType'   => QRCode::OUTPUT_MARKUP_SVG,
            'eccLevel'     => QRCode::ECC_L,
            'imageBase64'  => false,
            'addQuietzone' => false,
        ]);

        $qrcode = new QRCode($options);

        return $qrcode->render($string);
        // return '<img class="qrcode" src="' . $qrcode->render($string) . '" alt="QR Code" />';
    }
}
