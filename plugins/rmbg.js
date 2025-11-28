const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');

cmd({
    pattern: "rmbg",
    alias: ["removebg", "bgremove"],
    desc: "Remove background of an image",
    category: "tools",
    react: "🖼️"
},
async (socket, mek, m, { reply, quoted }) => {

    // Vérifier si on répond à une image
    const q = mek.quoted || quoted;
    if (!q || !q.mtype || !q.mtype.includes("image")) {
        return reply("📌 Réponds à une *image* puis tape :\n.rmbg");
    }

    // Télécharger l'image
    let buffer;
    try {
        buffer = await q.download();
    } catch (e) {
        console.log(e);
        return reply("❌ Impossible de télécharger l'image.");
    }

    reply("⏳ Suppression de l’arrière-plan...");

    try {
        // Préparer FormData
        const form = new FormData();
        form.append("image", buffer, {
            filename: "image.jpg",
            contentType: "image/jpeg"
        });

        // POST vers DeepAI
        const resp = await axios.post(
            "https://api.deepai.org/api/background-remover",
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    "api-key": "bf02c310-5baf-4eb9-9ad6-446dc0f91d86" // 🔥 METS TA KEY ICI
                }
            }
        );

        const resultUrl = resp.data.output_url;

        if (!resultUrl) return reply("❌ Erreur API.");

        // Télécharger l'image finale
        const finalImg = await axios.get(resultUrl, { responseType: "arraybuffer" });

        // Envoyer l'image sans BG
        await socket.sendMessage(m.from, {
            image: Buffer.from(finalImg.data),
            caption: "✅ Arrière-plan supprimé !"
        });

    } catch (err) {
        console.log(err);
        reply("❌ Erreur lors du traitement de l'image.");
    }
});
