const { cmd } = require("../command");
const axios = require("axios");
const fs = require("fs");

cmd({
  pattern: "fluxai",
  alias: ["flux", "imagine"],
  react: "🚀",
  desc: "Generate an image using AI.",
  category: "AI",
  filename: __filename
}, async (conn, mek, m, { q, reply }) => {
  try {
    if (!q) return reply("𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳 𝙰 𝙿𝚁𝙾𝙼𝙿𝚃.");

    await reply(" *⏳ 𝚆𝙰𝙸𝚃 𝙵𝙾𝚁 𝙼𝙴 𝙱𝚁𝙾 ...🔥*");

    const apiUrl = `https://api.siputzx.my.id/api/ai/flux?prompt=${encodeURIComponent(q)}`;

    const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

    if (!response || !response.data) {
      return reply("Error: The API did not return a valid image. Try again later.");
    }

    const imageBuffer = Buffer.from(response.data, "binary");

    await conn.sendMessage(m.chat, {
      image: imageBuffer,
      caption: `> *𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝙽𝙾𝚇 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃* 🚀\n✨ 𝙿𝚁𝙾𝙼𝙿𝚃 : *${q}*`
    });

  } catch (error) {
    console.error("FluxAI Error:", error);
    reply(`An error occurred: ${error.response?.data?.message || error.message || "Unknown error"}`);
  }
});

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
    // 📅 DATE HAÏTI — JOUR/MOIS/ANNÉE HEURE
const dateObj = new Date();
const options = { timeZone: "America/Port-au-Prince" };
const haitiDate = new Date(dateObj.toLocaleString("en-US", options));

const jour  = String(haitiDate.getDate()).padStart(2, "0");
const mois  = String(haitiDate.getMonth() + 1).padStart(2, "0");
const annee = haitiDate.getFullYear();

const heure = String(haitiDate.getHours()).padStart(2, "0");
const minute = String(haitiDate.getMinutes()).padStart(2, "0");
const seconde = String(haitiDate.getSeconds()).padStart(2, "0");

const dateFinale = `${jour}/${mois}/${annee} ${heure}:${minute}:${seconde}`;

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
            caption: `🎨 *𝚈𝙾𝚄𝚁 𝙸𝙼𝙰𝙶𝙴 !*\n📝 𝚃𝙴𝚇𝚃 : ${prompt} \n 𝙳𝙰𝚃𝙴 : ${dateFinale}`
        });

    } catch (e) {
        console.log(e);
        reply("❌ Une erreur est survenue pendant la génération.");
    }
});
