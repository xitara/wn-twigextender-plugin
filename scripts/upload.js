#!/usr/bin/env node

import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

import config from './config.cjs';

const { FILE, TARGET, VERSION, UPLOAD, UPLOAD_TYPE } = config;

const uploadTypes = ['files', 'archive', 'both'];

const protocolClients = {
    ftp: {
        alternatives: ['lftp', 'ftp', 'ncftp'],
        client: 'curl',
        defaultPort: 21,
    },
    ftps: {
        alternatives: ['lftp'],
        client: 'curl',
        defaultPort: 990,
    },
    scp: {
        alternatives: ['sftp', 'curl', 'rsync'],
        client: 'scp',
        defaultPort: 22,
    },
    sftp: {
        alternatives: ['scp', 'curl', 'lftp'],
        client: 'sftp',
        defaultPort: 22,
    },
};

const sshClient = {
    alternatives: ['plink'],
    client: 'ssh',
    defaultPort: 22,
};

function findExecutable(program) {
    const searchPaths = program.includes(path.sep)
        ? ['']
        : process.env.PATH?.split(path.delimiter) || [];

    for (const searchPath of searchPaths) {
        const executablePath = searchPath ? path.join(searchPath, program) : program;

        try {
            fs.accessSync(executablePath, fs.constants.X_OK);

            if (fs.statSync(executablePath).isFile()) {
                return executablePath;
            }
        } catch {
            // Continue searching the remaining PATH entries.
        }
    }

    return null;
}

function requireExecutable(program, purpose, alternatives = []) {
    const executablePath = findExecutable(program);

    if (executablePath) {
        return executablePath;
    }

    const availableAlternatives = alternatives.filter((alternative) => findExecutable(alternative));
    let message = `Fehler: Für ${purpose} fehlt das Programm "${program}".`;

    if (availableAlternatives.length > 0) {
        message += ` Auf diesem Host vorhanden: ${availableAlternatives.join(', ')}.`;
    } else {
        message += ' Auf diesem Host wurde keine passende Alternative gefunden.';
    }

    throw new Error(message);
}

function runExternal(program, args, options = {}) {
    const executablePath = requireExecutable(
        program,
        options.purpose || `den Aufruf von ${program}`,
        options.alternatives
    );
    const result = spawnSync(executablePath, args, {
        cwd: options.cwd,
        env: options.env || process.env,
        input: options.input,
        stdio: options.input === undefined ? 'inherit' : ['pipe', 'inherit', 'inherit'],
    });

    if (result.error) {
        throw new Error(`Fehler beim Start von "${program}": ${result.error.message}`);
    }

    if (result.status !== 0) {
        throw new Error(
            `Der UPLOAD mit "${program}" ist fehlgeschlagen (Exit-Code ${result.status}).`
        );
    }
}

