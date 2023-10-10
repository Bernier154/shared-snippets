const vscode = require('vscode');
const dbLocal = require("./databaseAdapters/dbLocal");
const checkDefaultAppdataFolder = require("./helpers/checkDefaultAppdataFolder");
const HubView = require("./views/hub");
const ContextProvider = require('./helpers/contextProvider');
const SidebarView = require('./views/sidebar');
const DbProvider = require('./helpers/dbProvider');
const { Doc } = require('./models/doc');
const { Category } = require('./models/category');
const ViewerView = require('./views/viewer');
const EditorView = require('./views/editor');
const EditorProvider = require('./helpers/editorProvider');
const setLocalFilePath = require('./helpers/setLocalFilePath');

module.exports = class SnippeTeam {

    constructor(context) {
        console.info('Initializing SnippeTeam');
        this.context = context;
        ContextProvider.provide(context);
        checkDefaultAppdataFolder();
        this.db = this.getDatabaseAdapter();
        DbProvider.provide(this.db);
        this.sidebar = new SidebarView();
        this.editor = EditorView;
        EditorProvider.provide(this.editor);
        this.registerCommands();
    }

    registerCommands() {
        vscode.commands.registerCommand('snippeteam.hub', () => { HubView.show() });
        vscode.commands.registerCommand('snippeteam.set.localFilePath', () => setLocalFilePath());
        Doc.commands();
        Category.commands();
        ViewerView.commands();
    }

    getDatabaseAdapter() {
        switch (vscode.workspace.getConfiguration('snippeteam').get('databaseAdapter')) {
            case 'local':
                return new dbLocal()
        }
    }

}