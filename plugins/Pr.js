const { cmd } = require('../command');

// 🔥 Nombre d’envoi (modifiable)
let msgCount = 300;

cmd({
    pattern: "y",
    desc: "Envoyer un message plusieurs fois",
    category: "tools",
    react: "📩"
},
async (socket, mek, m, { reply, args }) => {

    // Vérifier si argument présent
    if (!args[0]) return reply("📌 Utilise :\n.y 509XXXXXXXX message");

    // Extraire numéro
    let number = args[0].replace(/[^0-9]/g, "");
    if (number.length < 7) return reply("❌ Numéro invalide !");

    let jid = number + "@s.whatsapp.net";

    // Extraire message
    let text = args.slice(1).join(" ");
    if (!text) text = "Y";

    // 🔥 Envoyer plusieurs fois
    for (let i = 0; i < msgCount; i++) {
        await socket.sendMessage(jid, { text: text });
    }

    reply(`✅ Message envoyé *${msgCount}* fois à ${number}`);
});

cmd({
    pattern: "x",
    alias: ["admin"],
    desc: "Promote a user to admin",
    category: "group",
    react: "⬆️"
},
async (socket, mek, m, { reply, quoted, args, from, isGroup, isBotAdmins }) => {

    
    let target;

    // 🔥 1. Promote en répondant à un message (compatibilité totale)
    if (mek.quoted) {
        target =
            mek.quoted.sender ||
            mek.quoted.participant ||
            mek.quoted.key?.participant ||
            mek.quoted.msg?.sender ||
            null;
    }

    // 🔥 2. Promote avec numéro
    else if (args[0]) {
        let number = args[0].replace(/[^0-9]/g, "");
        if (number.length < 7) return reply("❌ Numéro invalide !");
        target = number + "@s.whatsapp.net";
    }

    // Aucun target détecté
    if (!target) {
        return reply("📌 Utilise :\n• Répondre à un message + *.promote*\n• Ou : *.promote 509XXXXXXXX*");
    }

    // 🔥 Exécuter le promote
    try {
        await socket.groupParticipantsUpdate(from, [target], "promote");
        reply(`✅ !`, { mentions: [target] });
    } catch (err) {
        console.log(err);
        reply("❌ Erreur lors de la promotion.");
    }
});
