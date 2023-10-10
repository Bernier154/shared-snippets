const vscode = require('vscode');
const getTemplate = require('../helpers/getTemplate');
const ContextProvider = require('../helpers/contextProvider');

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

            this.viewerView[doc_id] = vscode.window.createWebviewPanel('snippeTeamHub', 'SnippeTeam Hub', vscode.ViewColumn.One, {
                enableScripts: true,
                retainContextWhenHidden: false
            });
            this.viewerView[doc_id].onDidDispose(() => this.dispose(doc_id));
            this.viewerView[doc_id].webview.html = getTemplate(ContextProvider.consume(), 'viewer.html', {
                json: doc_id
            });


        }
    }
}
module.exports = new ViewerView();