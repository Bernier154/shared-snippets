const vscode = require('vscode');
const { getTemplate } = require('../helpers');


exports.HubWebView = class HubWebView {
    constructor(context) {
        this.registerHub(context);
    }

    registerHub(context) {
        this.createOrRevealHubWebView(context);
        vscode.commands.registerCommand('snippeteam.hub', () => { this.createOrRevealHubWebView(context); });
    }

    createOrRevealHubWebView(context) {
        if (this.hubWebView) {
            this.hubWebView.reveal();
        } else {
            this.hubWebView = vscode.window.createWebviewPanel('snippeTeamHub', 'SnippeTeam Hub', vscode.ViewColumn.One, {
                enableScripts: true,
                retainContextWhenHidden: true
            });
            this.hubWebView.onDidDispose(() => { this.hubWebView = null; });
            this.hubWebView.webview.html = getTemplate(context, 'hub.html', {
                alpineJS: this.hubWebView.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src/webviews/assets', 'alpineJS.js'))
            });
        }
    }





}