function validateConfig() {
    if (!UPLOAD || typeof UPLOAD !== 'object') {
        throw new Error('Fehler: In config.cjs fehlt die Einstellung "UPLOAD".');
    }

    UPLOAD.protocol = String(UPLOAD.protocol || '').toLowerCase();

    if (!protocolClients[UPLOAD.protocol]) {
        throw new Error(
            `Fehler: Unbekanntes UPLOAD-Protokoll "${UPLOAD.protocol}". ` +
                'Erlaubt sind ftp, ftps, scp und sftp.'
        );
    }

    if (!uploadTypes.includes(UPLOAD_TYPE)) {
        throw new Error(
            `Fehler: Unbekannter UPLOAD-Typ "${UPLOAD_TYPE}". ` +
                'Erlaubt sind files, archive und both.'
        );
    }

    if (!UPLOAD.host) {
        throw new Error('Fehler: In config.cjs fehlt "UPLOAD.host".');
    }

    if (!UPLOAD.path || !String(UPLOAD.path).startsWith('/')) {
        throw new Error('Fehler: "UPLOAD.path" muss ein absoluter Pfad sein.');
    }

    if (UPLOAD.port !== '' && UPLOAD.port !== undefined && UPLOAD.port !== null) {
        const port = Number(UPLOAD.port);

        if (!Number.isInteger(port) || port < 1 || port > 65535) {
            throw new Error('Fehler: "UPLOAD.port" muss zwischen 1 und 65535 liegen.');
        }
    }

    if (UPLOAD.chown) {
        UPLOAD.chown = String(UPLOAD.chown).trim();

        if (
            !/^(?:[a-zA-Z0-9_][a-zA-Z0-9_.-]*)?(?::(?:[a-zA-Z0-9_][a-zA-Z0-9_.-]*)?)?$/.test(
                UPLOAD.chown
            ) ||
            UPLOAD.chown === ':'
        ) {
            throw new Error(
                'Fehler: "UPLOAD.chown" muss als user, user:group oder :group angegeben werden.'
            );
        }
    }

    if (UPLOAD.postRun) {
        UPLOAD.postRun = String(UPLOAD.postRun).trim();

        if (!path.posix.isAbsolute(UPLOAD.postRun) || /[\r\n\0]/.test(UPLOAD.postRun)) {
            throw new Error(
                'Fehler: "UPLOAD.postRun" muss ein absoluter Pfad ohne Zeilenumbrüche sein.'
            );
        }
    }

    if (UPLOAD.rename) {
        if (!(UPLOAD.rename instanceof RegExp)) {
            throw new Error('Fehler: "UPLOAD.rename" muss ein regulärer Ausdruck sein.');
        }

        UPLOAD.backupExisting = String(UPLOAD.backupExisting || '').trim();

        if (
            !path.posix.isAbsolute(UPLOAD.backupExisting) ||
            /[\r\n\0]/.test(UPLOAD.backupExisting)
        ) {
            throw new Error(
                'Fehler: Bei gesetztem "UPLOAD.rename" muss "UPLOAD.backupExisting" ' +
                    'ein absoluter Pfad sein.'
            );
        }
    }
}

function findLatestPackage() {
    const distPath = path.join(TARGET, 'dist');
    const prefix = `${FILE}_${VERSION}_`;

    if (!fs.existsSync(distPath)) {
        throw new Error(
            `Fehler: Der Paketordner "${distPath}" existiert nicht. Zuerst pack.js ausführen.`
        );
    }

    const packages = new Map();

    fs.readdirSync(distPath, { withFileTypes: true }).forEach((entry) => {
        const isArchive = entry.isFile() && entry.name.endsWith('.zip');
        const packageName = isArchive ? entry.name.slice(0, -4) : entry.name;

        if (!packageName.startsWith(prefix) || (!entry.isDirectory() && !isArchive)) {
            return;
        }

        const packagePath = path.join(distPath, entry.name);
        const packageItem = packages.get(packageName) || {
            archivePath: null,
            directoryPath: null,
            modifiedAt: 0,
        };

        if (isArchive) {
            packageItem.archivePath = packagePath;
        } else {
            packageItem.directoryPath = packagePath;
        }

        packageItem.modifiedAt = Math.max(packageItem.modifiedAt, fs.statSync(packagePath).mtimeMs);
        packages.set(packageName, packageItem);
    });

    const packageItem = [...packages.values()]
        .filter((item) => {
            if (UPLOAD_TYPE === 'files') {
                return item.directoryPath;
            }

            if (UPLOAD_TYPE === 'archive') {
                return item.archivePath;
            }

            return item.directoryPath && item.archivePath;
        })
        .sort((a, b) => b.modifiedAt - a.modifiedAt)[0];

    if (!packageItem) {
        throw new Error(
            `Fehler: In "${distPath}" wurde kein Paket für UPLOAD_TYPE "${UPLOAD_TYPE}" gefunden. ` +
                'Zuerst pack.js ausführen.'
        );
    }

    return packageItem;
}

function getuploadItems(packageItem) {
    const items = [];

    if (UPLOAD_TYPE === 'files' || UPLOAD_TYPE === 'both') {
        items.push({
            isDirectory: true,
            localPath: packageItem.directoryPath,
        });
    }

    if (UPLOAD_TYPE === 'archive' || UPLOAD_TYPE === 'both') {
        items.push({
            isDirectory: false,
            localPath: packageItem.archivePath,
        });
    }

    return items.map((item) => ({
        ...item,
        remotePath: path.posix.join(String(UPLOAD.path), path.basename(item.localPath)),
    }));
}

function getPort(protocol) {
    return Number(UPLOAD.port || protocolClients[protocol].defaultPort);
}

function encodeRemotePath(remoteFile) {
    return remoteFile.split('/').map(encodeURIComponent).join('/');
}

