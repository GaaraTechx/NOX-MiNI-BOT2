const { cmd } = require("../command");
const config = require("../config");

cmd({
  pattern: "promote",
  alias: ["p", "giveadmin", "makeadmin"],
  desc: "Promote a user to admin",
  category: "group",
  react: "🔺",
  filename: __filename
}, 
async(conn, mek, m, { from, reply, isOwner, isAdmin, groupMetadata }) => {
    try {
        // Correction ici : isAdmin au lieu de isAdmins
        if (!isOwner && !isAdmins) {
            return reply("❌ Seul l'Owner du Bot ou un Administrateur du Groupe peut utiliser cette commande.");
        }
        
        if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
            return reply("❓ You did not give me a user!?");
        }

        let users = m.mentionedJid[0]
            ? m.mentionedJid[0]
            : m.quoted
            ? m.quoted.sender
            : null;

        if (!users) return reply("⚠️ Couldn't determine target user.");

        const ownerJid = conn.user.id.split(":")[0] + '@s.whatsapp.net';
        if (users === ownerJid) return reply("👑 ᴛʜᴀᴛ's ᴛʜᴇ *ᴏᴡɴᴇʀ's ɴᴜᴍʙᴇʀ!* ᴀʟʀᴇᴀᴅʏ ᴘᴏᴡᴇʀғᴜʟ!");

        await conn.groupParticipantsUpdate(from, [users], "promote");
        reply(`*✅ sᴜᴄᴄᴇssғᴜʟʟʏ ᴘʀᴏᴍᴏᴛᴇᴅ ᴛᴏ ᴀᴅᴍɪɴ.*`, { mentions: [users] });

    } catch (err) {
        console.error(err);
        reply("❌ Failed to promote. Something went wrong.");
    }
});

cmd({
  pattern: "demote",
  alias: ["d", "dismiss", "removeadmin"],
  desc: "Demote a group admin",
  category: "group",
  react: "🔻",
  filename: __filename
}, 
async(conn, mek, m, { from, reply, isOwner, isAdmin, groupMetadata }) => {
    try {
        // Correction ici aussi : isAdmin
        if (!isOwner && !isAdmins) {
            return reply("❌ Seul l'Owner du Bot ou un Administrateur du Groupe peut utiliser cette commande.");
        }
        
        if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
            return reply("❓ 𝙶𝙸𝚅𝙴 𝚄𝚂𝙴𝚁 𝙱𝚁𝙾");
        }

        let users = m.mentionedJid[0]
            ? m.mentionedJid[0]
            : m.quoted
            ? m.quoted.sender
            : null;

        if (!users) return reply("⚠️ Couldn't determine target user.");

        const ownerJid = conn.user.id.split(":")[0] + '@s.whatsapp.net';
        if (users === ownerJid) return reply("👑 𝙸 𝙲𝙰𝙽'𝚃 𝙳𝙴𝙼𝙾𝚃𝙴 𝚃𝙷𝙴 𝙾𝚆𝙽𝙴𝚁 𝙽𝚄𝙼𝙱𝙴𝚁.");

        await conn.groupParticipantsUpdate(from, [users], "demote");
        reply(`*✅ 𝚂𝚄𝙲𝙲𝙴𝚂𝙵𝚄𝙻𝙻𝚈 𝙳𝙴𝙼𝙾𝚃𝙴*`, { mentions: [users] });

    } catch (err) {
        console.error(err);
        reply("❌ Failed to demote. Something went wrong.");
    }
});
