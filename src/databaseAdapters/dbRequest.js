module.exports = class DbRequest {
    constructor(single, type) {
        this.whereArr = [];
        this.single = single;
        this.type = type;
    }

    static selectAll(type) {
        const req = new DbRequest(false, type);
        return req;
    }

    static select(type) {
        const req = new DbRequest(true, type);
        return req;
    }

    where(key, cond, val) {
        this.whereArr.push([key, cond, val]);
        return this;
    }
}