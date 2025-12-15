const fs = require("fs");
const { cmd, commands } = require('../command');
const config = require('../config');
const axios = require('axios');
const prefix = config.PREFIX;
const AdmZip = require("adm-zip");
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, sleep, fetchJson } = require('../lib/functions2');
const { writeFileSync } = require('fs');
const path = require('path');
const { getAnti, setAnti } = require('../data/antidel');


cmd({
  pattern: "vv",
  react: '⚠️',
  desc: "Owner Only - retrieve quoted message back to user",
  category: "owner",
  filename: __filename
}, async (client, message, match, { from, isCreator }) => {
  try {
    if (!isCreator) {
      return await client.sendMessage(from, {
        text: "*📛 ᴛʜɪs ɪs ᴀɴ ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅ.*"
      }, { quoted: message });
    }

    if (!match.quoted) {
      return await client.sendMessage(from, {
        text: "*🍁 ᴘʟᴇᴀsᴇ ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴠɪᴇᴡ ᴏɴᴄᴇ ᴍᴇssᴀɢᴇ!*"
      }, { quoted: message });
    }

    // بررسی اینکه واقعاً viewOnce هست
    if (!match.quoted.viewOnce) {
      return await client.sendMessage(from, {
        text: "ᴛʜɪs ɪsɴ'ᴛ ᴀ ᴠɪᴇᴡ ᴏɴᴄᴇ ᴍᴇssᴀɢᴇ *ᴅᴜᴍᴍʏ*!"
      }, { quoted: message });
    }

    const buffer = await match.quoted.download();
    const mtype = match.quoted.mtype;
    const options = { quoted: message };

    let messageContent = {};
    switch (mtype) {
      case "imageMessage":
        messageContent = {
          image: buffer,
          caption: match.quoted.text || '',
          mimetype: match.quoted.mimetype || "image/jpeg"
        };
        break;
      case "videoMessage":
        messageContent = {
          video: buffer,
          caption: match.quoted.text || '',
          mimetype: match.quoted.mimetype || "video/mp4"
        };
        break;
      case "audioMessage":
        messageContent = {
          audio: buffer,
          mimetype: "audio/mp4",
          ptt: match.quoted.ptt || false
        };
        break;
      default:
        return await client.sendMessage(from, {
          text: "❌ ᴏɴʟʏ ɪᴍᴀɢᴇ, ᴠɪᴅᴇᴏ, ᴀɴᴅ ᴀᴜᴅɪᴏ ᴍᴇssᴀɢᴇs ᴀʀᴇ sᴜᴘᴘᴏʀᴛᴇᴅ"
        }, { quoted: message });
    }

    await client.sendMessage(from, messageContent, options);
  } catch (error) {
    console.error("vv Error:", error);
    await client.sendMessage(from, {
      text: "❌ Error fetching vv message:\n" + error.message
    }, { quoted: message });
  }
});

