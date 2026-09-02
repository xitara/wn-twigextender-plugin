import fs from 'node:fs';
import path from 'node:path';

/**
 * Liest eine Version aus JSON, TypeScript, JavaScript oder einer einfachen YAML-Datei.
 * Unterstützte Beispiele: "version": "1.2.3", version: '1.2.3' und version = `1.2.3`.
 */
export const readVersionFile = (filename) => {
    if (!fs.existsSync(filename)) {
        throw new Error(`Version file not found: ${filename}`);
    }

    const content = fs.readFileSync(filename, 'utf8');
    let version;

    if (path.extname(filename).toLowerCase() === '.json') {
        try {
            version = JSON.parse(content).version;
        } catch (error) {
            throw new Error(`Invalid JSON in version file ${filename}: ${error.message}`, {
                cause: error,
            });
        }
    } else {
        const quotedVersion = /(?:^|[,;{\s])["']?version["']?\s*[:=]\s*["'`]([^"'`]+)["'`]/m.exec(
            content
        );
        const unquotedVersion = /^\s*["']?version["']?\s*:\s*([^\s#,}]+)/m.exec(content);
        version = quotedVersion?.[1] ?? unquotedVersion?.[1];
    }

    if (typeof version !== 'string' || !version.trim()) {
        throw new Error(`No version value found in: ${filename}`);
    }

    const normalizedVersion = version.trim();

    if (!/^[0-9A-Za-z][0-9A-Za-z._+-]*$/.test(normalizedVersion)) {
        throw new Error(
            `Version "${normalizedVersion}" from ${filename} contains characters that are unsafe for a filename.`
        );
    }

    return normalizedVersion;
};

/**
 * Wandelt die projektspezifische Entry-Syntax in native Webpack-Entries um.
 *
 * String-Entry:
 *   app: './ts/app.ts'
 *
 * Versionierter Entry:
 *   app: {
 *       entry: './ts/app.ts',
 *       versionFile: 'config.ts',
 *       versioned: true,
 *   }
 *
 * versionFile wird wie früher relativ zum Ordner der Entry-Datei aufgelöst.
 * Aus Kompatibilitätsgründen aktiviert bereits versionFile die Versionierung,
 * wenn versioned nicht ausdrücklich auf false gesetzt wurde.
 */
export const resolveEntryPoints = (
    entrypoints,
    { projectRoot = process.cwd(), sourceDir = 'src' } = {}
) => {
    const entries = {};
    const entryVersions = {};

    for (const [name, definition] of Object.entries(entrypoints)) {
        if (typeof definition === 'string' || Array.isArray(definition)) {
            entries[name] = definition;
            continue;
        }

        if (!definition || typeof definition !== 'object' || !('entry' in definition)) {
            throw new Error(
                `Entrypoint "${name}" must be a path or an object containing an "entry" path.`
            );
        }

        const { entry, versionFile, versioned } = definition;

        if (typeof entry !== 'string') {
            throw new Error(`Entrypoint "${name}.entry" must be a string.`);
        }

        if (versioned !== undefined && typeof versioned !== 'boolean') {
            throw new Error(`Entrypoint "${name}.versioned" must be true or false.`);
        }

        const shouldAddVersion = versioned ?? Boolean(versionFile);

        if (shouldAddVersion && typeof versionFile !== 'string') {
            throw new Error(
                `Entrypoint "${name}" is versioned but does not define a "versionFile".`
            );
        }

        entries[name] = entry;

        if (shouldAddVersion) {
            const entryDirectory = path.dirname(entry);
            const versionPath = path.resolve(projectRoot, sourceDir, entryDirectory, versionFile);
            entryVersions[name] = readVersionFile(versionPath);
        }
    }

    return { entries, entryVersions };
};

/**
 * Erzeugt eine Dateinamen-Funktion für Webpack beziehungsweise MiniCssExtractPlugin.
 */
export const createEntryFilename = ({ directory, extension, entryVersions, suffix = '' }) => {
    return ({ chunk }) => {
        const name = chunk?.name ?? '[name]';
        const version = entryVersions[name];
        const versionSuffix = version ? `-${version}` : '';

        return `${directory}/${name}${versionSuffix}${suffix}.${extension}`;
    };
};

/**
 * Erkennt ältere Ausgaben eines weiterhin versionierten Entry-Points.
 * Diese Dateien bleiben bei output.clean erhalten, damit mehrere Versionen
 * parallel ausgeliefert werden können.
 */
export const isVersionedEntryAsset = (asset, entryVersions) => {
    return Object.keys(entryVersions).some(
        (name) => asset.startsWith(`js/${name}-`) || asset.startsWith(`css/${name}-`)
    );
};
