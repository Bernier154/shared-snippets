const { v4: uuidv4, } = require('uuid');

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


    toJSON() {
        return JSON.stringify({
            id: this.id,
            name: this.name,
            parent: this.parent,
            version: this.version,
        });
    }
} 