cmd({
  pattern: "antiviewonce",
  desc: "Configure ANTIVIEWONCE system with menu",
  category: "owner",
  react: "🛡️",
  filename: __filename
}, async (conn, mek, m, { from, isCreator, reply }) => {
  try {
    if (!isCreator) return reply("*sᴏʀʀʏ ʙᴜᴛ ʏᴏᴜ ᴀɪɴ'ᴛ ᴘᴇʀᴍɪᴛᴛᴇᴅ ᴛᴏ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");

    const currentMode =
      config.ANTIVIEW_ONCE === "all"
        ? "All Chats"
        : config.ANTIVIEW_ONCE === "private"
        ? "Private Only"
        : config.ANTIVIEW_ONCE === "group"
        ? "Groups Only"
        : "Disabled";

    const text = `> *𝐀𝐍𝐓𝐈𝐕𝐈𝐄𝐖𝐎𝐍𝐂𝐄 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒*\n\n> ᴄᴜʀʀᴇɴᴛ ᴍᴏᴅᴇ: *${currentMode}*\n\nʀᴇᴘʟʏ ᴡɪᴛʜ:\n\n*1.* ᴇɴᴀʙʟᴇ ᴀɴᴛɪᴠɪᴇᴡᴏɴᴄᴇ => ᴀʟʟ ᴄʜᴀᴛs\n*2.* ᴇɴᴀʙʟᴇ ᴀɴᴛɪᴠɪᴇᴡᴏɴᴄᴇ => ᴘʀɪᴠᴀᴛᴇ ᴏɴʟʏ\n*3.* ᴇɴᴀʙʟᴇ ᴀɴᴛɪᴠɪᴇᴡᴏɴᴄᴇ => ɢʀᴏᴜᴘs ᴏɴʟʏ\n*4.* Disable ᴀɴᴛɪᴠɪᴇᴡᴏɴᴄᴇ\n\n╭────────────────\n│ *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅʏʙʏ ᴛᴇᴄʜ*\n╰─────────────────◆`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: "https://files.catbox.moe/2ozipw.jpg" },
      caption: text
    }, { quoted: mek });

    const messageID = sentMsg.key.id;

    const handler = async (msgData) => {
      try {
        const receivedMsg = msgData.messages[0];
        if (!receivedMsg?.message || !receivedMsg.key?.remoteJid) return;

        const quotedId = receivedMsg.message?.extendedTextMessage?.contextInfo?.stanzaId;
        const isReply = quotedId === messageID;
        if (!isReply) return;

        const replyText =
          receivedMsg.message?.conversation ||
          receivedMsg.message?.extendedTextMessage?.text || "";

        const sender = receivedMsg.key.remoteJid;

        if (replyText === "1") {
          config.ANTIVIEW_ONCE = "all";
          await conn.sendMessage(sender, { text: "✅ ᴀɴᴛɪᴠɪᴇᴡᴏɴᴄᴇ ᴇɴᴀʙʟᴇᴅ ғᴏʀ *ᴀʟʟ ᴄʜᴀᴛs*." }, { quoted: receivedMsg });
        } else if (replyText === "2") {
          config.ANTIVIEW_ONCE = "private";
          await conn.sendMessage(sender, { text: "✅ ᴀɴᴛɪᴠɪᴇᴡᴏɴᴄᴇ ᴇɴᴀʙʟᴇᴅ ғᴏʀ *ᴘʀɪᴠᴀᴛᴇ ᴄʜᴀᴛs ᴏɴʟʏ*." }, { quoted: receivedMsg });
        } else if (replyText === "3") {
          config.ANTIVIEW_ONCE = "group";
          await conn.sendMessage(sender, { text: "✅ ᴀɴᴛɪᴠɪᴇᴡᴏɴᴄᴇ ᴇɴᴀʙʟᴇᴅ ғᴏʀ *ɢʀᴏᴜᴘs ᴏɴʟʏ*." }, { quoted: receivedMsg });
        } else if (replyText === "4") {
          config.ANTIVIEW_ONCE = "off";
          await conn.sendMessage(sender, { text: "❌ ᴀɴᴛɪᴠɪᴇᴡᴏɴᴄᴇ ʜᴀs ʙᴇᴇɴ *disabled*." }, { quoted: receivedMsg });
        } else {
          await conn.sendMessage(sender, { text: "❌ ɪɴᴠᴀʟɪᴅ ᴏᴘᴛɪᴏɴ. ᴘʟᴇᴀsᴇ ʀᴇᴘʟʏ ᴡɪᴛʜ 1, 2, 3, or 4." }, { quoted: receivedMsg });
        }

        conn.ev.off("messages.upsert", handler);
      } catch (err) {
        console.log("AntiViewOnce handler error:", err);
      }
    };

    conn.ev.on("messages.upsert", handler);

    setTimeout(() => {
      conn.ev.off("messages.upsert", handler);
    }, 600000); // 10 دقیقه
  } catch (e) {
    reply(`❗ Error: ${e.message}`);
  }
});

cmd({
  on: "body"
}, async (conn, m, store, { from, isGroup }) => {
  try {
    const mode = config.ANTIVIEW_ONCE;

    if (mode === "off") return;
    if (mode === "private" && isGroup) return;
    if (mode === "group" && !isGroup) return;

    const msg = m.message;
    if (!msg?.viewOnceMessage?.message) return;

    const viewOnceContent = msg.viewOnceMessage.message;
    const mtype = Object.keys(viewOnceContent)[0];
    const content = viewOnceContent[mtype];

    // دانلود کامل محتوا مثل vv
    const buffer = await conn.downloadMediaMessage({ message: viewOnceContent });
    if (!buffer) return;

    const caption = content?.caption || "";
    const sendOptions = { quoted: m };

    // ارسال دقیقا مثل vv
    if (mtype === "imageMessage") {
      await conn.sendMessage(from, {
        image: buffer,
        caption: caption,
        mimetype: content.mimetype || "image/jpeg"
      }, sendOptions);
    } else if (mtype === "videoMessage") {
      await conn.sendMessage(from, {
        video: buffer,
        caption: caption,
        mimetype: content.mimetype || "video/mp4"
      }, sendOptions);
    } else if (mtype === "audioMessage") {
      await conn.sendMessage(from, {
        audio: buffer,
        mimetype: content.mimetype || "audio/mp4",
        ptt: content.ptt || false
      }, sendOptions);
    } else {
      await conn.sendMessage(from, {
        text: "❌ ᴏɴʟʏ ɪᴍᴀɢᴇ, ᴠɪᴅᴇᴏ, ᴀɴᴅ ᴀᴜᴅɪᴏ ᴠɪᴇᴡ-ᴏɴᴄᴇ ᴍᴇssᴀɢᴇs ᴀʀᴇ sᴜᴘᴘᴏʀᴛᴇᴅ."
      }, sendOptions);
    }

  } catch (err) {
    console.error("AntiViewOnce Auto Error:", err);
  }
});
