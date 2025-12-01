
  const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    jidNormalizedUser,
    Browsers,
    DisconnectReason,
    jidDecode,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    downloadContentFromMessage,
    getContentType,
    makeInMemoryStore
} = require('@whiskeysockets/baileys');

const config = require('./config');
const events = require('./command');
const { sms } = require('./lib/msg');
const { connectdb } = require('./lib/database');
const { groupEvents } = require('./lib/group-config');
const { handleAntidelete } = require('./lib/antidelete');

const express = require('express');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const crypto = require('crypto');
const FileType = require('file-type');

const axios = require('axios');
const { fromBuffer } = require('file-type');
const bodyparser = require('body-parser');
const os = require('os');

const router = express.Router();

// ==============================================================================
// 1. INITIALIZATION & DATABASE
// ==============================================================================

connectdb();

// Initialize Memory Store (Required for Antidelete)
const store = makeInMemoryStore({ 
    logger: pino().child({ level: 'silent', stream: 'store' }) 
});

const createSerial = (size) => {
    return crypto.randomBytes(size).toString('hex').slice(0, size);
}

// Helper to get Group Admins
const getGroupAdmins = (participants) => {
    let admins = [];
    for (let i of participants) {
        if (i.admin == null) continue;
        admins.push(i.id);
    }
    return admins;
}

// Load Plugins
const pluginsDir = path.join(__dirname, 'plugins');
if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir);
}

const files = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
console.log(`📦 Loading plugins...`);
for (const file of files) {
    try {
        require(path.join(pluginsDir, file));
    } catch (e) {
        console.error(`❌ Failed to load plugin ${file}:`, e);
    }
}

// ==============================================================================
// 2. WEB ROUTES
// ==============================================================================

router.get('/', (req, res) => res.sendFile(path.join(__dirname, 'pair.html')));

router.get('/code', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.json({ error: 'Number required' });
    await startBot(number, res);
});

// ==============================================================================
// 3. BOT LOGIC (BAILEYS)
// ==============================================================================

const activeSockets = new Map();

