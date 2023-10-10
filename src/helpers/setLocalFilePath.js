const vscode = require('vscode');

module.exports = () => {
    vscode.window.showOpenDialog({
        openLabel: 'Choisir ce dossier',
        canSelectFiles: false,
        canSelectFolders: true,
        title: 'Choisir le dossier de base de donnée'
    }).then(value => {
        if (value) {
            vscode.workspace.getConfiguration('snippeteam').update('databaseAdapter.local.localPath', value[0].path);
            vscode.window.showInformationMessage('Chemin de base de donnée changé pour "' + value[0].path + '"');
        }
    })
}