function getUrlHost(host) {
    const value = String(host);

    return value.includes(':') && !value.startsWith('[') ? `[${value}]` : value;
}

function quoteCurlConfig(value) {
    if (/[\r\n\0]/.test(value)) {
        throw new Error('Fehler: FTP-Zugangsdaten dürfen keine Zeilenumbrüche enthalten.');
    }

    return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

function getFilesRecursively(directoryPath) {
    const files = [];

    fs.readdirSync(directoryPath, { withFileTypes: true })
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((entry) => {
            const entryPath = path.join(directoryPath, entry.name);

            if (entry.isDirectory()) {
                files.push(...getFilesRecursively(entryPath));
            } else if (entry.isFile()) {
                files.push(entryPath);
            } else {
                throw new Error(`Fehler: Nicht unterstützter Dateityp im Paket: "${entryPath}".`);
            }
        });

    return files;
}

function getCurlUrl(remotePath, protocol) {
    // curl interprets FTP paths as relative unless the URL path starts with //.
    return (
        `${protocol}://${getUrlHost(UPLOAD.host)}:${getPort(protocol)}/` +
        encodeRemotePath(remotePath)
    );
}

function getCurlTransfers(uploadItems, protocol) {
    return uploadItems.flatMap((item) => {
        if (!item.isDirectory) {
            return [
                {
                    localPath: item.localPath,
                    url: getCurlUrl(item.remotePath, protocol),
                },
            ];
        }

        return getFilesRecursively(item.localPath).map((localPath) => {
            const relativePath = path.relative(item.localPath, localPath).split(path.sep).join('/');
            const remotePath = path.posix.join(item.remotePath, relativePath);

            return {
                localPath,
                url: getCurlUrl(remotePath, protocol),
            };
        });
    });
}

function getCurlTransferConfig(transfer) {
    const options = ['fail-with-body', 'ftp-create-dirs', 'show-error', 'silent'];

    if (UPLOAD.user || UPLOAD.pass) {
        options.push(`user = ${quoteCurlConfig(`${UPLOAD.user || ''}:${UPLOAD.pass || ''}`)}`);
    }

    options.push(
        `upload-file = ${quoteCurlConfig(transfer.localPath)}`,
        `url = ${quoteCurlConfig(transfer.url)}`
    );

    return options.join('\n');
}

function UPLOADUsingCurl(uploadItems, protocol) {
    const client = protocolClients[protocol];
    const transfers = getCurlTransfers(uploadItems, protocol);

    if (transfers.length === 0) {
        throw new Error('Fehler: Der zu übertragende Ordner enthält keine Dateien.');
    }

    const curlConfig = transfers.map(getCurlTransferConfig).join('\nnext\n') + '\n';

    runExternal(client.client, ['--config', '-'], {
        alternatives: client.alternatives,
        input: curlConfig,
        purpose: `UPLOADs per ${protocol.toUpperCase()}`,
    });
}

function expandHome(filePath) {
    if (filePath === '~') {
        return os.homedir();
    }

    if (filePath.startsWith(`~${path.sep}`)) {
        return path.join(os.homedir(), filePath.slice(2));
    }

    return path.resolve(filePath);
}

function getPrivateKey() {
    if (!UPLOAD.key) {
        return null;
    }

    let keyPath = expandHome(String(UPLOAD.key));

    if (keyPath.endsWith('.pub') && fs.existsSync(keyPath.slice(0, -4))) {
        keyPath = keyPath.slice(0, -4);
    }

    if (!fs.existsSync(keyPath)) {
        throw new Error(`Fehler: Der konfigurierte SSH-Schlüssel "${keyPath}" existiert nicht.`);
    }

    return keyPath;
}

function quoteSftpPath(filePath) {
    if (/[\r\n\0]/.test(filePath)) {
        throw new Error('Fehler: Datei- und Zielpfade dürfen keine Zeilenumbrüche enthalten.');
    }

    return `"${filePath.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

function getSshArguments(protocol, keyPath) {
    const args = ['-P', String(getPort(protocol))];

    if (keyPath) {
        args.push('-i', keyPath, '-o', 'IdentitiesOnly=yes');
    }

    if (!UPLOAD.pass) {
        args.push('-o', 'BatchMode=yes');
    }

    return args;
}

function runSshClient(protocol, args, input) {
    const client = protocolClients[protocol];
    const clientPath = requireExecutable(
        client.client,
        `UPLOADs per ${protocol.toUpperCase()}`,
        client.alternatives
    );

    if (UPLOAD.pass) {
        const sshpassAlternatives = ['curl', 'expect'];
        const sshpassPath = requireExecutable(
            'sshpass',
            `Passwort-Authentifizierung per ${protocol.toUpperCase()}`,
            sshpassAlternatives
        );

        runExternal(sshpassPath, ['-e', clientPath, ...args], {
            alternatives: sshpassAlternatives,
            env: { ...process.env, SSHPASS: String(UPLOAD.pass) },
            input,
            purpose: `Passwort-Authentifizierung per ${protocol.toUpperCase()}`,
        });
        return;
    }

    runExternal(clientPath, args, {
        alternatives: client.alternatives,
        input,
        purpose: `UPLOADs per ${protocol.toUpperCase()}`,
    });
}

function quoteShellArgument(value) {
    return `'${String(value).replaceAll("'", `'\\''`)}'`;
}

function getRemoteExecutableCheck(program, purpose) {
    const busyboxMessage = quoteShellArgument(
        `Fehler: Auf dem entfernten Host fehlt "${program}" für ${purpose}. ` +
            'Vorhandene Alternative: busybox.'
    );
    const toyboxMessage = quoteShellArgument(
        `Fehler: Auf dem entfernten Host fehlt "${program}" für ${purpose}. ` +
            'Vorhandene Alternative: toybox.'
    );
    const missingMessage = quoteShellArgument(
        `Fehler: Auf dem entfernten Host fehlt "${program}" für ${purpose}; ` +
            'keine Alternative gefunden.'
    );

    return [
        `if ! command -v ${program} >/dev/null 2>&1; then`,
        'if command -v busybox >/dev/null 2>&1; then',
        `printf '%s\\n' ${busyboxMessage} >&2;`,
        'elif command -v toybox >/dev/null 2>&1; then',
        `printf '%s\\n' ${toyboxMessage} >&2;`,
        'else',
        `printf '%s\\n' ${missingMessage} >&2;`,
        'fi;',
        'exit 127;',
        'fi;',
    ].join(' ');
}

function getRemoteCommandPort() {
    if (UPLOAD.protocol === 'scp' || UPLOAD.protocol === 'sftp') {
        return getPort(UPLOAD.protocol);
    }

    return sshClient.defaultPort;
}

function getRemoteChownCommand(uploadItems) {
    const targets = uploadItems.map((item) => quoteShellArgument(item.remotePath)).join(' ');

    return [
        getRemoteExecutableCheck('chown', 'das Setzen von Eigentümer und Gruppe'),
        `chown -R -- ${quoteShellArgument(UPLOAD.chown)} ${targets};`,
    ].join(' ');
}

function applyRemoteChown(uploadItems) {
    if (!UPLOAD.chown) {
        return;
    }

    runRemoteCommand(getRemoteChownCommand(uploadItems), 'das Setzen von Eigentümer und Gruppe');

    console.log(`Eigentümer/Gruppe auf ${UPLOAD.chown} gesetzt.`);
}

function runRemoteCommand(command, purpose) {
    const keyPath = getPrivateKey();
    const host = UPLOAD.user ? `${UPLOAD.user}@${UPLOAD.host}` : String(UPLOAD.host);
    const args = ['-p', String(getRemoteCommandPort())];

    if (keyPath) {
        args.push('-i', keyPath, '-o', 'IdentitiesOnly=yes');
    }

    if (!UPLOAD.pass) {
        args.push('-o', 'BatchMode=yes');
    }

    args.push(host, command);

    const clientPath = requireExecutable(sshClient.client, purpose, sshClient.alternatives);

    if (UPLOAD.pass) {
        const sshpassAlternatives = ['expect'];
        const sshpassPath = requireExecutable(
            'sshpass',
            `SSH-Passwort-Authentifizierung für ${purpose}`,
            sshpassAlternatives
        );

        runExternal(sshpassPath, ['-e', clientPath, ...args], {
            alternatives: sshpassAlternatives,
            env: { ...process.env, SSHPASS: String(UPLOAD.pass) },
            purpose: `SSH-Passwort-Authentifizierung für ${purpose}`,
        });
    } else {
        runExternal(clientPath, args, {
            alternatives: sshClient.alternatives,
            purpose,
        });
    }
}

function getRemoteRenameDetails(uploadItems) {
    if (!UPLOAD.rename) {
        return null;
    }

    const directoryItem = uploadItems.find((item) => item.isDirectory);

    if (!directoryItem) {
        return null;
    }

    const sourceName = path.posix.basename(directoryItem.remotePath);

    UPLOAD.rename.lastIndex = 0;
    const match = UPLOAD.rename.exec(sourceName);
    UPLOAD.rename.lastIndex = 0;

    if (!match || match[1] === undefined || match[1] === '') {
        throw new Error(
            `Fehler: "UPLOAD.rename" konnte aus "${sourceName}" keinen Ordnernamen filtern.`
        );
    }

    const targetName = String(match[1]);

    if (targetName === '.' || targetName === '..' || /[/\r\n\0]/.test(targetName)) {
        throw new Error(`Fehler: "${targetName}" ist kein gültiger gefilterter Ordnername.`);
    }

    const targetPath = path.posix.join(path.posix.dirname(directoryItem.remotePath), targetName);

    if (targetPath === directoryItem.remotePath) {
        throw new Error('Fehler: Quell- und Zielordner der Umbenennung sind identisch.');
    }

    const backupTargetPath = path.posix.join(UPLOAD.backupExisting, targetName);
    const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');

    return {
        backupRolloverPath: `${backupTargetPath}_${timestamp}`,
        backupTargetPath,
        directoryItem,
        sourcePath: directoryItem.remotePath,
        targetPath,
    };
}

function getRemoteRenameCommand(renameDetails) {
    const { backupRolloverPath, backupTargetPath, sourcePath, targetPath } = renameDetails;
    const missingSourceMessage = quoteShellArgument(
        `Fehler: Der hochgeladene Ordner "${sourcePath}" existiert nicht.`
    );
    const invalidTargetMessage = quoteShellArgument(
        `Fehler: Das Umbenennungsziel "${targetPath}" existiert, ist aber kein Ordner.`
    );
    const invalidBackupMessage = quoteShellArgument(
        `Fehler: Der Backup-Pfad "${UPLOAD.backupExisting}" existiert, ist aber kein Ordner.`
    );
    const rolloverExistsMessage = quoteShellArgument(
        `Fehler: Das Ausweich-Backup "${backupRolloverPath}" existiert bereits.`
    );
    const executableChecks = [
        getRemoteExecutableCheck('mkdir', 'das Anlegen des Backup-Ordners'),
        getRemoteExecutableCheck('mv', 'das Sichern und Umbenennen des Ordners'),
    ];

    if (UPLOAD.chown) {
        executableChecks.push(
            getRemoteExecutableCheck('chown', 'das Setzen der Besitzrechte des Backup-Ordners')
        );
    }

    return [
        ...executableChecks,
        `if [ ! -d ${quoteShellArgument(sourcePath)} ]; then`,
        `printf '%s\\n' ${missingSourceMessage} >&2;`,
        'exit 1;',
        'fi;',
        `if [ -e ${quoteShellArgument(targetPath)} ] && [ ! -d ${quoteShellArgument(targetPath)} ]; then`,
        `printf '%s\\n' ${invalidTargetMessage} >&2;`,
        'exit 1;',
        'fi;',
        `if [ -d ${quoteShellArgument(targetPath)} ]; then`,
        `if [ -e ${quoteShellArgument(UPLOAD.backupExisting)} ] && ` +
            `[ ! -d ${quoteShellArgument(UPLOAD.backupExisting)} ]; then`,
        `printf '%s\\n' ${invalidBackupMessage} >&2;`,
        'exit 1;',
        'fi;',
        `if [ ! -d ${quoteShellArgument(UPLOAD.backupExisting)} ]; then`,
        `mkdir -p -- ${quoteShellArgument(UPLOAD.backupExisting)} || exit $?;`,
        'fi;',
        ...(UPLOAD.chown
            ? [
                  `chown -- ${quoteShellArgument(UPLOAD.chown)} ` +
                      `${quoteShellArgument(UPLOAD.backupExisting)} || exit $?;`,
              ]
            : []),
        `if [ -e ${quoteShellArgument(backupTargetPath)} ]; then`,
        `if [ -e ${quoteShellArgument(backupRolloverPath)} ]; then`,
        `printf '%s\\n' ${rolloverExistsMessage} >&2;`,
        'exit 1;',
        'fi;',
        `mv -- ${quoteShellArgument(backupTargetPath)} ${quoteShellArgument(backupRolloverPath)} || exit $?;`,
        'fi;',
        `mv -- ${quoteShellArgument(targetPath)} ${quoteShellArgument(backupTargetPath)} || exit $?;`,
        'fi;',
        `mv -- ${quoteShellArgument(sourcePath)} ${quoteShellArgument(targetPath)}`,
    ].join(' ');
}

function renameRemoteFolder(uploadItems) {
    const renameDetails = getRemoteRenameDetails(uploadItems);

    if (!renameDetails) {
        return;
    }

    runRemoteCommand(
        getRemoteRenameCommand(renameDetails),
        'das Sichern und Umbenennen des Upload-Ordners'
    );

    renameDetails.directoryItem.remotePath = renameDetails.targetPath;
    console.log(`Ordner nach ${renameDetails.targetPath} umbenannt.`);
}

function getRemotePostRunCommand() {
    const scriptPath = quoteShellArgument(UPLOAD.postRun);
    const missingMessage = quoteShellArgument(
        `PostRun-Skript "${UPLOAD.postRun}" wurde nicht gefunden und wird übersprungen.`
    );
    const notExecutableMessage = quoteShellArgument(
        `Fehler: PostRun-Skript "${UPLOAD.postRun}" ist nicht ausführbar.`
    );

    return [
        `if [ -f ${scriptPath} ]; then`,
        `if [ -x ${scriptPath} ]; then`,
        `${scriptPath};`,
        'else',
        `printf '%s\\n' ${notExecutableMessage} >&2;`,
        'exit 126;',
        'fi;',
        'else',
        `printf '%s\\n' ${missingMessage};`,
        'fi',
    ].join(' ');
}

function runRemotePostRun() {
    if (!UPLOAD.postRun) {
        return;
    }

    runRemoteCommand(getRemotePostRunCommand(), 'das PostRun-Skript');
}

function UPLOADUsingScp(uploadItems) {
    const keyPath = getPrivateKey();
    const args = getSshArguments('scp', keyPath);
    const host = UPLOAD.user ? `${UPLOAD.user}@${UPLOAD.host}` : String(UPLOAD.host);

    if (uploadItems.some((item) => item.isDirectory)) {
        args.push('-r');
    }

    args.push(...uploadItems.map((item) => item.localPath), `${host}:${UPLOAD.path}`);
    runSshClient('scp', args);
}

function UPLOADUsingSftp(uploadItems) {
    const keyPath = getPrivateKey();
    const args = getSshArguments('sftp', keyPath);
    const host = UPLOAD.user ? `${UPLOAD.user}@${UPLOAD.host}` : String(UPLOAD.host);
    const command =
        uploadItems
            .map((item) => {
                const recursiveOption = item.isDirectory ? '-r ' : '';
                const remotePath = item.isDirectory ? String(UPLOAD.path) : item.remotePath;

                return `put ${recursiveOption}${quoteSftpPath(item.localPath)} ${quoteSftpPath(remotePath)}`;
            })
            .join('\n') + '\n';

    if (!UPLOAD.pass) {
        args.push('-b', '-');
    }

    args.push(host);
    runSshClient('sftp', args, command);
}

function main() {
    validateConfig();

    const packageItem = findLatestPackage();
    const uploadItems = getuploadItems(packageItem);
    const protocol = UPLOAD.protocol;

    uploadItems.forEach((item) => {
        console.log(`UPLOAD: ${item.localPath}`);
        console.log(`Ziel: ${protocol}://${UPLOAD.host}:${getPort(protocol)}${item.remotePath}`);
    });

    if (protocol === 'ftp' || protocol === 'ftps') {
        UPLOADUsingCurl(uploadItems, protocol);
    } else if (protocol === 'scp') {
        UPLOADUsingScp(uploadItems);
    } else {
        UPLOADUsingSftp(uploadItems);
    }

    applyRemoteChown(uploadItems);
    renameRemoteFolder(uploadItems);
    runRemotePostRun();

    console.log('UPLOAD erfolgreich abgeschlossen.');
}

try {
    main();
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
