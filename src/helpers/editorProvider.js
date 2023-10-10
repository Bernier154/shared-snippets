const EventEmitter = require('node:events');

class EditorProvider extends EventEmitter {
    consume() {
        return this.editor
    }

    provide(editor) {
        this.editor = editor;
    }
}
module.exports = new EditorProvider();