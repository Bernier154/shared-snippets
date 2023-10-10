const vscode = require('vscode');
const fs = require('fs');
const path = require('path');


module.exports = (context, template, vars = {}) => {
    const filePath = vscode.Uri.file(path.join(context.extensionPath, 'src', 'templates', template));
    console.info('Getting template at "' + filePath + '"');
    return Object.keys(vars).reduce((html, key) => html.replace('{{' + key + '}}', vars[key]), fs.readFileSync(filePath.fsPath, 'utf8'));
}