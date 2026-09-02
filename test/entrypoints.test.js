import assert from 'node:assert/strict';
import test from 'node:test';

import {
    createEntryFilename,
    isVersionedEntryAsset,
    resolveEntryPoints,
} from '../webpack/entrypoints.js';
import { config } from '../webpack.meta.js';

test('keeps regular string entries unchanged', () => {
    assert.deepEqual(resolveEntryPoints({ app: './js/app.js' }), {
        entries: { app: './js/app.js' },
        entryVersions: {},
    });
});

test('reads the package version for a versioned entry', () => {
    const result = resolveEntryPoints({
        app: {
            entry: './js/app.js',
            versionFile: '../../package.json',
            versioned: true,
        },
    });

    assert.equal(result.entryVersions.app, '1.1.0');
});

test('allows versioning to be disabled explicitly', () => {
    const result = resolveEntryPoints({
        app: {
            entry: './js/app.js',
            versionFile: 'missing.json',
            versioned: false,
        },
    });

    assert.deepEqual(result.entryVersions, {});
});

test('adds versions and development suffixes to generated filenames', () => {
    const filename = createEntryFilename({
        directory: 'js',
        extension: 'js',
        entryVersions: { app: '1.1.0' },
        suffix: '.debug',
    });

    assert.equal(filename({ chunk: { name: 'app' } }), 'js/app-1.1.0.debug.js');
});

test('keeps previous files belonging to versioned entries', () => {
    assert.equal(isVersionedEntryAsset('js/app-1.0.0.js', { app: '1.1.0' }), true);
    assert.equal(isVersionedEntryAsset('js/other-1.0.0.js', { app: '1.1.0' }), false);
});

test('does not declare unused browser entry points', () => {
    assert.deepEqual(config.entrypoints, {});
    assert.deepEqual(config.entrypointsDev, {});
});
