const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { sms } = require('../msg'); // ton fichier msg.js

const uploadToCatbox = async (filePath) => {
    try {
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', fs.createReadStream(filePath));

        const res = await axios.post('https://catbox.moe/user/api.php', formData, {
            headers: formData.getHeaders()
        });

        return res.data; // renvoie l'URL Catbox
    } catch (err) {
        console.error(err);
        return null;
    }
};

const urlPlugin = async (conn, rawMessage) => {
    const m = sms(conn, rawMessage);

    // Vérifier si c'est un média
    const isMedia = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(m.mtype);

    if (!isMedia) {
        return m.reply("⚠️ Veuillez envoyer un média pour obtenir une URL !");
    }

    try {
        // Téléchargement du média depuis WhatsApp
        const buffer = await conn.downloadMediaMessage(m.msg);
        const ext = m.mtype.replace('Message', ''); // image, video, audio, document
        const tempFile = path.join(__dirname, `../temp/${Date.now()}.${ext}`);
        
        fs.writeFileSync(tempFile, buffer);

        // Upload sur Catbox.moe
        const url = await uploadToCatbox(tempFile);

        fs.unlinkSync(tempFile); // Supprime le fichier temporaire

        if (url) {
            m.reply(`✅ Voici ton URL : ${url}`);
        } else {
            m.reply("❌ Erreur lors de l'upload sur Catbox.moe");
        }

    } catch (err) {
        console.error(err);
        m.reply("❌ Une erreur est survenue lors du traitement du média");
    }
};

module.exports = { urlPlugin };
