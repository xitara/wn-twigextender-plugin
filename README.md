# Webpack 5 ES6+ Sass Boilerplate with optional WinterCMS flavour [![devDependency Status](https://david-dm.org/xitara/webpack-boilerplate/dev-status.svg)](https://david-dm.org/xitara/webpack-boilerplate/?type=dev) [![Known Vulnerabilities](https://snyk.io/test/github/xitara/webpack-boilerplate/badge.svg)](https://snyk.io//test/github/xitara/webpack-boilerplate)

## Description

A webpack 5 based boilerplate for WinterCMS or other web projects.
In WinterCMS clone the repo and copy all files into the plugin or theme you want.
Otherwise clone the repo to a folder of your choice and change
`STORAGE` in `bash/config.sh` if needed

## Dependencies

- `yarn`
- `bash` to run `zip`, `fly`, `deploy` and `ftp`, testet on debian/buster
- `lftp` to upload with ftp by `yarn ftp`, testet on debian/buster

## Optional
- `phpdoc` to generate docs with `yarn docs`. See [https://docs.phpdoc.org/3.0/](https://docs.phpdoc.org/3.0/) for details

## Quick start

- clone the repo via `git clone https://github.com/xitara/webpack-boilerplate.git`
- `cd webpack-es6-sass-boilerplate`
- run `yarn` to fetch all the dependencies
- change settings in `package.json` and `bash/config.sh` if possible
- run `yarn start` to start the [webpack-dev-server](https://github.com/webpack/webpack-dev-server) (`localhost:8080` will be opened automatically)
- start developing
- when you are done, run `yarn build` to get the production version of your app

## Commands

- `start` - start the dev server
- `watch` - start webpack --watch
- `dwatch` - start webpack --watch in development-mode
- `build` - create build in `build` folder
- `dbuild` - create development build in `build` folder
- `zip` - build project and pack relevant folder/files to a zip-file one level down
- `deploy` - build project and deploy to a folder name in package.json one level down with backup if folder exists
- `ftp` - uploads build project per FTP. Configs in ./bash/config.sh
- `docs` - generates docs with `phpdoc` if installed
- `analyze` - analyze your production bundle
- `lint-code` - run an ESLint check
- `lint-style` - run a Stylelint check
- `check-eslint-config` - check if ESLint config contains any rules that are unnecessary or conflict with Prettier
- `check-stylelint-config` - check if Stylelint config contains any rules that are unnecessary or conflict with Prettier
- `cleanup` - delete build-folder, node_modulesand other generated files/folders. files in src and static stay untouched

## Including

- [webpack 5](https://github.com/webpack/webpack)
- [tailwindcss](https://tailwindcss.com)
- [tailwindcss/ui](https://tailwindui.com/)
- [tailwindcss-plugins](https://github.com/lorisleiva/tailwindcss-plugins)
- [tailwindcss-typography](https://github.com/tailwindlabs/tailwindcss-typography)
- [alpinejs](https://github.com/alpinejs/alpine)
- [glightbox](https://github.com/biati-digital/glightbox)
- [tiny-slider](https://github.com/ganlanyuan/tiny-slider)
- [simplebar](https://github.com/Grsmto/simplebar)
- [mark.js](https://markjs.io/)
- babel
- brotli / gzip compression for assets
- eslint / stylelint
- husky pre push tests
- sass
- purgecss (for sass and tailwindcss)

## WinterCMS specific commands

- `wn-init-theme` - adds folders to create a complete [WinterCMS](https://wintercms.com) theme boilerplate
- `wn-kill-theme` - removes folders for WinterCMS theme including `theme.yaml` and `conifg` from static. Handle with care, it's not recoverable

## WinterCMS specific settings

- add the following lines to your `.htaccess` to access the compiled index.html inside your theme dev:
- it works with and without translation-prefix
```
##
## enable display index.html for development
##
RewriteRule ^themes/.*/index\.html - [L,NC]
RewriteRule ^.*/themes/(.*)/index\.html /themes/$1/index\.html [L,NC]
RewriteRule ^.*/themes/(.*)/(assets|resources)/(.*) /themes/$1/$2/$3 [L,NC]
```

## Update 0.8.1

- Update to webpack 5
- Update all dependencies
- Add a fetch method to utils.js

## Update 0.8.2

- Add cross-env
- Switch to tailwind JIT-compiler
- Update all dependencies
