exports.DocFile = class DocFile {
    constructor({
        name = 'file.js',
        language = 'javascript',
        version = 1
    } = {}) {
        this.name = name;
        this.language = language;
        this.version = version;
    }

    toJSON() {
        return JSON.stringify({
            name: this.name,
            language: this.language,
            version: this.version,
        });
    }
} 