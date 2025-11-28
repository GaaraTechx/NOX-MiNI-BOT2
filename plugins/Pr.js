const { cmd } = require('../command');

cmd({
    pattern: "promote",
    alias: ["admin"],
    desc: "Promote a member to admin",
    category: "group",
    react: "⬆️"
},
async (conn, mek, m, { reply, sender, isGroup, isAdmins, isBotAdmins, quoted, args }) => {

    
    let target;
    
    if (quoted) {
        target = quoted.sender;
    } else if (args[0]) {
        target = args[0].replace(/[@+]/g, "") + "@s.whatsapp.net";
    } else {
        return reply("📌 Utilise :\n.promote @user ou citer un message");
    }

    // Exécuter la promotion
    try {
        await conn.groupParticipantsUpdate(m.from, [target], "promote");
        reply(` admin !`, {
            mentions: [target]
        });
    } catch (e) {
        console.error(e);
        reply("❌ Erreur lors de la promotion.");
    }
});
