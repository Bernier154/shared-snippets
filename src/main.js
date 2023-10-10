const SnippeTeam = require("./SnippeTeam")

exports.activate = (context) => new SnippeTeam(context);
exports.deactivate = () => { }