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
        return reply("🎨 𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳 𝙰 𝚃𝙴𝚇𝚃 𝙵𝙾𝚁 𝚈𝙾𝚄𝚁 𝙸𝙼𝙶.\n𝙴𝚇 : *!seaart a cute anime girl*\n> 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝙽𝙾𝚇 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃");
    }

    reply("⏳ 𝚠𝚊𝚒𝚝 𝚏𝚘𝚛 𝚖𝚎 𝚋𝚛𝚘…");

    try {
        const url = "https://fast-dev-apis.vercel.app/seaart";

        // 🔥 1. API call
        const api = await axios.get(url, { params: { prompt } });

        if (!api.data.status || !api.data.images) {
            return reply("❌ Erreur : 𝙴𝚁𝚁𝙾𝚁 𝙿𝙻𝙴𝙰𝚂𝙴 𝚃𝚁𝚈 𝙰𝙶𝙰𝙸𝙽.");
        }

        // 🔥 2. On prend la première image
        const imgUrl = api.data.images[0].url;

        // 🔥 3. Télécharger l’image
        const img = await axios.get(imgUrl, { responseType: "arraybuffer" });
        const buffer = Buffer.from(img.data);

        // 🔥 4. Envoi dans WhatsApp
        await socket.sendMessage(from, {
            image: buffer,
            caption: `🎨 *𝚈𝙾𝚄𝚁 𝙸𝙼𝙰𝙶𝙴 !*\n📝 𝚃𝙴𝚇𝚃 : ${prompt} \n 𝙳𝙰𝚃𝙴 :`
        });

    } catch (e) {
        console.log(e);
        reply("❌ Une erreur est survenue pendant la génération.");
    }
});
