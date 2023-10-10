const vscode = require('vscode');
const getTemplate = require('../helpers/getTemplate');
const ContextProvider = require('../helpers/contextProvider');
const { Doc } = require('../models/doc');

class ViewerView {

    constructor() {
        this.viewerView = [];
    }

    dispose(doc_id) {
        delete this.viewerView[doc_id];
    }

    commands() {
        vscode.commands.registerCommand('snippeteam.doc.view', this.show, this);
    }

    show(doc_id) {

        if (this.viewerView[doc_id]) {
            this.viewerView[doc_id].reveal();
        } else {

            const doc = Doc.get(doc_id);
            if (doc) {

                this.viewerView[doc_id] = vscode.window.createWebviewPanel('snippeTeamHub', doc.title, vscode.ViewColumn.One, {
                    enableScripts: true,
                    retainContextWhenHidden: false
                });

                this.viewerView[doc_id].onDidDispose(() => this.dispose(doc_id));

                this.viewerView[doc_id].webview.onDidReceiveMessage(this.onDidReceiveMessage.bind(this));
                this.viewerView[doc_id].webview.html = getTemplate(ContextProvider.consume(), 'viewer.html', {
                    doc_id: doc_id,
                    css: this.viewerView[doc_id].webview.asWebviewUri(vscode.Uri.joinPath(ContextProvider.consume().extensionUri, 'src', 'templates', 'css', 'viewer.min.css')),
                    alpineJS: this.viewerView[doc_id].webview.asWebviewUri(vscode.Uri.joinPath(ContextProvider.consume().extensionUri, 'src', 'templates', 'js', 'alpineJS.js')),
                    hljs: this.viewerView[doc_id].webview.asWebviewUri(vscode.Uri.joinPath(ContextProvider.consume().extensionUri, 'src', 'templates', 'js', 'hljs.js')),
                });
            }

        }
    }

    onDidReceiveMessage(message) {
        switch (message.command) {
            case 'document_request':
                const doc_id = message.data;
                var doc = Doc.get(doc_id);
                doc = doc ? doc : Doc.Empty(doc_id);
                this.viewerView[doc_id].webview.postMessage({ command: 'document_response', data: doc.toJSON() });
                break;
        }
    }
}
module.exports = new ViewerView();