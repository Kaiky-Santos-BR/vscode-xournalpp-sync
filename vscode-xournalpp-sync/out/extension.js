"use strict";
/**
 * Xournal++ Sync for VS Code
 *
 * @author Kaiky Vinicius dos Santos
 * @license MIT
 * @repository https://github.com/kaikyvinicius/vscode-xournalpp-sync
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const util_1 = require("util");
const child_process_1 = require("child_process");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
function activate(context) {
    console.log('[Xournal++ Sync] Activating...');
    const config = getConfig();
    let xournalppPath = config.executablePath || '';
    // Async initialization
    (async () => {
        if (!xournalppPath) {
            xournalppPath = await findXournalpp();
        }
    })();
    // Status bar item
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.command = 'xournalpp.openInXournalpp';
    statusBar.text = '$(edit) Xournal++';
    statusBar.tooltip = 'Open current note in Xournal++';
    statusBar.show();
    context.subscriptions.push(statusBar);
    // File watcher for .xopp files
    const xoppWatcher = vscode.workspace.createFileSystemWatcher('**/*.xopp');
    context.subscriptions.push(xoppWatcher);
    // Debounced export queue
    const exportQueue = new Map();
    const activeExports = new Set();
    // --- Core Functions ---
    async function getXournalppPath() {
        if (xournalppPath && await fileExists(xournalppPath)) {
            return xournalppPath;
        }
        xournalppPath = await findXournalpp();
        return xournalppPath;
    }
    async function findXournalpp() {
        const candidates = [];
        // From PATH
        if (process.platform === 'win32') {
            candidates.push('xournalpp.exe');
            candidates.push(path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Xournal++', 'xournalpp.exe'));
            candidates.push(path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Xournal++', 'xournalpp.exe'));
            candidates.push(path.join(process.env['LOCALAPPDATA'] || '', 'Programs', 'Xournal++', 'xournalpp.exe'));
            // Winget/Scoop
            candidates.push(path.join(process.env['USERPROFILE'] || '', 'scoop', 'apps', 'xournalpp', 'current', 'xournalpp.exe'));
        }
        else {
            candidates.push('xournalpp');
            candidates.push('/usr/bin/xournalpp');
            candidates.push('/usr/local/bin/xournalpp');
            candidates.push('/Applications/Xournal++.app/Contents/MacOS/xournalpp');
            // Flatpak
            candidates.push('flatpak run com.github.xournalpp.xournalpp');
        }
        for (const candidate of candidates) {
            try {
                const resolved = await which(candidate);
                if (resolved)
                    return resolved;
            }
            catch { }
        }
        return '';
    }
    function which(cmd) {
        return new Promise((resolve) => {
            const isWin = process.platform === 'win32';
            const paths = (process.env.PATH || '').split(path.delimiter);
            const exts = isWin ? ['.exe', '.cmd', '.bat', ''] : [''];
            for (const p of paths) {
                for (const ext of exts) {
                    const full = path.join(p, cmd + ext);
                    if (fs.existsSync(full) && !fs.lstatSync(full).isDirectory()) {
                        resolve(full);
                        return;
                    }
                }
            }
            // Try direct execution for flatpak
            if (cmd.includes('flatpak')) {
                resolve(cmd);
                return;
            }
            resolve(null);
        });
    }
    async function fileExists(filePath) {
        try {
            await fs.promises.access(filePath, fs.constants.F_OK);
            return true;
        }
        catch {
            return false;
        }
    }
    function getConfig() {
        const cfg = vscode.workspace.getConfiguration('xournalpp.sync');
        return {
            executablePath: cfg.get('executablePath') || '',
            autoExportOnSave: cfg.get('autoExportOnSave') ?? true,
            autoExportOnCreate: cfg.get('autoExportOnCreate') ?? true,
            exportNoRuling: cfg.get('exportNoRuling') ?? false,
            exportNoBackground: cfg.get('exportNoBackground') ?? false,
            templatePath: cfg.get('templatePath') || '',
            defaultFolder: cfg.get('defaultFolder') || '',
            notifications: cfg.get('notifications') || 'errors'
        };
    }
    function notify(message, type = 'info') {
        const cfg = getConfig();
        if (cfg.notifications === 'none')
            return;
        if (cfg.notifications === 'errors' && type !== 'error')
            return;
        switch (type) {
            case 'error':
                vscode.window.showErrorMessage(`[Xournal++] ${message}`);
                break;
            case 'warning':
                vscode.window.showWarningMessage(`[Xournal++] ${message}`);
                break;
            default: vscode.window.showInformationMessage(`[Xournal++] ${message}`);
        }
    }
    function getNotePair(xoppUri) {
        const pdfUri = xoppUri.with({ path: xoppUri.path.replace(/\.xopp$/i, '.pdf') });
        return {
            xoppFile: xoppUri,
            pdfFile: pdfUri,
            exists: {
                xopp: fs.existsSync(xoppUri.fsPath),
                pdf: fs.existsSync(pdfUri.fsPath)
            }
        };
    }
    function getXoppFromPdf(pdfUri) {
        if (!pdfUri.path.endsWith('.pdf'))
            return null;
        const xoppPath = pdfUri.path.replace(/\.pdf$/i, '.xopp');
        const xoppUri = pdfUri.with({ path: xoppPath });
        return fs.existsSync(xoppUri.fsPath) ? xoppUri : null;
    }
    // --- Export to PDF ---
    async function exportToPdf(xoppUri, notifyUser = true) {
        const xppPath = await getXournalppPath();
        if (!xppPath) {
            if (notifyUser)
                notify('Xournal++ not found. Configure path in settings.', 'error');
            return false;
        }
        const pair = getNotePair(xoppUri);
        if (!pair.exists.xopp) {
            if (notifyUser)
                notify(`File not found: ${xoppUri.fsPath}`, 'error');
            return false;
        }
        const key = xoppUri.fsPath;
        if (activeExports.has(key)) {
            if (notifyUser)
                notify('Export already in progress...', 'info');
            return false;
        }
        activeExports.add(key);
        const pdfPath = pair.pdfFile.fsPath;
        const tempPdfPath = `${pdfPath}.tmp`;
        const args = ['--create-pdf', tempPdfPath];
        if (getConfig().exportNoRuling)
            args.push('--export-no-ruling');
        if (getConfig().exportNoBackground)
            args.push('--export-no-background');
        args.push(xoppUri.fsPath);
        try {
            const { stdout, stderr } = await execFileAsync(xppPath, args, {
                timeout: 60000,
                windowsHide: true
            });
            if (stderr && !stderr.includes('QStandardPaths')) {
                console.warn('[Xournal++] stderr:', stderr);
            }
            // Move temp to final
            await fs.promises.rename(tempPdfPath, pdfPath);
            // Refresh VS Code file explorer
            try {
                await vscode.workspace.fs.stat(pair.pdfFile);
            }
            catch { }
            if (notifyUser)
                notify(`Exported: ${path.basename(pdfPath)}`);
            return true;
        }
        catch (err) {
            console.error('[Xournal++] Export error:', err);
            if (notifyUser)
                notify(`Export failed: ${err.message}`, 'error');
            try {
                await fs.promises.unlink(tempPdfPath);
            }
            catch { }
            return false;
        }
        finally {
            activeExports.delete(key);
        }
    }
    async function exportAllToPdf() {
        const files = await vscode.workspace.findFiles('**/*.xopp');
        if (files.length === 0) {
            notify('No .xopp files found in workspace', 'warning');
            return;
        }
        notify(`Exporting ${files.length} notes...`);
        let success = 0, failed = 0;
        for (const file of files) {
            const ok = await exportToPdf(file, false);
            if (ok)
                success++;
            else
                failed++;
        }
        notify(`Export complete: ${success} succeeded, ${failed} failed`);
    }
    // --- File Watcher ---
    xoppWatcher.onDidChange(async (uri) => {
        const cfg = getConfig();
        if (!cfg.autoExportOnSave)
            return;
        // Debounce rapid saves
        const existing = exportQueue.get(uri.fsPath);
        if (existing)
            clearTimeout(existing);
        exportQueue.set(uri.fsPath, setTimeout(() => {
            exportQueue.delete(uri.fsPath);
            exportToPdf(uri, false);
        }, 500));
    });
    xoppWatcher.onDidCreate(async (uri) => {
        const cfg = getConfig();
        if (cfg.autoExportOnCreate) {
            setTimeout(() => exportToPdf(uri, false), 1000);
        }
    });
    // --- Commands ---
    // Open in Xournal++
    context.subscriptions.push(vscode.commands.registerCommand('xournalpp.openInXournalpp', async (uri) => {
        let targetUri = uri;
        if (!targetUri) {
            const editor = vscode.window.activeTextEditor;
            if (editor)
                targetUri = editor.document.uri;
        }
        if (!targetUri) {
            // Fallback: show quick pick of all .xopp files
            const files = await vscode.workspace.findFiles('**/*.xopp');
            if (files.length === 0) {
                notify('No .xopp files in workspace', 'warning');
                return;
            }
            const picked = await vscode.window.showQuickPick(files.map(f => ({
                label: path.basename(f.fsPath),
                description: path.dirname(f.fsPath),
                uri: f
            })), { placeHolder: 'Select note to open in Xournal++' });
            if (picked)
                targetUri = picked.uri;
        }
        if (!targetUri)
            return;
        // If PDF, find corresponding .xopp
        if (targetUri.path.endsWith('.pdf')) {
            const xoppUri = getXoppFromPdf(targetUri);
            if (!xoppUri) {
                notify('No corresponding .xopp file found for this PDF', 'warning');
                return;
            }
            targetUri = xoppUri;
        }
        if (!targetUri.path.endsWith('.xopp')) {
            notify('Selected file is not a .xopp note', 'warning');
            return;
        }
        const xppPath = await getXournalppPath();
        if (!xppPath) {
            notify('Xournal++ not found. Configure path in settings.', 'error');
            const configured = await vscode.window.showInformationMessage('Xournal++ not found. Open settings to configure path?', 'Open Settings');
            if (configured) {
                await vscode.commands.executeCommand('workbench.action.openSettings', 'xournalpp.sync.executablePath');
            }
            return;
        }
        try {
            const args = [targetUri.fsPath];
            // Detach on Windows
            if (process.platform === 'win32') {
                const { spawn } = require('child_process');
                spawn(xppPath, args, { detached: true, stdio: 'ignore', windowsHide: true }).unref();
            }
            else {
                const { spawn } = require('child_process');
                spawn(xppPath, args, { detached: true, stdio: 'ignore' }).unref();
            }
            notify(`Opened in Xournal++: ${path.basename(targetUri.fsPath)}`);
        }
        catch (err) {
            notify(`Failed to open: ${err.message}`, 'error');
        }
    }));
    // Create new note
    context.subscriptions.push(vscode.commands.registerCommand('xournalpp.createNewNote', async () => {
        const xppPath = await getXournalppPath();
        if (!xppPath) {
            notify('Xournal++ not found. Configure path in settings.', 'error');
            return;
        }
        const name = await vscode.window.showInputBox({
            prompt: 'Enter note name (without .xopp)',
            placeHolder: 'my-note',
            validateInput: (v) => v && !v.includes('/') && !v.includes('\\') ? null : 'Invalid name'
        });
        if (!name)
            return;
        const cfg = getConfig();
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            notify('No workspace folder open', 'error');
            return;
        }
        const folder = cfg.defaultFolder
            ? vscode.Uri.joinPath(workspaceFolder.uri, cfg.defaultFolder)
            : workspaceFolder.uri;
        // Ensure folder exists
        try {
            await vscode.workspace.fs.createDirectory(folder);
        }
        catch { }
        const xoppUri = vscode.Uri.joinPath(folder, `${name}.xopp`);
        // Create from template or blank
        if (cfg.templatePath && await fileExists(cfg.templatePath)) {
            await vscode.workspace.fs.copy(vscode.Uri.file(cfg.templatePath), xoppUri);
        }
        else {
            // Create minimal valid .xopp (gzipped XML)
            const minimalXml = `<?xml version="1.0" standalone="no"?>
<xournal creator="xournalpp" fileversion="4">
  <title>${name}</title>
  <page width="595" height="842" style="Blank">
    <background type="solid" color="#ffffff"/>
    <layer/>
  </page>
</xournal>`;
            const zlib = require('zlib');
            const compressed = zlib.gzipSync(Buffer.from(minimalXml, 'utf-8'));
            await vscode.workspace.fs.writeFile(xoppUri, compressed);
        }
        // Export to PDF
        if (cfg.autoExportOnCreate) {
            setTimeout(() => exportToPdf(xoppUri, true), 500);
        }
        // Open in Xournal++
        const openNow = await vscode.window.showInformationMessage(`Created ${name}.xopp. Open in Xournal++?`, 'Open Now');
        if (openNow) {
            vscode.commands.executeCommand('xournalpp.openInXournalpp', xoppUri);
        }
    }));
    // Export current to PDF
    context.subscriptions.push(vscode.commands.registerCommand('xournalpp.exportToPdf', async (uri) => {
        let targetUri = uri;
        if (!targetUri) {
            const editor = vscode.window.activeTextEditor;
            if (editor)
                targetUri = editor.document.uri;
        }
        if (!targetUri) {
            notify('No .xopp file selected', 'warning');
            return;
        }
        if (targetUri.path.endsWith('.pdf')) {
            const xoppUri = getXoppFromPdf(targetUri);
            if (!xoppUri) {
                notify('No corresponding .xopp file', 'warning');
                return;
            }
            targetUri = xoppUri;
        }
        await exportToPdf(targetUri, true);
    }));
    // Export all
    context.subscriptions.push(vscode.commands.registerCommand('xournalpp.exportAllToPdf', exportAllToPdf));
    // Search and open
    context.subscriptions.push(vscode.commands.registerCommand('xournalpp.searchAndOpen', async () => {
        const files = await vscode.workspace.findFiles('**/*.xopp');
        if (files.length === 0) {
            notify('No .xopp files in workspace', 'warning');
            return;
        }
        const picked = await vscode.window.showQuickPick(files.map(f => ({
            label: path.basename(f.fsPath, '.xopp'),
            description: path.dirname(f.fsPath),
            uri: f,
            hasPdf: fs.existsSync(f.fsPath.replace(/\.xopp$/i, '.pdf'))
        })), {
            placeHolder: 'Search Xournal++ notes',
            matchOnDescription: true,
            matchOnDetail: true
        });
        if (picked) {
            const action = await vscode.window.showQuickPick([
                { label: '$(edit) Open in Xournal++', action: 'open' },
                { label: '$(preview) Open PDF', action: 'pdf' },
                { label: '$(file-code) Export to PDF', action: 'export' }
            ], { placeHolder: 'Choose action' });
            if (!action)
                return;
            switch (action.action) {
                case 'open':
                    vscode.commands.executeCommand('xournalpp.openInXournalpp', picked.uri);
                    break;
                case 'pdf':
                    const pdfUri = picked.uri.with({ path: picked.uri.path.replace(/\.xopp$/i, '.pdf') });
                    if (fs.existsSync(pdfUri.fsPath)) {
                        await vscode.commands.executeCommand('vscode.open', pdfUri);
                    }
                    else {
                        notify('PDF not found. Export first?', 'warning');
                    }
                    break;
                case 'export':
                    exportToPdf(picked.uri, true);
                    break;
            }
        }
    }));
    // Rename note (both .xopp and .pdf)
    context.subscriptions.push(vscode.commands.registerCommand('xournalpp.renameNote', async (uri) => {
        let targetUri = uri;
        if (!targetUri) {
            const editor = vscode.window.activeTextEditor;
            if (editor)
                targetUri = editor.document.uri;
        }
        if (!targetUri) {
            notify('No file selected', 'warning');
            return;
        }
        // If PDF, get corresponding .xopp
        if (targetUri.path.endsWith('.pdf')) {
            const xoppUri = getXoppFromPdf(targetUri);
            if (!xoppUri) {
                notify('No corresponding .xopp file', 'warning');
                return;
            }
            targetUri = xoppUri;
        }
        const pair = getNotePair(targetUri);
        if (!pair.exists.xopp) {
            notify('Note file not found', 'error');
            return;
        }
        const newName = await vscode.window.showInputBox({
            prompt: 'New name (without extension)',
            value: path.basename(targetUri.fsPath, '.xopp'),
            validateInput: (v) => v && !v.includes('/') && !v.includes('\\') ? null : 'Invalid name'
        });
        if (!newName || newName === path.basename(targetUri.fsPath, '.xopp'))
            return;
        const newXoppUri = targetUri.with({ path: path.join(path.dirname(targetUri.fsPath), `${newName}.xopp`) });
        const newPdfUri = targetUri.with({ path: path.join(path.dirname(targetUri.fsPath), `${newName}.pdf`) });
        try {
            // Rename .xopp
            await vscode.workspace.fs.rename(targetUri, newXoppUri, { overwrite: false });
            // Rename .pdf if exists
            if (pair.exists.pdf) {
                await vscode.workspace.fs.rename(pair.pdfFile, newPdfUri, { overwrite: false });
            }
            notify(`Renamed to ${newName}.xopp${pair.exists.pdf ? ' + .pdf' : ''}`);
        }
        catch (err) {
            notify(`Rename failed: ${err.message}`, 'error');
        }
    }));
    // Delete note (both .xopp and .pdf)
    context.subscriptions.push(vscode.commands.registerCommand('xournalpp.deleteNote', async (uri) => {
        let targetUri = uri;
        if (!targetUri) {
            const editor = vscode.window.activeTextEditor;
            if (editor)
                targetUri = editor.document.uri;
        }
        if (!targetUri) {
            notify('No file selected', 'warning');
            return;
        }
        if (targetUri.path.endsWith('.pdf')) {
            const xoppUri = getXoppFromPdf(targetUri);
            if (!xoppUri) {
                notify('No corresponding .xopp file', 'warning');
                return;
            }
            targetUri = xoppUri;
        }
        const pair = getNotePair(targetUri);
        if (!pair.exists.xopp) {
            notify('Note file not found', 'error');
            return;
        }
        const confirm = await vscode.window.showWarningMessage(`Delete ${path.basename(targetUri.fsPath)}${pair.exists.pdf ? ' and PDF' : ''}?`, { modal: true }, 'Delete');
        if (confirm !== 'Delete')
            return;
        try {
            await vscode.workspace.fs.delete(targetUri);
            if (pair.exists.pdf) {
                await vscode.workspace.fs.delete(pair.pdfFile);
            }
            notify('Deleted successfully');
        }
        catch (err) {
            notify(`Delete failed: ${err.message}`, 'error');
        }
    }));
    // Open corresponding PDF
    context.subscriptions.push(vscode.commands.registerCommand('xournalpp.openPdf', async (uri) => {
        let targetUri = uri;
        if (!targetUri) {
            const editor = vscode.window.activeTextEditor;
            if (editor)
                targetUri = editor.document.uri;
        }
        if (!targetUri)
            return;
        let pdfUri;
        if (targetUri.path.endsWith('.xopp')) {
            pdfUri = targetUri.with({ path: targetUri.path.replace(/\.xopp$/i, '.pdf') });
        }
        else if (targetUri.path.endsWith('.pdf')) {
            pdfUri = targetUri;
        }
        else {
            return;
        }
        if (fs.existsSync(pdfUri.fsPath)) {
            await vscode.commands.executeCommand('vscode.open', pdfUri);
        }
        else {
            const action = await vscode.window.showInformationMessage('PDF not found. Export now?', 'Export');
            if (action === 'Export' && targetUri.path.endsWith('.xopp')) {
                await exportToPdf(targetUri, true);
                if (fs.existsSync(pdfUri.fsPath)) {
                    await vscode.commands.executeCommand('vscode.open', pdfUri);
                }
            }
        }
    }));
    // Configure path
    context.subscriptions.push(vscode.commands.registerCommand('xournalpp.configurePath', async () => {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'xournalpp.sync.executablePath');
    }));
    // Tree View for Xournal++ Notes
    const notesProvider = new NotesTreeProvider();
    context.subscriptions.push(vscode.window.registerTreeDataProvider('xournalpp.notesView', notesProvider));
    // Refresh on file changes
    const refreshWatcher = vscode.workspace.createFileSystemWatcher('**/*.xopp');
    refreshWatcher.onDidCreate(() => notesProvider.refresh());
    refreshWatcher.onDidDelete(() => notesProvider.refresh());
    context.subscriptions.push(refreshWatcher);
    console.log('[Xournal++ Sync] Activated successfully');
}
class NotesTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        if (element)
            return [];
        const files = await vscode.workspace.findFiles('**/*.xopp');
        return files.map(uri => {
            const pdfPath = uri.fsPath.replace(/\.xopp$/i, '.pdf');
            const hasPdf = fs.existsSync(pdfPath);
            const stat = fs.statSync(uri.fsPath);
            const item = new NoteItem(path.basename(uri.fsPath, '.xopp'), uri, hasPdf, stat.mtime);
            item.tooltip = `${uri.fsPath}\n${hasPdf ? '✓ PDF exists' : '✗ No PDF'}\nModified: ${stat.mtime.toLocaleString()}`;
            item.description = hasPdf ? '$(file-pdf) PDF' : '$(circle-slash) No PDF';
            return item;
        });
    }
}
class NoteItem extends vscode.TreeItem {
    constructor(label, uri, hasPdf, modified) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.label = label;
        this.uri = uri;
        this.hasPdf = hasPdf;
        this.modified = modified;
        this.resourceUri = uri;
        this.command = {
            command: 'xournalpp.openInXournalpp',
            title: 'Open in Xournal++',
            arguments: [uri]
        };
        this.contextValue = hasPdf ? 'xoppWithPdf' : 'xoppNoPdf';
        this.iconPath = hasPdf
            ? new vscode.ThemeIcon('file-pdf')
            : new vscode.ThemeIcon('file-code');
    }
}
function deactivate() {
    console.log('[Xournal++ Sync] Deactivated');
}
//# sourceMappingURL=extension.js.map