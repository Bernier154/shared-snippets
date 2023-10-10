const vscode = require('vscode')
const { v4: uuidv4, } = require('uuid');
const DbProvider = require('../helpers/dbProvider');
const DbRequest = require('../databaseAdapters/dbRequest');
const { Doc } = require('./doc');
const SidebarKey = require('../helpers/sidebarKey');

exports.Category = class Category {
    constructor({
        id = '',
        name = '',
        parent = '',
        version = 1
    } = {}) {
        this.id = id;
        this.name = name;
        this.parent = parent;
        this.version = version;
    }

    static fromJSON(json) {
        json = typeof json == "string" ? JSON.parse(json) : json;
        return new Category({
            id: json.id,
            name: json.name,
            parent: json.parent,
            version: json.version,
        });
    }

    static Empty() {
        return new Category({
            id: uuidv4(),
            name: 'nouvelle catégorie',
            parent: '',
            version: 1,
        });
    }

    static get(id) {
        const db = DbProvider.consume();
        const categoryJSON = db.query(DbRequest.select('categories').where('id', '==', id));
        if (categoryJSON) {
            return Category.fromJSON(categoryJSON);
        }

        return false;
    }

    static all(where = []) {
        const db = DbProvider.consume();
        const query = DbRequest.selectAll('categories');
        where.forEach(clause => query.where(clause[0], clause[1], clause[2]))
        const categoriesJSON = db.query(query);
        if (categoriesJSON && categoriesJSON.length > 0) {
            return categoriesJSON.map(catJson => Category.fromJSON(catJson));
        }

        return false;
    }

    static commands() {

        vscode.commands.registerCommand('snippeteam.cat.create', () => vscode.window.showInputBox({ title: 'Créer une catégorie', prompt: 'Entrer le nom de la catégorie.', validateInput: (value) => value == '' ? 'Veillez entrer un nom de catégorie' : '' })
            .then(catName => {
                if (catName) {
                    const category = Category.Empty();
                    category.name = catName;
                    category.save();
                    vscode.commands.executeCommand('snippeteam.menu.reload');
                }
            }), this);

        vscode.commands.registerCommand('snippeteam.cat.delete', (key) => {
            const category = Category.get(new SidebarKey(key).id);
            if (category) {
                vscode.window.showWarningMessage('Voulez vous vraiment supprimer la catégorie "' + category.name + '"', 'Supprimer', 'Annuler').then(action => {
                    if (action === 'Supprimer') {
                        category.delete()
                        vscode.window.showInformationMessage('Catégorie "' + category.name + '" supprimée.');
                        vscode.commands.executeCommand('snippeteam.menu.reload');
                    }
                });
            }
        }, this);
        vscode.commands.registerCommand('snippeteam.cat.rename', (key) => {
            const category = Category.get(new SidebarKey(key).id);
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
                        category.save();
                        vscode.commands.executeCommand('snippeteam.menu.reload');
                    }
                });
            }
        }, this);
    }

    getChild() {
        const db = DbProvider.consume();
        const categoryJSON = db.query(DbRequest.selectAll('categories').where('parent', '==', this.id));

        if (categoryJSON && categoryJSON.length > 0) {
            return categoryJSON.map(x => Category.fromJSON(x));
        }

        return []
    }

    getDocs() {
        const db = DbProvider.consume();
        const docJSON = db.query(DbRequest.selectAll('docs').where('category', '==', this.id));

        if (docJSON && docJSON.length > 0) {
            return docJSON.map(x => Doc.fromJSON(x));
        }

        return [];
    }

    delete() {
        const db = DbProvider.consume();
        const children = this.getChild();
        (children ? children : []).map(cat => {
            cat.parent = this.parent;
            cat.save();
        })
        const docs = this.getDocs();
        (docs ? docs : []).forEach(doc => {
            doc.category = this.parent;
            doc.save();
        });
        db.deleteEl('categories', this.id);
    }

    save() {
        const db = DbProvider.consume();
        db.updateEl('categories', this.id, this.toJSON());
    }


    toJSON() {
        return JSON.stringify({
            id: this.id,
            name: this.name,
            parent: this.parent,
            version: this.version,
        });
    }
} 