const fs = require('fs');
const defaultConfigs = require('../defaultConfigs.js');

module.exports = () => {
    console.info(fs.existsSync(defaultConfigs.localFilePath) ? 'Appdata /snippeteam folder exists.' : 'Appdata /snippeteam folder inexistent.');
    if (!fs.existsSync(defaultConfigs.localFilePath)) {
        console.info('creating ' + defaultConfigs.localFilePath);
        fs.mkdirSync(defaultConfigs.localFilePath);
    }
}
