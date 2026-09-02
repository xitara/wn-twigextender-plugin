/**
 * Zentrale Webpack-Konfiguration.
 *
 * Webpack ruft die exportierte Funktion für jeden Build einmal auf. Hier werden
 * die allgemeinen Einstellungen aus webpack.common.js mit den Einstellungen
 * für den gewählten Modus (development oder production) zusammengeführt.
 * Projektbezogene Werte und Entry-Points werden in webpack.meta.js gepflegt.
 */

import { merge } from 'webpack-merge';

import { config } from './webpack.meta.js';
import { commonConfig } from './webpack/webpack.common.js';
import { development } from './webpack/webpack.development.js';
import { resolveEntryPoints } from './webpack/entrypoints.js';
import { production } from './webpack/webpack.production.js';

/**
 * Zuordnung des CLI-Parameters --mode zur passenden Teilkonfiguration.
 * Dadurch kann unten gezielt geprüft werden, ob ein unterstützter Modus gewählt wurde.
 */
const environmentConfigs = { development, production };

/**
 * Erstellt die endgültige Webpack-Konfiguration.
 *
 * @param {Record<string, unknown>} env Werte aus --env, zum Beispiel --env analyze=true
 * @param {{ mode?: string }} argv Allgemeine Argumente der Webpack-CLI
 * @returns {object} Zusammengeführte Webpack-Konfiguration
 */
export default (env = {}, argv = {}) => {
    const mode = argv.mode;

    /**
     * Ohne einen bekannten Modus wäre nicht eindeutig, welche Optimierungen,
     * Source Maps und zusätzlichen Entry-Points verwendet werden sollen.
     */
    if (!environmentConfigs[mode]) {
        throw new Error('Pass either --mode development or --mode production.');
    }

    /**
     * Webpack ergänzt selbst interne WEBPACK_*-Variablen. Nur die ausdrücklich
     * vom Projekt übergebenen Werte werden an unsere Teilkonfigurationen gereicht.
     * Das ursprüngliche env-Objekt wird dabei nicht verändert.
     */
    const customEnv = Object.fromEntries(
        Object.entries(env).filter(([key]) => !key.startsWith('WEBPACK_'))
    );

    /**
     * Reguläre Entry-Points werden immer gebaut. entrypointsDev wird ausschließlich
     * im Development-Modus ergänzt, damit Debug-Code nicht im Produktionspaket landet.
     */
    const configuredEntryPoints = {
        ...config.entrypoints,
        ...(mode === 'development' ? config.entrypointsDev : {}),
    };

    /**
     * Eigene Entry-Objekte mit entry, versionFile und versioned werden hier in
     * native Webpack-Entries sowie eine Zuordnung der ermittelten Versionen aufgeteilt.
     */
    const { entries: entrypoints, entryVersions } = resolveEntryPoints(configuredEntryPoints, {
        sourceDir: config.sourceDir,
    });

    /**
     * Terser kann diese Funktionsaufrufe bei Bedarf aus dem Produktionsbuild entfernen.
     * Die Liste enthält eigene Funktionen sowie die in webpack.meta.js ausgewählten
     * console-Methoden. Aktiviert wird das Entfernen mit --env removeFunctions=true
     * beziehungsweise kurz mit --env rf=true.
     */
    const removeFunctions = [
        ...config.removeFunctions,
        ...config.removeConsoleMethods.map((method) => `console.${method}`),
    ];

    /**
     * Statt das importierte config-Objekt zu verändern, wird für diesen Build eine
     * neue Konfiguration erzeugt. Das ist insbesondere bei Watch-Builds wichtig.
     */
    const resolvedConfig = { ...config, entrypoints, entryVersions, removeFunctions };
    const build = { mode, env: customEnv };

    /**
     * commonConfig enthält Loader, Plugins, Pfade und alle gemeinsamen Regeln.
     * Die zweite Konfiguration ergänzt nur die Einstellungen des gewählten Modus.
     */
    return merge(
        commonConfig(resolvedConfig, build),
        environmentConfigs[mode](resolvedConfig, build)
    );
};
