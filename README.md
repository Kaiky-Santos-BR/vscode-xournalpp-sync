# Xournal++ Sync for VS Code

[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-007ACC?logo=visualstudiocode&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=KaikySantosBR.kaiky-xournalpp-pdf)
[![Status](https://img.shields.io/badge/status-currently%20active-brightgreen)](https://marketplace.visualstudio.com/items?itemName=KaikySantosBR.kaiky-xournalpp-pdf)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.24544840.svg)](https://doi.org/10.5281/zenodo.24544840)
**Seamless integration between Xournal++ and VS Code** — Automatic PDF export, quick actions, and a notes explorer. Inspired by the [Obsidian Xournal++ plugin](https://github.com/jonjampen/obsidian-xournalpp).

**Author:** [Kaiky Vinicius dos Santos](https://github.com/Kaiky-Santos-BR)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔄 **Auto-export to PDF** | Automatically exports `.xopp` → `.pdf` on save/create |
| 📄 **PDF Preview** | View rendered notes in VS Code's built-in PDF viewer |
| 🎯 **Open in Xournal++** | One-click from Explorer, Command Palette, or Tree View |
| ➕ **Create New Notes** | Wizard with optional template, auto-exports to PDF |
| 🔍 **Search & Open** | Fuzzy search across all notes with actions |
| ✏️ **Rename Sync** | Renames both `.xopp` and `.pdf` together |
| 🗑️ **Delete Sync** | Deletes both files with confirmation |
| 🌲 **Notes Tree View** | Dedicated sidebar showing all notes with PDF status |
| ⚙️ **Configurable** | Custom Xournal++ path, export flags, templates, folders |

---

## 🚀 Quick Start

### 1. Install Xournal++
- **Windows**: `winget install Xournal++.Xournal++` or [download](https://xournalpp.github.io/)
- **Linux**: `sudo apt install xournalpp` / `flatpak install flathub com.github.xournalpp.xournalpp`
- **macOS**: `brew install --cask xournalpp`

### 2. Install Extension
```bash
# From VS Code Marketplace (when published)
code --install-extension kaikyvinicius.vscode-xournalpp-sync

# Or from .vsix
code --install-extension vscode-xournalpp-sync-1.0.0.vsix
```

### 3. Configure (if needed)
The extension auto-detects Xournal++ from PATH and default install locations. If not found:

1. `Ctrl+Shift+P` → **Xournal++: Configure Xournal++ Path**
2. Or Settings → `xournalpp.sync.executablePath` → Enter full path to `xournalpp` executable

### 4. Use It!
- **Right-click** `.xopp` file → **Open in Xournal++** / **Open PDF** / **Export to PDF** / **Rename** / **Delete**
- **Command Palette** → Search "Xournal++" for all commands
- **Sidebar** → "Xournal++ Notes" view (appears when workspace has `.xopp` files)

---

## 📖 Usage Guide

### Creating a New Note
```
Ctrl+Shift+P → "Xournal++: Create New Note"
→ Enter name (e.g., "meeting-notes")
→ Creates: meeting-notes.xopp + meeting-notes.pdf
→ Optionally opens in Xournal++
```

### Editing Workflow
1. **Open** `.xopp` in Xournal++ (right-click → Open in Xournal++)
2. **Write/draw** with pen/tablet/mouse
3. **Save** in Xournal++ (`Ctrl+S`)
4. **VS Code auto-exports** to PDF → PDF viewer updates instantly

### Viewing Notes in VS Code
- **PDF**: Right-click `.xopp` → **Open PDF** (uses VS Code's built-in PDF viewer)
- **Side-by-side**: Open `.xopp` and `.pdf` in split editors
- **Search**: `Ctrl+Shift+P` → **Xournal++: Search and Open Note**

### Tree View (Sidebar)
The "Xournal++ Notes" view shows:
- All `.xopp` files in workspace
- 🟢 Green = PDF exists | 🔴 Red = No PDF yet
- Click to open in Xournal++
- Right-click for more actions

---

## ⚙️ Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `xournalpp.sync.executablePath` | `""` (auto) | Full path to Xournal++ executable |
| `xournalpp.sync.autoExportOnSave` | `true` | Export to PDF when `.xopp` is saved |
| `xournalpp.sync.autoExportOnCreate` | `true` | Export to PDF when creating new note |
| `xournalpp.sync.exportNoRuling` | `false` | Hide grid/ruling lines in PDF (`--export-no-ruling`) |
| `xournalpp.sync.exportNoBackground` | `false` | Hide background PDF in export (`--export-no-background`) |
| `xournalpp.sync.templatePath` | `""` | Path to `.xopp` template for new notes |
| `xournalpp.sync.defaultFolder` | `""` | Default folder for new notes (relative to workspace) |
| `xournalpp.sync.notifications` | `"errors"` | Notification level: `all` / `errors` / `none` |

### Example `settings.json`
```json
{
  "xournalpp.sync.executablePath": "C:\\Program Files\\Xournal++\\xournalpp.exe",
  "xournalpp.sync.autoExportOnSave": true,
  "xournalpp.sync.exportNoRuling": true,
  "xournalpp.sync.templatePath": "${workspaceFolder}/templates/default.xopp",
  "xournalpp.sync.defaultFolder": "notes",
  "xournalpp.sync.notifications": "errors"
}
```

---

## 🎯 Commands

| Command | Palette Title | Keybinding | Context Menu |
|---------|---------------|------------|--------------|
| `xournalpp.openInXournalpp` | Open in Xournal++ | — | `.xopp`, `.pdf` |
| `xournalpp.createNewNote` | Create New Note | — | — |
| `xournalpp.exportToPdf` | Export to PDF | — | `.xopp` |
| `xournalpp.exportAllToPdf` | Export All Notes to PDF | — | — |
| `xournalpp.searchAndOpen` | Search and Open Note | — | — |
| `xournalpp.renameNote` | Rename Note (XOPP + PDF) | — | `.xopp` |
| `xournalpp.deleteNote` | Delete Note (XOPP + PDF) | — | `.xopp` |
| `xournalpp.openPdf` | Open Corresponding PDF | — | `.xopp`, `.pdf` |
| `xournalpp.configurePath` | Configure Xournal++ Path | — | — |

---

## 🔧 How It Works

```
┌─────────────┐     Save      ┌──────────────┐     Export      ┌─────────┐
│ Xournal++   │ ───────────▶ │ .xopp file   │ ─────────────▶ │ .pdf    │
│ (editing)   │               │ (gzipped XML)│  (xournalpp    │ (viewer)│
└─────────────┘               └──────────────┘   --create-pdf) └─────────┘
       ▲                            │                        │
       │                            ▼                        ▼
       └────────────────────── Auto-sync ◀────────────── VS Code
                         (FileSystemWatcher)
```

1. **File Watcher** monitors `**/*.xopp` for changes
2. On **save/create**, runs `xournalpp --create-pdf=out.pdf in.xopp`
3. **Debounced** (500ms) to handle rapid saves
4. **Concurrent limit** (5) prevents system overload
5. **Retries** (3x) with exponential backoff on failure

---

## 📁 Supported Formats

| Format | Read | Write | Preview |
|--------|------|-------|---------|
| `.xopp` | ✓ (via Xournal++) | ✓ (create) | — |
| `.pdf` | ✓ (VS Code) | ✓ (export) | ✓ (built-in) |

---

## 🐛 Troubleshooting

### "Xournal++ not found"
- Install Xournal++ and restart VS Code
- Or set `xournalpp.sync.executablePath` to full executable path
- Windows: `C:\Program Files\Xournal++\xournalpp.exe`
- Linux/macOS: `which xournalpp` → copy path

### Export fails silently
- Check **Output** panel → **Xournal++ Sync** for logs
- Ensure Xournal++ CLI works: `xournalpp --create-pdf=test.pdf your-note.xopp`
- Increase timeout for large files (not yet configurable)

### PDF doesn't update
- Run **Export to PDF** manually
- Check file permissions on workspace folder
- Verify `.xopp` and `.pdf` are in same directory

### Tree view doesn't appear
- Open a workspace folder containing `.xopp` files
- Run **Refresh** from Tree View title bar

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open Pull Request

### Development Setup
```bash
git clone https://github.com/kaikyvinicius/vscode-xournalpp-sync.git
cd vscode-xournalpp-sync
npm install
npm run compile
# Press F5 in VS Code to launch Extension Development Host
```

---

## 📝 Changelog

### 1.0.0 (Initial Release)
- Auto-export `.xopp` → `.pdf` on save/create
- Full CRUD: Create, Read, Update (rename), Delete (both files)
- Search & Open with fuzzy matching
- Tree View with PDF status indicators
- Context menus for `.xopp` and `.pdf` files
- Configurable Xournal++ path, export flags, templates
- Cross-platform: Windows, Linux, macOS

---

## 🙏 Credits

- **Xournal++** — Amazing handwriting app by [xournalpp/xournalpp](https://github.com/xournalpp/xournalpp)
- **Obsidian Xournal++ Plugin** — Inspiration by [jonjampen/obsidian-xournalpp](https://github.com/jonjampen/obsidian-xournalpp)
- **VS Code Extension API** — By Microsoft
- **Author** — [Kaiky Vinicius dos Santos](https://github.com/Kaiky-Santos-BR)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/kaikyvinicius/vscode-xournalpp-sync/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kaikyvinicius/vscode-xournalpp-sync/discussions)
- **Xournal++ Issues**: [xournalpp/xournalpp](https://github.com/xournalpp/xournalpp/issues)

---

<div align="center">
  <strong>Made with ❤️ for handwritten notes lovers</strong><br>
  <sub>If this helps you, consider ⭐ starring the repo!</sub>
</div>
