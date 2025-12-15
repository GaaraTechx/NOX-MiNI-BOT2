const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

cmd({
    pattern: "catbox",
    desc: "Uploader un média vers Catbox.moe",
    category: "TOOL",
    react: "📤"
}, async (socket, mek, m, { reply, from }) => {

    try {
        // 🔎 Vérification média
        const quoted = m.quoted || m;
        const mime = (quoted.msg || quoted).mimetype;

        if (!mime) {
            return reply("📤 *UTILISATION*\nRéponds à une image / vidéo / audio / fichier.");
        }

        // ⏳ Téléchargement média
        reply("⏳ Upload en cours vers Catbox...");
        const buffer = await quoted.download();

        // 📂 Fichier temporaire
        const ext = mime.split("/")[1];
        const tempFile = path.join(__dirname, `../temp_${Date.now()}.${ext}`);
        fs.writeFileSync(tempFile, buffer);

        // 📡 FormData Catbox
        const form = new FormData();
        form.append("reqtype", "fileupload");
        form.append("fileToUpload", fs.createReadStream(tempFile));

        // 🌐 Envoi Catbox
        const res = await axios.post(
            "https://catbox.moe/user/api.php",
            form,
            { headers: form.getHeaders() }
        );

        const url = res.data.trim();

        // 🗓️ Date Haïti
        const date = new Date().toLocaleString("fr-FR", {
            timeZone: "America/Port-au-Prince"
        });

        // 🧾 Type média lisible
        let mediaType = "FILE";
        if (mime.startsWith("image")) mediaType = "IMAGE";
        else if (mime.startsWith("video")) mediaType = "VIDEO";
        else if (mime.startsWith("audio")) mediaType = "AUDIO";

        // 📤 Réponse
        await socket.sendMessage(from, {
            text:
`📤 *𝑼𝑷𝑳𝑶𝑨𝑫 𝑴𝑬𝑫𝑰𝑨*
╭──────────────────────────⭓
│ 📁 𝙼𝙴𝙳𝙸𝙰 𝚃𝚈𝙿𝙴 : ${mediaType}
│ 🔗 𝚄𝚁𝙻 𝙼𝙴𝙳𝙸𝙰 :
│ ${resultUrl}
│ 📅 𝚄𝙿𝙻𝙾𝙰𝙳 𝙳𝙰𝚃𝙴 :
│ ${uploadDate}
╰──────────────────────────⭓
> 𝑷𝑶𝑾𝑬𝑹𝑬𝑫 𝑩𝒀 𝑵𝑶𝑿 𝑴𝑰𝑵𝑰`
        });

        // 🧹 Nettoyage
        fs.unlinkSync(tempFile);

    } catch (err) {
        console.error(err);
        reply("❌ Erreur lors de l’upload Catbox.");
    }
});
