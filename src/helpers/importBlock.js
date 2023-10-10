const vscode = require('vscode');
const { Doc } = require('../models/doc');

exports.selectBlock = () => {
    const docs = Doc.all();
    if (docs) {
        vscode.window.showQuickPick(docs.map(x => x.title)).then(doc_name => {
            const doc = Doc.getByTitle(doc_name);
            if (doc) {
                vscode.window.showQuickPick(doc.files.map(x => x.name)).then(filename => {
                    if (filename) {
                        const content = doc.files.find(x => x.name == filename).content
                        vscode.commands.executeCommand('snippeteam.insert.block', content);
                    }
                })
            }
        })
    }

}

exports.insertBlock = (editor, edit, content) => {
    editor.selections.forEach((selection) => {
        edit.insert(selection.active, content);  // insert at current cursor
    })
}