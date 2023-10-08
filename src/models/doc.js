const { DocStatus } = require("../enums/doc_status");

exports.Doc = class Doc {
    constructor({
        id = '',
        title = '',
        status = DocStatus.Active,
        description = '',
        category = '',
        tags = [],
        files = [],
        version = 1,
        modified_at = Date.now(),
        created_at = Date.now()
    } = {}) {
        this.id = id;
        this.title = title;
        this.status = status;
        this.description = description;
        this.category = category;
        this.tags = tags;
        this.files = files;
        this.version = version;
        this.modified_at = modified_at;
        this.created_at = created_at;
    }

    static fromJSON(json) {
        json = typeof json == "string" ? JSON.parse(json) : json;
        return new Doc({
            id: json.id,
            title: json.title,
            status: json.status,
            description: json.description,
            category: json.category,
            tags: json.tags,
            files: json.files,
            version: json.version,
            modified_at: json.modified_at,
            created_at: json.created_at
        });
    }

    static Empty(id) {
        return new Doc({
            id: id,
        });
    }

    toJSON() {
        return JSON.stringify({
            id: this.id,
            title: this.title,
            status: this.status,
            description: this.description,
            category: this.category,
            tags: this.tags.map(tag => tag.toJSON()),
            files: this.files.map(file => file.toJSON()),
            version: this.version,
            modified_at: this.modified_at,
            created_at: this.created_at,
        });
    }
} 