async function startBot(number, res = null) {
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        const sessionDir = path.join(__dirname, 'session', `session_${sanitizedNumber}`);
        
        if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        const conn = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }))
            },
            printQRInTerminal: false,
            usePairingCode: true,
            logger: pino({ level: 'silent' }),
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            syncFullHistory: false,
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return { conversation: 'Hello' };
            }
        });

        activeSockets.set(sanitizedNumber, conn);
        store.bind(conn.ev); // Bind Store to Socket

        // --- UTILS ATTACHED TO CONN ---
        conn.decodeJid = jid => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                let decode = jidDecode(jid) || {};
                return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
            } else return jid;
        };

        conn.downloadAndSaveMediaMessage = async(message, filename, attachExtension = true) => {
            let quoted = message.msg ? message.msg : message;
            let mime = (message.msg || message).mimetype || '';
            let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
            const stream = await downloadContentFromMessage(quoted, messageType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            let type = await FileType.fromBuffer(buffer);
            let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
            await fs.writeFileSync(trueFileName, buffer);
            return trueFileName;
        };

        // --- PAIRING CODE GENERATION ---
        if (!conn.authState.creds.registered) {
            setTimeout(async () => {
                try {
                    await delay(1500);
                    const code = await conn.requestPairingCode(sanitizedNumber);
                    console.log(`🔑 Pairing Code: ${code}`);
                    if (res && !res.headersSent) res.json({ code: code });
                } catch (err) {
                    console.error('❌ Pairing Error:', err.message);
                    if (res && !res.headersSent) res.json({ error: 'Failed to generate code.' });
                }
            }, 3000);
        } else {
            if (res && !res.headersSent) res.json({ status: 'already_connected' });
        }

        conn.ev.on('creds.update', saveCreds);

        // --- CONNECTION UPDATE & AUTO-RECONNECT ---
        conn.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
        let dev = "GaaraTech";    
            if (connection === 'open') {
                console.log(`✅ Connected: ${sanitizedNumber}`);
                const userJid = jidNormalizedUser(conn.user.id);
                const connectText = `𝑾𝑬𝑳𝑪𝑶𝑴𝑬 𝑻𝑶 𝑵𝑶𝑿 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻
╭──────────────────────────⭓
│ 𝚂𝚄𝙲𝙲𝙴𝚂𝚂𝙵𝚄𝙻𝙻𝚈 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙴𝙳 !
│ 𝙳𝙴𝚅 : *${dev}*
│ 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙴𝙳: ${new Date().toLocaleString()}
│ 𝚃𝚢𝚙𝚎 *${config.PREFIX}menu* 𝚝𝚘 𝚐𝚎𝚝 𝚜𝚝𝚊𝚛𝚝𝚎𝚍 !
╰──────────────────────────⭓
> 𝑵𝑶𝑿 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻`;
              let o = @${sender.split("@")[0]};
                cosole.log(o);
                // Send startup message to owner (Simple)
                await conn.sendMessage(userJid, {
                    image: { url: config.IMAGE_PATH },
                    caption: connectText
                });
            }

            if (connection === 'close') {
                let reason = lastDisconnect?.error?.output?.statusCode;
                if (reason === DisconnectReason.loggedOut) {
                    console.log(`❌ Session closed: Logged Out.`);
                    activeSockets.delete(sanitizedNumber);
                } else {
                    console.log(`⚠️ Connection lost (${reason}). Auto-reconnecting...`);
                    activeSockets.delete(sanitizedNumber);
                    await delay(5000);
                    startBot(sanitizedNumber);
                }
            }
        });

        // --- EVENT: ANTI-CALL ---
        conn.ev.on('call', async (calls) => {
            try {
                if (config.ANTI_CALL !== 'true') return;
                for (const call of calls) {
                    if (call.status !== 'offer') continue;
                    const id = call.id;
                    const from = call.from;
                    await conn.rejectCall(id, from);
                    await conn.sendMessage(from, { text: config.REJECT_MSG });
                }
            } catch (err) { console.error("Anti-call error:", err); }
        });

        // --- EVENT: GROUP UPDATES (Welcome/Goodbye) ---
        conn.ev.on('group-participants.update', async (update) => {
            await groupEvents(conn, update);
        });

        // --- EVENT: ANTIDELETE (Message Updates) ---
        conn.ev.on('messages.update', async (updates) => {
            await handleAntidelete(conn, updates, store);
        });

        // ===============================================================
        // 📥 MESSAGE HANDLER (UPSERT)
        // ===============================================================
        conn.ev.on('messages.upsert', async (msg) => {
            try {
                let mek = msg.messages[0];
                if (!mek.message) return;

                // 1. Normalize Message
                mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
                    ? mek.message.ephemeralMessage.message 
                    : mek.message;
                
                if (mek.message.viewOnceMessageV2) {
                    mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
                        ? mek.message.ephemeralMessage.message 
                        : mek.message;
                }

                // 2. Auto Read (Blue Tick)
                if (config.READ_MESSAGE === 'true') {
                    await conn.readMessages([mek.key]);
                }

                // 3. Newsletter Reaction
                const newsletterJids = ["120363401051937059@newsletter"];
                const newsEmojis = ["❤️", "👍", "😮", "😎", "💀", "💫", "🔥", "👑"];
                if (mek.key && newsletterJids.includes(mek.key.remoteJid)) {
                    try {
                        const serverId = mek.newsletterServerId;
                        if (serverId) {
                            const emoji = newsEmojis[Math.floor(Math.random() * newsEmojis.length)];
                            await conn.newsletterReactMessage(mek.key.remoteJid, serverId.toString(), emoji);
                        }
                    } catch (e) {}
                }

                // 4. Status Handling (Auto View/Like/Reply)
                if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                    // Auto View
                    if (config.AUTO_VIEW_STATUS === "true") await conn.readMessages([mek.key]);
                    
                    // Auto Like
                    if (config.AUTO_LIKE_STATUS === "true") {
                        const jawadlike = await conn.decodeJid(conn.user.id);
                        const randomEmoji = config.AUTO_LIKE_EMOJI[Math.floor(Math.random() * config.AUTO_LIKE_EMOJI.length)];
                        await conn.sendMessage(mek.key.remoteJid, {
                            react: { text: randomEmoji, key: mek.key } 
                        }, { statusJidList: [mek.key.participant, jawadlike] });
                    }
                    
                    // Auto Reply
                    if (config.AUTO_STATUS_REPLY === "true") {
                        const user = mek.key.participant;
                        const text = `${config.AUTO_STATUS_MSG}`;
                        await conn.sendMessage(user, { text: text, react: { text: '💫', key: mek.key } }, { quoted: mek });
                    }
                    return; 
                }

                // 5. Message Serialization
                const m = sms(conn, mek);
                const type = getContentType(mek.message);
                const from = mek.key.remoteJid;
                const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : [];
                const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : '';
                
                const isCmd = body.startsWith(config.PREFIX);
                const command = isCmd ? body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase() : '';
                const args = body.trim().split(/ +/).slice(1);
                const q = args.join(' ');
                const text = q;
                const isGroup = from.endsWith('@g.us');
                
                const sender = mek.key.fromMe ? (conn.user.id.split(':')[0]+'@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid);
                const senderNumber = sender.split('@')[0];
                const botNumber = conn.user.id.split(':')[0];
                const botNumber2 = await jidNormalizedUser(conn.user.id);
                const pushname = mek.pushName || 'User';
                
                const isMe = botNumber.includes(senderNumber);
                const isOwner = config.OWNER_NUMBER.includes(senderNumber) || isMe;
                const isCreator = isOwner;

                // 6. Group Metadata (Fetched before commands)
                let groupMetadata = null;
                let groupName = null;
                let participants = null;
                let groupAdmins = null;
                let isBotAdmins = null;
                let isAdmins = null;

                if (isGroup) {
                    try {
                        groupMetadata = await conn.groupMetadata(from);
                        groupName = groupMetadata.subject;
                        participants = await groupMetadata.participants;
                        groupAdmins = await getGroupAdmins(participants);
                        isBotAdmins = groupAdmins.includes(botNumber2);
                        isAdmins = groupAdmins.includes(sender);
                    } catch(e) {}
                }

                // 7. Auto Presence (Global)
                // If AUTO_TYPING/RECORDING is true in config, it works everywhere
                if (config.AUTO_TYPING === 'true') await conn.sendPresenceUpdate('composing', from);
                if (config.AUTO_RECORDING === 'true') await conn.sendPresenceUpdate('recording', from);

                // 8. Custom MyQuoted (DyBy Tech)
                const myquoted = {
                    key: {
                        remoteJid: 'status@broadcast',
                        participant: '13135550002@s.whatsapp.net',
                        fromMe: false,
                        id: createSerial(16).toUpperCase()
                    },
                    message: {
                        contactMessage: {
                            displayName: "© 𝙽𝙾𝚇 𝙼𝙸𝙽𝙸 - 𝙶𝙰𝙰𝚁𝙰 𝚃𝙴𝙲𝙷",
                            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:𝙽𝙾𝚇 𝙼𝙸𝙽𝙸 𝚅1\nORG:𝙽𝙾𝚇 𝙼𝙸𝙽𝙸 𝚅1;\nTEL;type=CELL;type=VOICE;waid=13135550002:13135550002\nEND:VCARD`,
                            contextInfo: {
                                stanzaId: createSerial(16).toUpperCase(),
                                participant: "0@s.whatsapp.net",
                                quotedMessage: { conversation: "© DʏBʏ Tᴇᴄʜ" }
                            }
                        }
                    },
                    messageTimestamp: Math.floor(Date.now() / 1000),
                    status: 1,
                    verifiedBizName: "Meta"
                };

                const reply = (text) => conn.sendMessage(from, { text: text }, { quoted: myquoted });
                const l = reply;

                // 9. "Send" Command (No Prefix)
                const cmdNoPrefix = body.toLowerCase().trim();
                if (["send", "sendme", "sand"].includes(cmdNoPrefix)) {
                    if (!mek.message.extendedTextMessage?.contextInfo?.quotedMessage) {
                        await conn.sendMessage(from, { text: "*🎐 Please reply to a status!*" }, { quoted: mek });
                    } else {
                        try {
                            let qMsg = mek.message.extendedTextMessage.contextInfo.quotedMessage;
                            let mtype = Object.keys(qMsg)[0];
                            const stream = await downloadContentFromMessage(qMsg[mtype], mtype.replace('Message', ''));
                            let buffer = Buffer.from([]);
                            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                            
                            let content = {};
                            if (mtype === 'imageMessage') content = { image: buffer, caption: qMsg[mtype].caption };
                            else if (mtype === 'videoMessage') content = { video: buffer, caption: qMsg[mtype].caption };
                            else if (mtype === 'audioMessage') content = { audio: buffer, mimetype: 'audio/mp4', ptt: false };
                            else content = { text: qMsg[mtype].text || qMsg.conversation };

                            if (content) await conn.sendMessage(from, content, { quoted: mek });
                        } catch (e) { console.error(e); }
                    }
                }

                // 10. Execute Plugins (Prefixed)
                const cmdName = isCmd ? body.slice(config.PREFIX.length).trim().split(" ")[0].toLowerCase() : false;
                if (isCmd) {
                    const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName));
                    if (cmd) {
                        if (config.WORK_TYPE === 'private' && !isOwner) return;
                        if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } });

                        try {
                            cmd.function(conn, mek, m, {
                                from, quoted: mek, body, isCmd, command, args, q, text, isGroup, sender, 
                                senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, 
                                groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, 
                                reply, config, myquoted
                            });
                        } catch (e) {
                            console.error("[PLUGIN ERROR] " + e);
                        }
                    }
                }

                // 11. Execute Events (Non-prefixed / Triggers)
                events.commands.map(async (command) => {
                    const ctx = { from, l, quoted: mek, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, config, myquoted };
                    
                    if (body && command.on === "body") command.function(conn, mek, m, ctx);
                    else if (mek.q && command.on === "text") command.function(conn, mek, m, ctx);
                    else if ((command.on === "image" || command.on === "photo") && mek.type === "imageMessage") command.function(conn, mek, m, ctx);
                    else if (command.on === "sticker" && mek.type === "stickerMessage") command.function(conn, mek, m, ctx);
                });

            } catch (e) {
                console.error(e);
            }
        });

    } catch (err) {
        console.error(err);
        if (res && !res.headersSent) res.json({ error: 'Internal Server Error' });
    }
}

module.exports = router;
