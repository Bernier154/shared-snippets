const vscode = require('vscode');
const fs = require('fs');
const path = require('path');


exports.getTemplate = (context, template, vars = {}) => {
    const filePath = vscode.Uri.file(path.join(context.extensionPath, 'src', 'webviews', template))
    return Object.keys(vars).reduce((html, key) => html.replace('{{' + key + '}}', vars[key]), fs.readFileSync(filePath.fsPath, 'utf8'));
}