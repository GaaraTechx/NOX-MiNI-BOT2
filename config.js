const fs = require('fs');
const dotenv = require('dotenv');

if (fs.existsSync('.env')) {
    dotenv.config({ path: '.env' });
}

module.exports = {
    PREFIX: '.',
    AUTO_TYPING: 'false',
    AUTO_RECORDING: 'false',
    // ... reste de vos configs
};
