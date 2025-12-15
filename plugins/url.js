const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

cmd({
    pattern: "url",
    alias: ["to url"],
    desc: "Uploader un média et obtenir une URL",
    category: "TOOL",
    react: "🔗"
}, async (socket, mek, m, { reply, from }) => {

    try {
        // 📌 média cité ou message direct
        const msg = m.quoted ? m.quoted : m;

        if (!msg.mtype || !msg.msg || !msg.msg.mimetype) {
            return reply("🔗 Réponds à un média (image, vidéo, audio, document).");
        }

        const mime = msg.msg.mimetype;

        // ⏳
        reply("⏳ Upload en cours...");

        // ⬇️ téléchargement (fonction native Baileys)
        const buffer = await msg.download();
        if (!buffer) return reply("❌ Impossible de télécharger le média.");

        // 📂 fichier temporaire
        const ext = mime.split("/")[1] || "bin";
        const tempPath = path.join(__dirname, `../temp_${Date.now()}.${ext}`);
        fs.writeFileSync(tempPath, buffer);

        // 📤 Catbox upload
        const form = new FormData();
        form.append("reqtype", "fileupload");
        form.append("fileToUpload", fs.createReadStream(tempPath));

        const res = await axios.post(
            "https://catbox.moe/user/api.php",
            form,
            { headers: form.getHeaders() }
        );

        const mediaUrl = res.data.trim();

        // 🧾 MEDIA TYPE basé sur mtype
        let mediaType = "FILE";
        if (msg.mtype === "imageMessage") mediaType = "IMAGE";
        else if (msg.mtype === "videoMessage") mediaType = "VIDEO";
        else if (msg.mtype === "audioMessage") mediaType = "AUDIO";
        else if (msg.mtype === "documentMessage") mediaType = "DOCUMENT";

        // 🗓️ Date Haïti
        const uploadDate = new Date().toLocaleString("fr-FR", {
            timeZone: "America/Port-au-Prince"
        });

        // 📤 réponse finale
        await socket.sendMessage(from, {
            text:
`📤 *𝑼𝑷𝑳𝑶𝑨𝑫 𝑴𝑬𝑫𝑰𝑨*
╭──────────────────────────⭓
│ 📁 𝙼𝙴𝙳𝙸𝙰 𝚃𝚈𝙿𝙴 : ${mediaType}
│ 🔗 𝚄𝚁𝙻 𝙼𝙴𝙳𝙸𝙰 :
│ ${mediaUrl}
│ 📅 𝚄𝙿𝙻𝙾𝙰𝙳 𝙳𝙰𝚃𝙴 :
│ ${uploadDate}
╰──────────────────────────⭓
> 𝑷𝑶𝑾𝑬𝑹𝑬𝑫 𝑩𝒀 𝑵𝑶𝑿 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻`
        });

        // 🧹 clean
        fs.unlinkSync(tempPath);

    } catch (err) {
        console.error(err);
        reply("❌ Erreur pendant l’upload.");
    }
});
