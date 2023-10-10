module.exports = class SidebarKey {
    constructor(key) {
        this.key = key.split(':')[0];
        this.id = key.split(':')[1];
        this.arg = key.split(':')[2] ? key.split(':')[2] : '';
    }
}