const vscode = require('vscode');
const { Category } = require('../models/category');
const { DocStatus } = require('../enums/doc_status');



exports.SnippetsSidebar = class SnippetsSidebar {

    /**
     * 
     * @param {vscode.ExtensionContext} context 
     * @param {object} db 
     */
    constructor(context, db) {
        this.db = db;
        this.context = context;
        this.build();


        vscode.commands.registerCommand('snippeteam.cat.quickCreate', this.createCategory, this);
        vscode.commands.registerCommand('snippeteam.cat.delete', this.deleteCategory, this);
        vscode.commands.registerCommand('snippeteam.cat.rename', this.renameCategory, this);
        vscode.commands.registerCommand('snippeteam.menu.reload', () => this.build(), this);
    }

    build() {
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
        this.context.subscriptions.push(this.sidebar);
    }

    createCategory() {
        vscode.window.showInputBox({
            title: 'Créer une catégorie',
            prompt: 'Entrer le nom de la catégorie.',
            value: "",
            validateInput: (value) => {
                if (value == "") {
                    return 'Veillez entrer un nom de catégorie';
                }
                return '';
            }
        }).then(newName => {
            if (newName) {
                const category = Category.Empty();
                category.name = newName;
                this.db.saveCategory(category);
                vscode.commands.executeCommand('snippeteam.menu.reload');
            }
        });
    }

    deleteCategory(key) {
        const keyArr = key.split(':');
        const category = this.db.getCategory(keyArr[1]);
        if (category) {
            vscode.window.showWarningMessage('Voulez vous vraiment supprimer la catégorie "' + category.name + '"', 'Supprimer', 'Annuler').then(action => {
                if (action === 'Supprimer') {
                    // Check if cat has children -> children will get this cat parent. 
                    this.db.categoryChild(category.id).forEach(cat => {
                        cat.parent = category.parent;
                        this.db.saveCategory(cat);
                    });
                    this.db.categoryDocs(category.id).forEach(doc => {
                        doc.category = category.parent;
                        this.db.saveDoc(doc);
                    });

                    this.db.deleteCategory(category);
                    vscode.window.showInformationMessage('Catégorie "' + category.name + '" supprimée.');
                    vscode.commands.executeCommand('snippeteam.menu.reload');
                }
            });

        }
    }

    renameCategory(key) {
        const keyArr = key.split(':');
        const category = this.db.getCategory(keyArr[1]);
        if (category) {
            vscode.window.showInputBox({
                title: 'Renommer la catégorie',
                prompt: 'Entrer le nom de la catégorie.',
                value: category.name,
                validateInput: (value) => {
                    if (value == "") {
                        return 'Veillez entrer un nom de catégorie';
                    }
                    return '';
                }
            }).then(newName => {
                if (newName) {
                    category.name = newName;
                    this.db.saveCategory(category);
                    vscode.commands.executeCommand('snippeteam.menu.reload');
                }
            });

        }
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
                        const category = this.db.getCategory(viewItem[1]);
                        if (category && (category.id !== target[1])) {
                            category.parent = target[1];
                            this.db.saveCategory(category);
                            vscode.commands.executeCommand('snippeteam.menu.reload');
                        }

                    } else if (viewItem[0] == 'doc' && target[0] == 'cat') {
                        const doc = this.db.getDoc(viewItem[1]);
                        if (doc) {
                            doc.category = target[1];
                            this.db.saveDoc(doc);
                            this.sidebar.reveal()
                            vscode.commands.executeCommand('snippeteam.menu.reload');
                        }
                    } else if (viewItem[0] == 'doc' && (target[0] == 'section' && target[1] == 'uncategorized')) {
                        const doc = this.db.getDoc(viewItem[1]);
                        if (doc) {
                            doc.category = "";
                            this.db.saveDoc(doc);
                            this.sidebar.reveal()
                            vscode.commands.executeCommand('snippeteam.menu.reload');
                        }
                    } else if (viewItem[0] == 'cat' && (target[0] == 'section' && target[1] == 'categories')) {
                        const category = this.db.getCategory(viewItem[1]);
                        category.parent = '';
                        if (category) {
                            this.db.saveCategory(category);
                            vscode.commands.executeCommand('snippeteam.menu.reload');
                        }
                    }
                }
            }
        }
    }

    /**
     * Render la représentation en tant qu'item. Se fie a sa clée pour choisir le type d'élément a créer
     * @param {string} key 
     * @returns 
     */
    getTreeItem(key) {

        const keyArr = key.split(':');
        if (keyArr.length > 1) {
            switch (keyArr[0]) {
                case 'webview':
                    return this.webviewTreeElement(keyArr[1]);
                case 'section':
                    return this.sectionTreeElement(keyArr[1]);
                case 'cat':
                    return this.catTreeElement(keyArr[1]);
                case 'doc':
                    return this.docTreeElement(keyArr[1]);
            }
        }
    }

    getParent(key) {

        const keyArr = key.split(':');
        if (keyArr.length > 1) {
            switch (keyArr[0]) {
                case 'cat':
                    const category = this.db.getCategory(keyArr[1]);
                    if (category && category.parent !== '') {
                        return 'cat:' + category.parent
                    }
                case 'doc':
                    const doc = this.db.getDoc(keyArr[1]);
                    if (doc && doc.category !== '') {
                        return 'cat:' + doc.category;
                    }
            }
        }
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
        const category = this.db.getCategory(id);
        if (category) {
            return {
                id: category.id,
                label: category.name,
                collapsibleState: this.db.categoryHasDocs(category.id) ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.Collapsed,
                contextValue: 'categoryItem'
            };
        }
    }

    docTreeElement(id) {
        const doc = this.db.getDoc(id);
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
                    id: doc.id,
                    label: doc.title,
                    collapsibleState: vscode.TreeItemCollapsibleState.None,
                    contextValue: 'docItem'

                };
            }
        }
    }


    /**
     * retourne les enfants d'un item
     * @param {string} key 
     * @returns 
     */
    getChildren(key) {
        // Si pas de key, on retourne les élément principaux
        if (!key) { return ['webview:hub', 'section:trashed', 'section:categories', 'section:tags']; }


        const keyArr = key.split(':');
        switch (keyArr[0]) {
            case 'section':
                switch (keyArr[1]) {
                    case 'categories':
                        const categories = this.db.getAllCategories();
                        return [...categories.filter(cat => cat.parent == '').map(cat => 'cat:' + cat.id), 'section:uncategorized'];
                    case 'uncategorized':
                        return [...this.db.categoryDocs('').map(doc => 'doc:' + doc.id)]
                    case 'trashed':
                        const docs = this.db.getAllDocs();
                        return [...docs.filter(doc => doc.status == DocStatus.Trashed).map(doc => 'doc:' + doc.id)];
                    case 'tags':
                        break;
                }
                break;
            case 'cat':
                const category = this.db.getCategory(keyArr[1]);
                if (category) {
                    return [
                        ...this.db.categoryChild(category.id).map(cat => 'cat:' + cat.id),
                        ...this.db.categoryDocs(category.id).map(doc => 'doc:' + doc.id)
                    ]
                }
                break;
        }
        console.log('unhandled parent type in treeView: ' + keyArr[0] + ' : ' + keyArr[1])
    }

}
