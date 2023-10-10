const vscode = require('vscode');
const fs = require('fs');
const defaultConfigs = require('../defaultConfigs');

module.exports = class dbLocal {

    constructor() {
        const localFilePathConfig = vscode.workspace.getConfiguration('snippeteam').get('localPath');
        this.folderPath = fs.existsSync(localFilePathConfig) ? localFilePathConfig : defaultConfigs.localFilePath;
        this.jsonPath = this.folderPath + '/db.json';
        this.createJsonIfNotExists();
    }

    createJsonIfNotExists() {
        if (!fs.existsSync(this.jsonPath)) {
            console.log('Creating ' + this.jsonPath)
            fs.writeFileSync(this.jsonPath, JSON.stringify({
                docs: {},
                categories: {}
            }));
        }
    }

    getJSON() {
        return JSON.parse(fs.readFileSync(this.jsonPath, 'utf-8'));
    }

    saveJSON(jsonDB) {
        fs.writeFileSync(this.jsonPath, JSON.stringify(jsonDB));
    }

    keyExists(type, key) {
        const dbJSON = this.getJSON();
        const typeJSON = dbJSON[type];
        return Object.keys(typeJSON).includes(key);
    }

    updateEl(type, key, value) {
        const dbJSON = this.getJSON();
        dbJSON[type][key] = value;
        this.saveJSON(dbJSON);
    }

    deleteEl(type, key) {
        const dbJSON = this.getJSON();
        delete dbJSON[type][key];
        this.saveJSON(dbJSON);
    }

    query(dbRequest) {
        const dbJSON = this.getJSON();
        const typeJSON = dbJSON[dbRequest.type];
        let results = Object.values(typeJSON).map(x => JSON.parse(x));

        if (dbRequest.whereArr.length > 0) {
            results = dbRequest.whereArr.reduce((curResult, whereClause) => {
                return curResult.filter((object) => {
                    switch (whereClause[1]) {
                        case '==':
                            return object[whereClause[0]] == whereClause[2]
                        case '===':
                            return object[whereClause[0]] === whereClause[2]
                        case '!=':
                            return object[whereClause[0]] != whereClause[2]
                        case '!==':
                            return object[whereClause[0]] !== whereClause[2]
                        case '>=':
                            return object[whereClause[0]] >= whereClause[2]
                        case '>':
                            return object[whereClause[0]] > whereClause[2]
                        case '<=':
                            return object[whereClause[0]] <= whereClause[2]
                        case '<':
                            return object[whereClause[0]] < whereClause[2]
                        case 'includes':
                            return object[whereClause[0]].includes(whereClause[2])
                    }
                });
            }, results);
        }

        if (results.length == 0) {
            return false;
        }

        if (dbRequest.single) {
            return results[0];
        } else {
            return results;
        }

    }

}