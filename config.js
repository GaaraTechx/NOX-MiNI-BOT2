const fs = require('fs');
const dotenv = require('dotenv');

if (fs.existsSync('.env')) {
    dotenv.config({ path: '.env' });
}

module.exports = {
    PREFIX: '.',
    AUTO_TYPING: 'true',
    AUTO_RECORDING: 'true',
    // ... reste de vos configs
};
