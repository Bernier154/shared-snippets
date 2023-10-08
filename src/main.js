const vscode = require('vscode');
const { checkDefaultAppdataFolder } = require('./init');
const { SnippetsSidebar } = require('./views/snippetsSidebar');
const { HubWebView } = require('./views/hubWebView');
const { DbLocal } = require('./db_local.js');
const { DocEditView } = require('./views/docEditView');


exports.activate = (context) => {
	checkDefaultAppdataFolder();
	let db;
	switch (vscode.workspace.getConfiguration('snippeteam').get('databaseAdapter')) {
		case 'local':
			db = new DbLocal(context);
			break;
	}
	new DocEditView(context, db);
	new HubWebView(context);
	new SnippetsSidebar(context, db);


}

exports.deactivate = () => { }