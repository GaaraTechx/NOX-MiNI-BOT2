const { cmd } = require("../command");
const config = require("../config");
// --- COMMANDE PROMOTE ---
cmd({
  pattern: "promote",
  alias: ["p", "giveadmin"],
  desc: "Promote a user to admin",
  category: "group",
  react: "🔺",
  filename: __filename
}, 
async(conn, mek, m, { from, reply, isOwner, isAdmins, isBotAdmin, args }) => {
    try {
        // Garde isAdmins avec le "s"
        if (!isOwner && !isAdmins) {
            return reply("❌ Seul l'Owner ou un Admin peut utiliser cette commande.");
        }
        
        
        let user;
        if (m.quoted) {
            // 1. En répondant à un message
            user = m.quoted.sender;
        } else if (m.mentionedJid && m.mentionedJid.length > 0) {
            // 2. Avec une mention @nom
            user = m.mentionedJid[0];
        } else if (args[0]) {
            // 3. Avec le numéro (ex: .promote 50973773737)
            user = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        if (!user) return reply("❓ Réponds à quelqu'un, mentionne-le ou tape son numéro.");

        await conn.groupParticipantsUpdate(from, [user], "promote");
        reply(`*✅ Utilisateur promu admin.*`, { mentions: [user] });

    } catch (err) {
        console.error(err);
        reply("❌ Erreur lors de la promotion.");
    }
});

// --- COMMANDE DEMOTE ---
cmd({
  pattern: "demote",
  alias: ["d", "removeadmin"],
  desc: "Demote a group admin",
  category: "group",
  react: "🔻",
  filename: __filename
}, 
async(conn, mek, m, { from, reply, isOwner, isAdmins, isBotAdmin, args }) => {
    try {
        // Garde isAdmins avec le "s"
        if (!isOwner && !isAdmins) {
            return reply("❌ Seul l'Owner ou un Admin peut utiliser cette commande.");
        }
        
        
        let user;
        if (m.quoted) {
            user = m.quoted.sender;
        } else if (m.mentionedJid && m.mentionedJid.length > 0) {
            user = m.mentionedJid[0];
        } else if (args[0]) {
            user = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        if (!user) return reply("❓ Réponds à quelqu'un, mentionne-le ou tape son numéro.");

        await conn.groupParticipantsUpdate(from, [user], "demote");
        reply(`*✅ Administrateur destitué.*`, { mentions: [user] });

    } catch (err) {
        console.error(err);
        reply("❌ Erreur lors de la destitution.");
    }
});
