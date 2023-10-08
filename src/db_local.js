const vscode = require("vscode");
const fs = require("fs");
const { defaultConfigs } = require('./defaultConfigs.js');
const { Category } = require('./models/category.js');
const { Doc } = require("./models/doc.js");
const { DocStatus } = require("./enums/doc_status.js");


exports.DbLocal = class DbLocal {
    constructor(context) {
        const localFilePathConfig = vscode.workspace.getConfiguration('snippeteam').get('localPath');
        this.folderPath = fs.existsSync(localFilePathConfig) ? localFilePathConfig : defaultConfigs.localFilePath;
        this.jsonPath = this.folderPath + '/db.json';
        this.createJsonIfNotExists();
    }

    /**
     * Retourne le JSON de la BD
     * @returns {object}
     */
    getJSON() {
        return JSON.parse(fs.readFileSync(this.jsonPath, 'utf-8'));
    }

    saveJSON(jsonDB) {
        fs.writeFileSync(this.jsonPath, JSON.stringify(jsonDB));
    }

    createJsonIfNotExists() {
        if (!fs.existsSync(this.jsonPath)) {
            console.log('Creating ' + this.jsonPath)
            fs.writeFileSync(this.jsonPath, JSON.stringify({
                docs: {},
                categories: {},
                tags: {}
            }));
        }
    }

    // Categories

    /**
     * Retourne une catégorie par ID
     * @param {string} id 
     * @returns {Category|false}
     */
    getCategory(id) {
        const categoriesRaw = this.getJSON().categories;
        const category = Object.values(categoriesRaw).find(cat => Category.fromJSON(cat).id === id);
        return category !== undefined ? Category.fromJSON(category) : false;
    }

    /**
     * Retourne true si des documents sont associés a cette catégorie. 
     * @returns {boolean}
     */
    categoryHasDocs(id) {
        const docsRaw = this.getJSON().docs;
        return Object.values(docsRaw).some(doc => Doc.fromJSON(doc).category == id);
    }

    /**
     * Retourne les documents associés a cette catégorie. 
     * @param {string} id
     * @returns {Doc[]}
     */
    categoryDocs(id) {
        const docsRaw = this.getJSON().docs;
        if (id === '') {
            return Object.values(docsRaw).map(doc => Doc.fromJSON(doc)).filter(doc => doc.category == '').filter(doc => doc.status == DocStatus.Active);
        } else {
            return Object.values(docsRaw).map(doc => Doc.fromJSON(doc)).filter(doc => doc.category == id).filter(doc => doc.status == DocStatus.Active);
        }

    }

    categoryChild(id) {
        const catRaw = this.getJSON().categories;
        return Object.values(catRaw).map(cat => Category.fromJSON(cat)).filter(cat => cat.parent == id);
    }

    /**
     * Rtourne toutes les catégories
     * @returns {Category[]}
     */
    getAllCategories() {
        const categoriesRaw = this.getJSON().categories;
        return Object.values(categoriesRaw).map(categoryJSON => Category.fromJSON(categoryJSON));
    }


    /**
     * Sauvegarde la catégorie. S'occupe de la créer, ou de l'updater
     * @param {Category} category 
     */
    saveCategory(category) {
        const dbJSON = this.getJSON();
        dbJSON.categories[category.id] = category.toJSON();
        this.saveJSON(dbJSON);
    }

    deleteCategory(category) {
        const dbJSON = this.getJSON();
        delete dbJSON.categories[category.id];
        this.saveJSON(dbJSON);
    }

    // DOCUMENTS

    /**
     * Retourne un document par ID
     * @param {string} id 
     * @param {boolean} createEmpty 
     * @returns {Doc|false}
     */
    getDoc(id, createEmpty = false) {
        const docsRaw = this.getJSON().docs;
        const doc = Object.values(docsRaw).find(jsonDoc => Doc.fromJSON(jsonDoc).id === id);
        return doc !== undefined ? Doc.fromJSON(doc) : (createEmpty ? Doc.Empty(id) : false);
    }

    /**
     * Retourne tout les documents
     * @returns {Doc[]}
     */
    getAllDocs(withTrashed = false) {
        const docsRaw = this.getJSON().docs;
        if (withTrashed) {
            return Object.values(docsRaw).map(docJSON => Doc.fromJSON(docJSON));
        } else {
            return Object.values(docsRaw).map(docJSON => Doc.fromJSON(docJSON));
        }

    }

    docExists(id) {
        const docsRaw = this.getJSON().docs;
        return Object.values(docsRaw).some(cdoc => cdoc.id === id);
    }

    /**
     * Sauvegarde le document. S'occupe de le créer, ou de l'updater
     * @param {Doc} doc 
     */
    saveDoc(doc) {
        const dbJSON = this.getJSON();
        doc.modified_at = Date.now();
        dbJSON.docs[doc.id] = doc.toJSON();
        this.saveJSON(dbJSON);
    }

}