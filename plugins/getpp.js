const { cmd } = require('../command');
const config = require('../config');


cmd({
    pattern: "getpp",
    alias: ["stealpp"],
    react: "🖼️",
    desc: "Sends the profile picture of a user by phone number (owner only)",
    category: "owner",
    use: ".getpp <phone number>",
    filename: __filename
},
async (conn, mek, m, { from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        // Check if the user is the bot owner
        if (!isOwner) return reply("🛑 𝚈𝙾𝚄 𝙰𝚁𝙴 𝙽𝙾𝚃 𝙼𝚈 𝙾𝚆𝙽𝙴𝚁!");

        // Check if a phone number is provided
        if (!args[0]) return reply("🔥 𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳 𝙰 𝙽𝚄𝙼𝙱𝙴𝚁 ");

        // Format the phone number to JID
        let targetJid = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";

        // Get the profile picture URL
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(targetJid, "image");
        } catch (e) {
            return reply("🖼️ 𝙿𝚁𝙾𝙵𝙸𝙻𝙴 𝙽𝙾𝚃 𝙰𝙲𝙲𝙴𝚂𝚂𝙴𝙳");
        }

        // Get the user's name or number for the caption
        let userName = targetJid.split("@")[0]; // Default to phone number
        try {
            const contact = await conn.getContact(targetJid);
            userName = contact.notify || contact.vname || userName;
        } catch {
            // Fallback to phone number if contact info is unavailable
        }

        // Send the profile picture
        await conn.sendMessage(from, { 
            image: { url: ppUrl }, 
            caption: `📌 𝙿𝚁𝙾𝙵𝙸𝙻𝙴 𝙿𝙸𝙲𝚃𝚄𝚁𝙴 𝙾𝙵𝙵 ${userName}` 
        });

        // Send a reaction to the command message
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        // Reply with a generic error message and log the error
        reply("🛑 An error occurred while fetching the profile picture! Please try again later.");
        l(e); // Log the error for debugging
    }
});
