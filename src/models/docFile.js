exports.DocFile = class DocFile {
    constructor({
        id = '',
        name = 'file.js',
        language = 'javascript',
        content = '',
        version = 1
    } = {}) {
        this.id = id;
        this.name = name;
        this.language = language;
        this.content = content;
        this.version = version;
    }

    static fromJSON(json) {
        json = typeof json == "string" ? JSON.parse(json) : json;
        return new DocFile({
            id: json.id,
            name: json.name,
            language: json.language,
            content: json.content,
            version: json.version,
        });
    }

    toJSON() {
        return JSON.stringify({
            id: this.id,
            name: this.name,
            language: this.language,
            content: this.content,
            version: this.version,
        });
    }
} 