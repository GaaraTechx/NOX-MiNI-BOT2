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
    const quoted = m.quoted;
    if (!quoted) return reply("🔗 Réponds à un média (image, vidéo, audio, document).");

    const message = sms(conn, quoted);

    const isMedia = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(message.mtype);
    if (!isMedia) return reply("🔗 Réponds à un média (image, vidéo, audio, document).");

    try {
        // Télécharger le média
        const buffer = await conn.downloadMediaMessage(message.msg);
        const ext = message.mtype.replace('Message', '');
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        const tempFile = path.join(tempDir, `${Date.now()}.${ext}`);
        fs.writeFileSync(tempFile, buffer);

        // Upload
        const url = await uploadToCatbox(tempFile);
        fs.unlinkSync(tempFile);

        if (!url) return reply("❌ 𝙴𝚁𝚁𝙾𝚁 𝚃𝚁𝚈 𝙰𝙶𝙰𝙸𝙽 𝙱𝚁𝙾");

        // Infos média
        const stats = fs.statSync(tempFile);
        const size = formatBytes(buffer.length);
        const type = ext.toUpperCase();
        const date = new Date().toLocaleString();

        // Message fancy
        const text = fancyText(
`📤 *𝙼𝙴𝙳𝙸𝙰 𝚄𝙿𝙻𝙾𝙰𝙳 𝚂𝚄𝙲𝙲𝙴𝚂𝙵𝚄𝙻𝙻𝚈*
╭──────────────────────────⭓
│ 📦 𝚂𝙸𝚉𝙴 : ${size}
│ 🎞️ 𝚃𝚈𝙿𝙴 : ${type}
│ 🗓️ 𝙳𝙰𝚃𝙴 : ${date}
│ 🔗 𝚄𝚁𝙻 :
│ ${url}
╰──────────────────────────⭓
> 𝑷𝑶𝑾𝑬𝑹𝑬𝑫 𝑩𝒀 𝑵𝑶𝑿 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻`
        );

        await conn.sendMessage(message.chat, { text }, { quoted: m });

    } catch (err) {
        console.error(err);
        reply("❌ Une erreur est survenue lors du traitement du média");
    }
});
