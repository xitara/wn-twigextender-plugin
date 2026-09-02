/**
 * Projektbezogene Webpack-Einstellungen.
 *
 * In dieser Datei werden bewusst nur Werte gepflegt, die sich von Projekt zu
 * Projekt ändern können. Loader, Plugins und Optimierungen liegen in webpack/.
 */
export const config = {
    /**
     * Entry-Points für jeden Build.
     *
     * Die Pfade sind relativ zu sourceDir. Der jeweilige Schlüssel bestimmt den
     * Namen der erzeugten Datei, zum Beispiel app -> assets/js/app.js und
     * styles -> assets/css/styles.css. Reine Stylesheet-Entries erzeugen dank
     * webpack-remove-empty-scripts keine zusätzlichen leeren JavaScript-Dateien.
     *
     * Ein versionierter Entry kann weiterhin als Objekt angegeben werden:
     *
     * versionedApp: {
     *     entry: './ts/app.ts',
     *     versionFile: 'config.ts', // relativ zum Ordner der Entry-Datei
     *     versioned: true,
     * }
     *
     * Daraus wird beispielsweise assets/js/versionedApp-1.2.3.js. Für alte
     * Konfigurationen genügt weiterhin { entry, versionFile }; versioned: true
     * macht die gewünschte Versionierung lediglich ausdrücklich sichtbar.
     */
    entrypoints: {
        // app: './ts/app.ts',
        // styles: './scss/styles.scss',
        // tailwind: './css/tailwind.css',
        // breakpoints: './scss/breakpoints.scss',
    },

    /**
     * Zusätzliche Entry-Points nur für --mode development.
     * Hier können weitere Diagnose- oder Vorschau-Dateien ergänzt werden.
     */
    entrypointsDev: {
        // debug: './ts/debug.ts',
        // componentPreview: './ts/component-preview.ts',
    },

    /**
     * Optionaler globaler Bibliotheksname für JavaScript-Ausgaben.
     * Ein leerer Wert deaktiviert den globalen Library-Export.
     */
    library: '',

    /**
     * Funktionsnamen, die Terser beim Verkürzen niemals umbenennen darf.
     * Das ist relevant, wenn diese Funktionen von außen über ihren Namen aufgerufen werden.
     */
    reserveFunctions: ['app'],

    /**
     * Zusätzliche Funktionsaufrufe, die bei aktiviertem removeFunctions-Schalter
     * vollständig aus dem Produktionsbuild entfernt werden dürfen.
     */
    removeFunctions: [],

    /**
     * console-Methoden, die der removeFunctions-Liste automatisch hinzugefügt werden.
     * console.error bleibt absichtlich erhalten, damit echte Laufzeitfehler sichtbar sind.
     */
    removeConsoleMethods: [
        'assert',
        'clear',
        'count',
        'countReset',
        'debug',
        'dir',
        'dirxml',
        // 'error',
        'group',
        'groupCollapsed',
        'groupEnd',
        'info',
        'log',
        'profile',
        'profileEnd',
        'table',
        'time',
        'timeEnd',
        'timeLog',
        'timeStamp',
        'trace',
        'warn',
    ],

    /** Quellordner; zugleich Webpacks context für alle relativen Entry-Pfade. */
    sourceDir: 'src',

    /** Statische Dateien, die unverändert neben die Build-Ausgabe kopiert werden. */
    staticDir: 'static',

    /** Zielordner für erzeugte JavaScript-, CSS-, Bild- und Manifest-Dateien. */
    outputDir: 'assets',
};
