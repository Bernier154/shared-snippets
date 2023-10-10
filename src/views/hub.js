const vscode = require('vscode');
const getTemplate = require('../helpers/getTemplate');
const ContextProvider = require('../helpers/contextProvider');

class HubView {

    dispose() {
        delete this.hubWebView;
    }

    show() {
        if (this.hubWebView) {
            this.hubWebView.reveal();
        } else {

            this.hubWebView = vscode.window.createWebviewPanel('snippeTeamHub', 'SnippeTeam Hub', vscode.ViewColumn.One, {
                enableScripts: true,
                retainContextWhenHidden: true
            });
            this.hubWebView.onDidDispose(this.dispose.bind(this));

            ContextProvider.consume((context) => {
                this.hubWebView.webview.html = getTemplate(context, 'hub.html', {
                    alpineJS: this.hubWebView.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'templates', 'js', 'alpineJS.js'))
                });
            })

        }
    }
}
module.exports = new HubView();