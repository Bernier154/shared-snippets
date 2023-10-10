const vscode = require('vscode');
const contextProvider = require('../helpers/contextProvider');
const SidebarKey = require('../helpers/sidebarKey');
const { Category } = require('../models/category');
const { Doc } = require('../models/doc');
const { DocStatus } = require('../enums/doc_status');
const getTemplate = require('../helpers/getTemplate');

module.exports = class SidebarView {
    constructor() {
        this.build();
        this.buildSearch();
        vscode.commands.registerCommand('snippeteam.menu.reload', () => this.build(), this);
    }


    buildSearch() {
        const context = contextProvider.consume();

        this.searchView = vscode.window.registerWebviewViewProvider('snippeTeamSearch', {
            resolveWebviewView: (webviewView, _context, _token) => {
                this.searchView = webviewView;
                webviewView.webview.options = {
                    enableScripts: true,
                };
                webviewView.webview.html = getTemplate(context, 'search.html', {});
                webviewView.title = "Recherche"
                webviewView.show(true)

            }
        })
        context.subscriptions.push(this.searchView);
    }

    build() {
        const context = contextProvider.consume();
        this.sidebar = vscode.window.createTreeView(
            'snippeTeamMenu',
            {
                treeDataProvider: {
                    getChildren: this.getChildren.bind(this),
                    getTreeItem: this.getTreeItem.bind(this),
                    getParent: this.getParent.bind(this),
                },
                showCollapseAll: true,
                dragAndDropController: {
                    dropMimeTypes: ['viewitem'],
                    dragMimeTypes: ['viewitem'],
                    handleDrag: (source, dataTransfer) => this.dragAndDropController('drag', source[0], dataTransfer),
                    handleDrop: (target, dataTransfer) => this.dragAndDropController('drop', target, dataTransfer),
                },
            }
        );
        this.sidebar.title = 'SnippeTeam';

        context.subscriptions.push(this.sidebar);

    }

    dragAndDropController(type, key, dataTransfer) {
        if (type == 'drag') {
            const keyArr = key.split(':');
            if (keyArr.length == 2) {
                if (keyArr[0] == 'cat' || keyArr[0] == 'doc' || keyArr[0] == 'section') {
                    dataTransfer.set('viewItem', { value: key, asFile: () => null, asString: async () => null });
                }
            }
        } else if (type == 'drop') {
            const target = key.split(':');
            if (target.length == 2 && (target[0] == 'cat' || target[0] == 'doc' || target[0] == 'section')) {
                let viewItem = dataTransfer.get('viewItem');
                if (viewItem) {
                    viewItem = viewItem.value.split(':');
                    if (viewItem[0] == 'cat' && target[0] == 'cat') {
                        const category = Category.get(viewItem[1]);
                        if (category && (category.id !== target[1])) {
                            category.parent = target[1];
                            category.save();
                            vscode.commands.executeCommand('snippeteam.menu.reload');
                        }

                    } else if (viewItem[0] == 'doc' && target[0] == 'cat') {
                        const doc = Doc.get(viewItem[1]);
                        if (doc) {
                            doc.category = target[1];
                            doc.save();
                            vscode.commands.executeCommand('snippeteam.doc.cat.changed', doc.id, target[1]);
                            vscode.commands.executeCommand('snippeteam.menu.reload');
                            this.sidebar.reveal(viewItem[0] + ':' + viewItem[1]);
                        }
                    } else if (viewItem[0] == 'doc' && (target[0] == 'section' && target[1] == 'uncategorized')) {
                        const doc = Doc.get(viewItem[1]);
                        if (doc) {
                            doc.category = "";
                            doc.save();
                            vscode.commands.executeCommand('snippeteam.doc.cat.changed', doc.id, "");
                            vscode.commands.executeCommand('snippeteam.menu.reload');
                        }
                    } else if (viewItem[0] == 'cat' && (target[0] == 'section' && target[1] == 'categories')) {
                        const category = Category.get(viewItem[1]);
                        if (category && (category.id !== target[1])) {
                            category.parent = '';
                            category.save();
                            vscode.commands.executeCommand('snippeteam.menu.reload');
                        }
                    }
                }
            }
        }
    }

    getChildren(key) {
        // Si pas de key, on retourne les élément principaux
        if (!key) { return ['webview:hub', 'section:trashed', 'section:categories', 'section:tags']; }
        const sidebarKey = new SidebarKey(key);
        switch (sidebarKey.key) {
            case 'section':
                switch (sidebarKey.id) {
                    case 'categories':
                        var categories = Category.all([['parent', '==', '']]);
                        return [
                            ...(categories ? categories : []).map(cat => 'cat:' + cat.id),
                            'section:uncategorized'
                        ];
                    case 'uncategorized':
                        var docs = Doc.all([['category', '==', '']]);
                        return docs ? docs.map(doc => 'doc:' + doc.id) : false;
                    case 'trashed':
                        var docs = Doc.all([['status', '===', DocStatus.Trashed]], true);
                        return docs ? [...docs.map(doc => 'doc:' + doc.id)] : false;
                    case 'tags':
                        var tags = Doc.uniqueTags();
                        return tags.map(x => 'tag:' + x);
                }
                break;
            case 'cat':
                const category = Category.get(sidebarKey.id);
                if (category) {
                    return [
                        ...category.getChild().map(cat => 'cat:' + cat.id),
                        ...category.getDocs().map(doc => 'doc:' + doc.id)
                    ]
                }
                break;
            case 'tag':
                var docs = Doc.all([['tags', 'includes', sidebarKey.id]]);
                if (docs) {
                    return docs ? docs.map(doc => 'doc:' + doc.id + ":" + sidebarKey.id) : false;
                }
                break;
        }
    }

    getParent(key) {
        const keyArr = key.split(':');
        if (keyArr.length > 1) {
            switch (keyArr[0]) {
                case 'cat':
                    const category = Category.get(keyArr[1]);
                    if (category && category.parent !== '') {
                        return 'cat:' + category.parent
                    }
                case 'doc':
                    const doc = Doc.get(keyArr[1]);
                    if (doc && doc.category !== '') {
                        return 'cat:' + doc.category;
                    }
            }
        }
    }

    getTreeItem(key) {
        const sidebarKey = new SidebarKey(key);
        switch (sidebarKey.key) {
            case 'webview':
                return this.webviewTreeElement(sidebarKey.id);
            case 'section':
                return this.sectionTreeElement(sidebarKey.id);
            case 'cat':
                return this.catTreeElement(sidebarKey.id);
            case 'doc':
                return this.docTreeElement(sidebarKey.id, sidebarKey.arg);
            case 'tag':
                return this.tagTreeElement(sidebarKey.id);
        }
    }

    sectionTreeElement(name) {
        switch (name) {
            case 'categories':
                return {
                    iconPath: new vscode.ThemeIcon('folder'),
                    label: 'Catégories',
                    collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
                    contextValue: 'categories'
                }
            case 'tags':
                return {
                    iconPath: new vscode.ThemeIcon('bookmark'),
                    label: 'Tags',
                    collapsibleState: vscode.TreeItemCollapsibleState.Expanded
                }
            case 'uncategorized':
                return {
                    label: 'Non catégorisés',
                    collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,

                };
            case 'trashed':
                return {
                    iconPath: new vscode.ThemeIcon('trash'),
                    label: 'Corbeille',
                    collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,

                };

        }
    }


    catTreeElement(id) {
        const category = Category.get(id);
        if (category) {
            return {
                id: category.id,
                label: category.name,
                collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                contextValue: 'categoryItem'
            };
        }
    }

    docTreeElement(id, tag = '') {
        const doc = Doc.get(id);
        if (doc) {
            if (doc.status == DocStatus.Trashed) {
                return {
                    id: doc.id,
                    label: doc.title,
                    collapsibleState: vscode.TreeItemCollapsibleState.None,
                    contextValue: 'docItemTrashed'

                };
            } else {
                return {
                    id: doc.id + tag,
                    label: doc.title,
                    collapsibleState: vscode.TreeItemCollapsibleState.None,
                    contextValue: 'docItem',
                    command: { command: 'snippeteam.doc.view', arguments: [id] },

                };
            }
        }
    }
    tagTreeElement(name) {
        return {
            id: name,
            label: name,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: 'tagItem'

        };
    }

    webviewTreeElement(name) {
        switch (name) {
            case 'hub':
                return {
                    iconPath: new vscode.ThemeIcon('home'),
                    label: 'Hub',
                    command: { command: 'snippeteam.hub' },
                }
        }
    }

}

