const fs = require('fs');
const { defaultConfigs } = require('./defaultConfigs.js');

exports.checkDefaultAppdataFolder = () => {
    console.log(fs.existsSync(defaultConfigs.localFilePath) ? 'Appdata snippeteam folder exists.' : 'Appdata snippeteam folder inexistent.');
    if (!fs.existsSync(defaultConfigs.localFilePath)) {
        console.log('creating ' + defaultConfigs.localFilePath);
        fs.mkdirSync(defaultConfigs.localFilePath);
    }
}