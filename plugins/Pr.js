const { cmd } = require('../command');

cmd({
    pattern: "promote",
    alias: ["admin"],
    desc: "Promote a user to admin",
    category: "group",
    react: "⬆️"
},
async (socket, mek, m, { reply, quoted, args, from, isGroup, isBotAdmins }) => {

    
    let target;

    // ✅ 1. Si l’utilisateur répond à un message
    if (quoted) {
        target = quoted.sender;
    }

    // ✅ 2. S'il tape un numéro (ex: .promote 50932362388)
    else if (args[0]) {
        let number = args[0].replace(/[^0-9]/g, "");
        if (number.length < 7) return reply("❌ Numéro invalide !");
        target = number + "@s.whatsapp.net";
    }

    else {
        return reply("📌 Utilise :\n• Répondre à un message et taper *.promote*\n• Ou taper : *.promote 509XXXXXXXX*");
    }

    // 🔥 Exécution de la promotion
    try {
        await socket.groupParticipantsUpdate(from, [target], "promote");
        reply(`✅ @${target.split("@")[0]} est maintenant admin !`, { mentions: [target] });
    } catch (err) {
        console.error(err);
        reply("❌ Erreur lors de la promotion.");
    }
});
