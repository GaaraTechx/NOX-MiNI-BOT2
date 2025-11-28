const mongoose = require('mongoose');
const config = require('../config');

const connectdb = async () => {
    try {
        // Options pour éviter les avertissements
        mongoose.set('strictQuery', false);
        await mongoose.connect(config.MONGODB_URI);
        console.log("✅ Database Connected Successfully");
    } catch (e) {
        console.error("❌ Database Connection Failed:", e.message);
    }
};

// Schéma de configuration utilisateur (Exemple)
const configSchema = new mongoose.Schema({
    number: { type: String, required: true, unique: true },
    config: { type: Object, default: {} }
});

const UserConfig = mongoose.model('UserConfig', configSchema);

// Fonctions utilitaires
const getUserConfig = async (number) => {
    if(!number) return {};
    const cleanNumber = number.replace(/[^0-9]/g, '');
    let data = await UserConfig.findOne({ number: cleanNumber });
    return data ? data.config : {};
};

const updateUserConfig = async (number, newConfig) => {
    if(!number) return;
    const cleanNumber = number.replace(/[^0-9]/g, '');
    await UserConfig.findOneAndUpdate(
        { number: cleanNumber },
        { config: newConfig },
        { upsert: true, new: true }
    );
};

module.exports = {
    connectdb,
    UserConfig,
    getUserConfig,
    updateUserConfig
};
