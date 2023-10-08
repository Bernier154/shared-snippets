const vscode = require('vscode');
const { getTemplate } = require('../helpers');
const { v4: uuidv4, } = require('uuid');
const { Doc } = require('../models/doc');
const { DocStatus } = require('../enums/doc_status');

exports.DocEditView = class DocEditView {
    constructor(context, db) {
        this.db = db;
        this.views = {};
        vscode.commands.registerCommand('snippeteam.doc.create', () => { this.createOrRevealDocEditView(context,); }, this);
        vscode.commands.registerCommand('snippeteam.doc.edit', (key) => { this.createOrRevealDocEditView(context, key.split(':')[1]); }, this);
        vscode.commands.registerCommand('snippeteam.doc.delete', this.deleteDocument, this);
        vscode.commands.registerCommand('snippeteam.doc.restore', this.restoreDocument, this);
    }

    restoreDocument(key) {
        const keyArr = key.split(':');
        const doc = this.db.getDoc(keyArr[1]);
        doc.status = DocStatus.Active;
        doc.category = '';
        this.db.saveDoc(doc);
        vscode.window.showInformationMessage('Document "' + doc.title + '" restauré.');
        vscode.commands.executeCommand('snippeteam.menu.reload');
    }

    deleteDocument(key) {
        const keyArr = key.split(':');
        const doc = this.db.getDoc(keyArr[1]);
        if (doc) {
            vscode.window.showWarningMessage('Voulez vous vraiment supprimer le document "' + doc.title + '"', 'Supprimer', 'Annuler').then(action => {
                if (action === 'Supprimer') {
                    doc.status = DocStatus.Trashed;
                    this.db.saveDoc(doc);
                    vscode.window.showInformationMessage('Document "' + doc.title + '" supprimée.');
                    vscode.commands.executeCommand('snippeteam.menu.reload');
                }
            });

        }
    }

    createOrRevealDocEditView(context, doc_id = undefined) {
        let title = 'Nouveau document';
        if (!doc_id) {
            doc_id = uuidv4();
        } else {
            title = this.db.getDoc(doc_id).title;
        }
        if (this.views[doc_id]) {
            this.views.reveal();
        } else {
            this.views[doc_id] = vscode.window.createWebviewPanel('docEdit' + doc_id, title, vscode.ViewColumn.One, {
                enableScripts: true,
                retainContextWhenHidden: true
            });
            this.views[doc_id].webview.onDidReceiveMessage(this.onDidReceiveMessage.bind(this), undefined, context.subscription);
            this.views[doc_id].onDidDispose(() => { this.views[doc_id] = undefined; });
            this.views[doc_id].webview.html = getTemplate(context, 'edit.html', {
                doc_id: doc_id,
                alpineJS: this.views[doc_id].webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src/webviews/assets', 'alpineJS.js'))
            });
        }
    }

    onDidReceiveMessage(message) {
        switch (message.command) {
            case 'document_request':
                const doc_id = message.data;
                this.views[doc_id].webview.postMessage({ command: 'document_response', data: this.db.getDoc(doc_id, true).toJSON() });
                break;
            case 'document_save':
                this.db.saveDoc(Doc.fromJSON(message.data.doc))
                this.views[message.data.doc_id].webview.postMessage({ command: 'document_saved', data: {} });
                this.views[message.data.doc_id].title = Doc.fromJSON(message.data.doc).title;
                vscode.commands.executeCommand('snippeteam.menu.reload');
                break;
            case 'showInformationMessage':
                vscode.window.showInformationMessage(message.data);
                break;
        }
    }

}