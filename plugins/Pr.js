const { cmd } = require('../command');

cmd({
    pattern: "promote",
    alias: ["admin"],
    desc: "Promote a user to admin",
    category: "group",
    react: "⬆️"
},
async (socket, mek, m, { reply, quoted, args, from, isGroup, isBotAdmins }) => {

    if (!isGroup) return reply("❌ Cette commande fonctionne uniquement dans un groupe !");
    if (!isBotAdmins) return reply("⚠️ Je dois être admin pour promouvoir quelqu’un !");

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
        reply(`✅ @${target.split("@")[0]} est maintenant admin !`, { mentions: [target] });
    } catch (err) {
        console.log(err);
        reply("❌ Erreur lors de la promotion.");
    }
});
