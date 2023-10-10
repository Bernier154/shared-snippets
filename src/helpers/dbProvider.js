const EventEmitter = require('node:events');

class DbProvider extends EventEmitter {
    consume() {
        return this.db
    }

    provide(db) {
        this.db = db;
    }
}
module.exports = new DbProvider();