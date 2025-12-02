const { cmd } = require('../command');
const axios = require("axios");

cmd({
    pattern: "seaart",
    desc: "Génère une image avec SeaArt / FAST AI",
    category: "AI",
    react: "🎨"
},
async (socket, mek, m, { reply, args, from }) => {

    let prompt = args.join(" ");

    if (!prompt) {
        return reply("🎨 Donne un texte pour générer une image.\nExemple : *!seaart a cute anime girl*");
    }

    reply("⏳ Génération de l'image…");

    try {
        const url = "https://fast-dev-apis.vercel.app/seaart";

        // 🔥 1. API call
        const api = await axios.get(url, { params: { prompt } });

        if (!api.data.status || !api.data.images) {
            return reply("❌ Erreur : impossible de générer l'image.");
        }

        // 🔥 2. On prend la première image
        const imgUrl = api.data.images[0].url;

        // 🔥 3. Télécharger l’image
        const img = await axios.get(imgUrl, { responseType: "arraybuffer" });
        const buffer = Buffer.from(img.data);

        // 🔥 4. Envoi dans WhatsApp
        await socket.sendMessage(from, {
            image: buffer,
            caption: `🎨 *Image générée !*\n📝 Prompt : ${prompt}`
        });

    } catch (e) {
        console.log(e);
        reply("❌ Une erreur est survenue pendant la génération.");
    }
});
