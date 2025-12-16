const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

cmd({
    pattern: "url",
    alias: ["tourl"],
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

        // ⬇️ téléchargement
        const buffer = await msg.download();
        if (!buffer) return reply("❌ Impossible de télécharger le média.");

        // ⚖️ Calcul de la taille (SizeMedia)
        const sizeInBytes = buffer.length;
        const sizeMedia = (sizeInBytes / (1024 * 1024)).toFixed(2) + " MB";

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

        let u = "`";
        
        // 📤 réponse finale avec sizeMedia ajouté
        await socket.sendMessage(from, {
            text:
`📥 ${u}𝙳𝙰𝚃𝙰 𝚄𝙿𝙻𝙾𝙰𝙳${u}
╭───〔 🛡️ 𝙽𝙾𝚇 𝚄𝚁𝙻 〕───╼
│ 📥 𝙼𝙴𝙳𝙸𝙰 : ${mediaType}
│ ⚖️ 𝚂𝙸𝚉𝙴 : ${sizeMedia}
│ 🔗 𝙻𝙸𝙽𝙺 : ${mediaUrl}
│ 📅 𝚃𝙸𝙼𝙴 : ${uploadDate}
╰───────────────────────◈
> *𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝙽𝙾𝚇 𝙼𝙸𝙽𝙸*`
        });

        // 🧹 clean
        fs.unlinkSync(tempPath);

    } catch (err) {
        console.error(err);
        reply("❌ Erreur pendant l’upload.");
    }
});
