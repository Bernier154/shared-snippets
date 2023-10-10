const vscode = require('vscode');
const getTemplate = require('../helpers/getTemplate');
const ContextProvider = require('../helpers/contextProvider');
const { Doc } = require('../models/doc');
const { v4: uuidv4, } = require('uuid');

class EditorView {

    constructor() {
        this.editorViews = [];

    }

    dispose(doc_id) {
        delete this.editorViews[doc_id];
    }

    documentUpdated(doc_id, key, val) {
        if (this.editorViews[doc_id]) {
            const obj = {};
            obj[key] = val;
            this.editorViews[doc_id].webview.postMessage({ command: 'document_updated', data: obj });
        }
    }

    documentDeleted(doc_id) {
        if (this.editorViews[doc_id]) {
            this.editorViews[doc_id].dispose();
        }
    }

    show(doc_id) {

        let title = 'Nouveau document';
        const doc = Doc.get(doc_id);
        if (!doc) {
            doc_id = uuidv4();
        } else {
            title = doc.title;
        }

        if (this.editorViews[doc_id]) {
            this.editorViews[doc_id].reveal();
        } else {

            this.editorViews[doc_id] = vscode.window.createWebviewPanel('docEdit' + doc_id, title, vscode.ViewColumn.One, {
                enableScripts: true,
                retainContextWhenHidden: true
            });
            this.editorViews[doc_id].onDidDispose(() => this.dispose(doc_id));



            this.editorViews[doc_id].webview.onDidReceiveMessage(this.onDidReceiveMessage.bind(this), undefined, ContextProvider.consume().subscription);
            this.editorViews[doc_id].webview.html = getTemplate(ContextProvider.consume(), 'edit.html', {
                doc_id: doc_id,
                css: this.editorViews[doc_id].webview.asWebviewUri(vscode.Uri.joinPath(ContextProvider.consume().extensionUri, 'src', 'templates', 'css', 'editor.min.css')),
                alpineJS: this.editorViews[doc_id].webview.asWebviewUri(vscode.Uri.joinPath(ContextProvider.consume().extensionUri, 'src', 'templates', 'js', 'alpineJS.js')),
                monacoCss: this.editorViews[doc_id].webview.asWebviewUri(vscode.Uri.joinPath(ContextProvider.consume().extensionUri, 'node_modules', 'monaco-editor', 'min', 'vs', 'editor', 'editor.main.css')),
                monacoJsLoader: this.editorViews[doc_id].webview.asWebviewUri(vscode.Uri.joinPath(ContextProvider.consume().extensionUri, 'node_modules', 'monaco-editor', 'min', 'vs', 'loader.js')),
                monacoVsFolder: this.editorViews[doc_id].webview.asWebviewUri(vscode.Uri.joinPath(ContextProvider.consume().extensionUri, 'node_modules', 'monaco-editor', 'min', 'vs')),
                tagsInputs: this.editorViews[doc_id].webview.asWebviewUri(vscode.Uri.joinPath(ContextProvider.consume().extensionUri, 'src', 'templates', 'js', 'tags-inputs.js')),
            });


        }
    }

    onDidReceiveMessage(message) {
        switch (message.command) {
            case 'document_request':
                const doc_id = message.data;
                var doc = Doc.get(doc_id);
                doc = doc ? doc : Doc.Empty(doc_id);
                this.editorViews[doc_id].webview.postMessage({ command: 'document_response', data: doc.toJSON() });
                break;
            case 'document_save':
                var saveDoc = Doc.fromJSON(message.data.doc);
                if (saveDoc) {
                    saveDoc.modified_at = Date.now();
                    saveDoc.save();
                    this.editorViews[message.data.doc_id].webview.postMessage({ command: 'document_saved', data: { modified_at: saveDoc.modified_at } });
                    this.editorViews[message.data.doc_id].title = saveDoc.title;
                    vscode.commands.executeCommand('snippeteam.menu.reload');
                }

                break;
            case 'showInformationMessage':
                vscode.window.showInformationMessage(message.data);
                break;
        }
    }
}
module.exports = new EditorView();