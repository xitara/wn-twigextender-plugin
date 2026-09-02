# Xitara TwigExtender

TwigExtender adds reusable Twig filters and functions to Winter CMS. The plugin
registers them through Winter's native `registerMarkupTags()` hook and has no
runtime dependency on `Xitara.Nexus`.

## Requirements

- PHP 8.2 or newer
- Winter CMS 1.2 or newer
- Composer 2

The CSS-variable and QR-code filters use `sabberworm/php-css-parser` and
`chillerlan/php-qrcode`. Both libraries are declared directly in
`composer.json`; they no longer need to be supplied by another Xitara plugin.

## Available Twig extensions

### Filters

| Filter                             | Purpose                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `backenduser`, `frontenduser`      | Resolve a backend or optional Winter.User account name from an ID.       |
| `backtrans`                        | Translate and escape a backend language key.                             |
| `css_var`                          | Replace `{theme}`, `{media}`, and `{plugin}` placeholders in CSS values. |
| `email_link`, `phone_link`, `link` | Build common HTML links.                                                 |
| `filesize`, `mediadata`            | Read file size or MIME metadata.                                         |
| `image_text`                       | Build `alt` and optional `title` attributes from image metadata.         |
| `inject`                           | Inject SVG content or render an image for a project-relative file.       |
| `localize`                         | Convert a date to an explicit UTC offset or the application time zone.   |
| `parentlink`                       | Remove the final segment from a slash-separated path.                    |
| `plugin`, `storage`                | Prefix a value with the configured plugin or storage path.               |
| `qrcode`                           | Render a string as SVG QR code.                                          |
| `regex_replace`                    | Apply a regular-expression replacement.                                  |
| `scrset`                           | Build a responsive image element from the theme's breakpoint CSS.        |
| `slug`                             | Generate a locale-aware slug with Winter/Laravel `Str::slug()`.          |
| `strip_html`                       | Remove HTML from a string.                                               |
| `truncate`                         | Limit plain text or HTML while preserving the selected mode.             |
| `truncate_html`                    | Deprecated alias for HTML truncation; use `truncate(..., 'html')`.       |
| `unique`                           | Deduplicate and sort an array.                                           |

### Functions

| Function   | Purpose                                                          |
| ---------- | ---------------------------------------------------------------- |
| `config()` | Read a Winter/Laravel configuration value.                       |
| `d()`      | Return buffered `var_dump()` output for development diagnostics. |
| `uid()`    | Generate a unique string identifier.                             |

`frontenduser` returns the original ID when `Winter.User` is not installed.
Slug generation uses `app.locale` when no language is supplied. Date
localization falls back to `app.timezone` when no explicit browser offset is
passed.

Filters that create HTML or read files assume trusted template input. Escape or
validate data from untrusted sources before passing it to `link`, `inject`,
`qrcode`, or the image helpers.

## Examples

```twig
{{ 'Über uns'|slug }}
{{ page.updated_at|localize }}
{{ this.theme.logo|media|inject }}
{{ contact.phone|phone_link({ classes: 'contact-link' })|raw }}
```

## Installation and development

Install the plugin as `plugins/xitara/twigextender`, then install its Composer
dependencies. The frontend boilerplate is not required for the PHP/Twig runtime.

```bash
composer install
```

The repository also contains the shared Xitara Webpack toolchain. Its common
development commands are:

```bash
yarn lint
yarn test-unit
yarn build
yarn test
```

Packaging, upload, deployment, and cleanup commands can write outside the
source tree or remove generated state. Review their configuration and targets
before running them.
