const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { sms } = require('../lib/msg');

// Upload sur Catbox.moe
const uploadToCatbox = async (filePath) => {
    try {
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', fs.createReadStream(filePath));

        const res = await axios.post('https://catbox.moe/user/api.php', formData, {
            headers: formData.getHeaders()
        });

        return res.data;
    } catch (err) {
        console.error(err);
        return null;
    }
};

// Fonction pour convertir bytes en format lisible
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

// Fonction pour envoyer style typewriter (fancy)
const fancyText = (text) => {
    return `\`\`\`\n${text}\n\`\`\``; // entre ``` pour monospace / typewriter
};

        cmd({
    pattern: "url",
    alias: ["geturl"],
    desc: "Transforme un média en URL via Catbox.moe et affiche infos fancy",
    category: "Tools",
    react: "🔗"
}, async (conn, mek, m, { reply }) => {
    if (!m.quoted || !m.quoted.message) 
        return reply("🔗 Réponds à un média (image, vidéo, audio, document).");

    const qMsg = m.quoted.message;
    const mtype = Object.keys(qMsg)[0]; // ex: imageMessage, videoMessage, audioMessage, documentMessage

    const isMedia = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(mtype);
    if (!isMedia) return reply("🔗 Réponds à un média (image, vidéo, audio, document).");

    try {
        // Télécharger le média
        const stream = await conn.downloadMediaMessage(qMsg[mtype]);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        const ext = mtype.replace('Message', '');
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        const tempFile = path.join(tempDir, `${Date.now()}.${ext}`);
        fs.writeFileSync(tempFile, buffer);

        // Upload
        const url = await uploadToCatbox(tempFile);
        fs.unlinkSync(tempFile);

        if (!url) return reply("❌ Erreur lors de l'upload sur Catbox.moe");

        // Infos média
        const size = formatBytes(buffer.length);
        const type = ext.toUpperCase();
        const date = new Date().toLocaleString();

        const text = fancyText(
`📤 *𝙼𝙴𝙳𝙸𝙰 𝚄𝙿𝙻𝙾𝙰𝙳 𝚂𝚄𝙲𝙲𝙴𝚂𝚂*
╭──────────────────────────⭓
│ 📦 SIZE : ${size}
│ 🎞️ TYPE : ${type}
│ 🗓️ DATE : ${date}
│ 🔗 URL  : ${url}
╰──────────────────────────⭓
> POWERED BY NOX MINI BOT`
        );

        await conn.sendMessage(m.chat, { text }, { quoted: m });

    } catch (err) {
        console.error(err);
        reply("❌ Une erreur est survenue lors du traitement du média");
    }
});
