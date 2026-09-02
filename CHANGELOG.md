# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-09-02

### Changed

- Require PHP 8.2 or newer and Winter CMS 1.2 or newer.
- Align the Composer installer constraint with the version required by Winter CMS 1.2.
- Declare the CSS parser and QR-code libraries as direct runtime dependencies.
- Generate slugs with Winter/Laravel and use the application time zone without relying on `Xitara.Nexus`.
- Provide the complete Twig extension set independently so the obsolete Nexus copy can be removed.
- Replace the generic boilerplate README with TwigExtender runtime and usage documentation.
- Replace the obsolete mixed Bash/Node build helpers with the maintained Xitara Yarn toolchain, strict linting, formatting, PHP checks, and build-artifact validation.
- Treat TwigExtender as a PHP-only runtime plugin and avoid publishing empty frontend bundles.
- Update the canonical repository metadata after moving the project to the Xitara-SoftWerX GitHub organization.

### Fixed

- Import the Winter plugin manager and backend user model used by the registered filters.

[Unreleased]: https://github.com/Xitara-SoftWerX/wn-twigextender-plugin/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/Xitara-SoftWerX/wn-twigextender-plugin/releases/tag/v1.1.0
