// 📌 HIDETAG — Tag tout le monde sans montrer les mentions
const { cmd } = require('../command');

cmd({
    pattern: "hidetag",
    desc: "Tag tout le monde sans afficher les mentions",
    category: "group",
    react: "👻"
},
async (socket, mek, m, { reply, args, isGroup, participants, from }) => {

    if (!isGroup) return reply("❌ Groupe uniquement !");
    let text = args.join(" ") || " ";

    let members = participants.map(v => v.id);

    await socket.sendMessage(from, {
        text: text,
        mentions: members
    });
});


// 📌 TAGALL — Mentionne tout le groupe avec message visible
cmd({
    pattern: "tagall",
    desc: "Tag tout le groupe avec message",
    category: "group",
    react: "📢"
},
async (socket, mek, m, { reply, args, isGroup, participants, from }) => {

    if (!isGroup) return reply("❌ Groupe uniquement !");

    let text = args.join(" ") || "📣 *TAGALL*";
    let msg = `${text}\n\n`;

    participants.forEach(p => {
        msg += `➡️ @${p.id.split("@")[0]}\n`;
    });

    await socket.sendMessage(from, {
        text: msg,
        mentions: participants.map(v => v.id)
    });
});


// 📌 TAGADMIN — Mentionne uniquement les admins
cmd({
    pattern: "tagadmin",
    desc: "Tag uniquement les admins",
    category: "group",
    react: "🛡️"
},
async (socket, mek, m, { reply, isGroup, participants, from }) => {

    if (!isGroup) return reply("❌ Groupe uniquement !");

    let admins = participants
        .filter(u => u.admin)
        .map(a => a.id);

    if (admins.length === 0) return reply("❌ Aucun admin trouvé.");

    let txt = "🛡️ *ADMIN TAG*\n\n";
    admins.forEach(a => {
        txt += `⭐ @${a.split("@")[0]}\n`;
    });

    await socket.sendMessage(from, {
        text: txt,
        mentions: admins
    });
});


// 📌 ONLINE — Liste les personnes en ligne + envoie à chacun
cmd({
    pattern: "online",
    desc: "Liste des personnes en ligne",
    category: "group",
    react: "🟢"
},
async (socket, mek, m, { reply, isGroup, participants, from }) => {

    if (!isGroup) return reply("❌ Groupe uniquement !");

    // 🔥 Baileys donne presence = "available" (en ligne)
    let onlines = participants.filter(p => p.isOnline || p.presence === "available");

    if (onlines.length === 0) return reply("😴 Personne n'est en ligne.");

    let list = "🟢 *Personnes en ligne :*\n\n";

    for (let u of onlines) {
        list += `• @${u.id.split("@")[0]}\n`;

        // envoyer un ping à chaque personne
        await socket.sendMessage(u.id, {
            text: "👀 Tu es en ligne !"
        });
    }

    await socket.sendMessage(from, {
        text: list,
        mentions: onlines.map(v => v.id)
    });
});
