const EventEmitter = require('node:events');
const { v4: uuidv4, } = require('uuid');

class ContextProvider extends EventEmitter {

    consume(callback) {
        return this.context;

    }

    provide(context) {
        this.context = context;
    }
}
module.exports = new ContextProvider();