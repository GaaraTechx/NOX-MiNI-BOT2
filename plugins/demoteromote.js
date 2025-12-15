const { cmd } = require("../command");
const config = require("../config");
cmd({
  pattern: "promote",
  alias: ["p", "giveadmin", "makeadmin"],
  desc: "Promote a user to admin",
  category: "group",
  react: "🔺",
  filename: __filename
}, async (conn, mek, m, {
  from,
  isCreator,
  isBotAdmins,
  isAdmins,
  isGroup,
  quoted,
  reply
}) => {
  try {
    if (!isGroup) return reply("⚠️ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ ᴡᴏʀᴋs ɪɴ *ɢʀᴏᴜᴘs*.");
    if (!isAdmins) return reply("🔐 𝙾𝙽𝙻𝚈 𝙶𝚁𝙾𝚄𝙿 𝙰𝙳𝙼𝙸𝙽.");

    // Your user extraction logic
    if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
      return reply("❓ You did not give me a user!?");
    }

    let users = m.mentionedJid[0]
      ? m.mentionedJid[0]
      : m.quoted
      ? m.quoted.sender
      : null;

    if (!users) return reply("⚠️ Couldn't determine target user.");

    const parts = users.split('@')[0];
    const ownerJid = conn.user.id.split(":")[0] + '@s.whatsapp.net';

    if (users === ownerJid) return reply("👑 ᴛʜᴀᴛ's ᴛʜᴇ *ᴏᴡɴᴇʀ's ɴᴜᴍʙᴇʀ!* ᴀʟʀᴇᴀᴅʏ ᴘᴏᴡᴇʀғᴜʟ!");

    // Promote without checking if already admin
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
}, async (conn, mek, m, {
  from,
  isCreator,
  isBotAdmins,
  isAdmins,
  isGroup,
  participants,
  quoted,
  reply
}) => {
  try {
    if (!isGroup) return reply("⚠️ 𝙾𝙽𝙻𝚈 𝙶𝚁𝙾𝚄𝙿 𝙲𝙾𝙼𝙼𝙰𝙽𝙳.");
    if (!isAdmins) return reply("🔐 𝙾𝙽𝙻𝚈 𝙶𝚁𝙾𝚄𝙿 𝙰𝙳𝙼𝙸𝙽.");

    // Your user extraction logic
    if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
      return reply("❓ 𝙶𝙸𝚅𝙴 𝚄𝚂𝙴𝚁 𝙱𝚁𝙾");
    }

    let users = m.mentionedJid[0]
      ? m.mentionedJid[0]
      : m.quoted
      ? m.quoted.sender
      : null;

    if (!users) return reply("⚠️ Couldn't determine target user.");

    const parts = users.split('@')[0];
    const ownerJid = conn.user.id.split(":")[0] + '@s.whatsapp.net';

    if (users === ownerJid) return reply("👑 𝙸 𝙲𝙰𝙽'𝚃 𝙳𝙴𝙼𝙾𝚃𝙴 𝚃𝙷𝙴 𝙾𝚆𝙽𝙴𝚁 𝙽𝚄𝙼𝙱𝙴𝚁.");

    // No admin check — always try to demote
    await conn.groupParticipantsUpdate(from, [users], "demote");

    reply(`*✅ 𝚂𝚄𝙲𝙲𝙴𝚂𝙵𝚄𝙻𝙻𝚈 𝙳𝙴𝙼𝙾𝚃𝙴*`, { mentions: [users] });

  } catch (err) {
    console.error(err);
    reply("❌ Failed to demote. Something went wrong.");
  }
});
