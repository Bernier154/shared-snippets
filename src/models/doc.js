const vscode = require("vscode");
const DbRequest = require("../databaseAdapters/dbRequest");
const { DocStatus } = require("../enums/doc_status");
const DbProvider = require("../helpers/dbProvider");
const SidebarKey = require("../helpers/sidebarKey");
const EditorProvider = require("../helpers/editorProvider");
const { DocFile } = require("./docFile");

exports.Doc = class Doc {
    constructor({
        id = '',
        title = '',
        status = DocStatus.Active,
        description = '',
        category = '',
        tags = [],
        files = [],
        version = 1,
        modified_at = Date.now(),
        created_at = Date.now()
    } = {}) {
        this.id = id;
        this.title = title;
        this.status = status;
        this.description = description;
        this.category = category;
        this.tags = tags;
        this.files = files;
        this.version = version;
        this.modified_at = modified_at;
        this.created_at = created_at;
    }

    static fromJSON(json) {
        json = typeof json == "string" ? JSON.parse(json) : json;
        return new Doc({
            id: json.id,
            title: json.title,
            status: json.status,
            description: json.description,
            category: json.category,
            tags: json.tags,
            files: json.files.map(file => DocFile.fromJSON(file)),
            version: json.version,
            modified_at: json.modified_at,
            created_at: json.created_at
        });
    }

    static commands() {
        vscode.commands.registerCommand('snippeteam.doc.create', () => { EditorProvider.consume().show(); }, this);
        vscode.commands.registerCommand('snippeteam.doc.edit', (key) => { EditorProvider.consume().show(key.split(':')[1]); }, this);
        vscode.commands.registerCommand('snippeteam.doc.cat.changed', (doc_id, cat_id) => {
            EditorProvider.consume().documentUpdated(doc_id, 'category', cat_id);
        }, this);

        vscode.commands.registerCommand('snippeteam.doc.trash', (key) => {
            const doc = Doc.get(new SidebarKey(key).id);
            if (doc) {
                vscode.window.showWarningMessage('Voulez vous vraiment supprimer le document "' + doc.title + '"', 'Supprimer', 'Annuler').then(action => {
                    if (action === 'Supprimer') {
                        doc.status = DocStatus.Trashed;
                        doc.save();
                        EditorProvider.consume().documentUpdated(doc.id, 'status', DocStatus.Trashed);
                        EditorProvider.consume().documentUpdated(doc.id, 'category', '');
                        vscode.window.showInformationMessage('Document "' + doc.title + '" supprimée.');
                        vscode.commands.executeCommand('snippeteam.menu.reload');
                    }
                });

            }
        }, this);
        vscode.commands.registerCommand('snippeteam.doc.restore', (key) => {
            const doc = Doc.get(new SidebarKey(key).id);
            if (doc) {
                doc.status = DocStatus.Active;
                doc.category = '';
                doc.save();
                EditorProvider.consume().documentUpdated(doc.id, 'status', DocStatus.Active);
                EditorProvider.consume().documentUpdated(doc.id, 'category', '');

                vscode.window.showInformationMessage('Document "' + doc.title + '" restauré.');
                vscode.commands.executeCommand('snippeteam.menu.reload');
            }

        }, this);

        vscode.commands.registerCommand('snippeteam.doc.delete', (key) => {
            const doc = Doc.get(new SidebarKey(key).id);
            if (doc) {
                vscode.window.showWarningMessage('Voulez vous vraiment supprimer le document "' + doc.title + '" pour toujours?', 'Supprimer', 'Annuler').then(action => {
                    if (action === 'Supprimer') {
                        doc.delete();
                        EditorProvider.consume().documentDeleted(doc.id);
                        vscode.window.showInformationMessage('Document "' + doc.title + '" supprimée.');
                        vscode.commands.executeCommand('snippeteam.menu.reload');
                    }
                });

            }
        }, this);
    }

    static Empty(id) {
        return new Doc({
            id: id,
        });
    }

    static get(id) {
        const db = DbProvider.consume();
        const docJSON = db.query(DbRequest.select('docs').where('id', '==', id));
        if (docJSON) {
            return Doc.fromJSON(docJSON);
        }

        return false;
    }

    static uniqueTags() {
        const docs = Doc.all();
        return docs.reduce((tags, doc) => {
            return [...new Set([...doc.tags, ...tags])]
        }, []);
    }

    static all(where = [], withTrashed = false) {
        const db = DbProvider.consume();
        const query = DbRequest.selectAll('docs');
        where.forEach(clause => query.where(clause[0], clause[1], clause[2]))
        if (!withTrashed) {
            query.where('status', '!==', DocStatus.Trashed)
        }

        const docsJSON = db.query(query);

        if (docsJSON) {
            return docsJSON.map(docJson => Doc.fromJSON(docJson));
        }

        return false;
    }

    delete() {
        const db = DbProvider.consume();
        db.deleteEl('docs', this.id);
    }

    save() {
        const db = DbProvider.consume();
        db.updateEl('docs', this.id, this.toJSON());
    }

    toJSON() {
        return JSON.stringify({
            id: this.id,
            title: this.title,
            status: this.status,
            description: this.description,
            category: this.category,
            tags: this.tags,
            files: this.files.map(file => file.toJSON()),
            version: this.version,
            modified_at: this.modified_at,
            created_at: this.created_at,
        });
    }
} 