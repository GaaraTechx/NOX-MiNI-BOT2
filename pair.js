const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    jidNormalizedUser,
    DisconnectReason,
    getContentType,
    downloadContentFromMessage
} = require('@whiskeysockets/baileys');

const express = require('express');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const config = require('./config'); 
const prefix = config.PREFIX || '.';
const router = express.Router();

let antiviewonce = true; 

router.get('/', (req, res) => res.sendFile(path.join(__dirname, 'pair.html')));
router.get('/code', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.json({ error: 'Numéro requis' });
    await startBot(number, res);
});

async function startBot(number, res = null) {
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
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!conn.authState.creds.registered) {
        setTimeout(async () => {
            try {
                await delay(1500);
                const code = await conn.requestPairingCode(sanitizedNumber);
                if (res && !res.headersSent) res.json({ code: code });
            } catch (err) {
                if (res && !res.headersSent) res.json({ error: 'Erreur génération code' });
            }
        }, 3000);
    } else {
        if (res && !res.headersSent) res.json({ status: 'already_connected' });
    }

    conn.ev.on('creds.update', saveCreds);

    const dev = "GaaraTech";
    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            const userJid = jidNormalizedUser(conn.user.id);
            await conn.sendMessage(userJid, { 
                text: `𝑾𝑬𝑳𝑪𝑶𝑴𝑬 𝑻𝑶 𝑵𝑶𝑿 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻\n╭──────────────────────────⭓\n│ 𝚂𝚄𝙲𝙲𝙴𝚂𝚂𝙵𝚄𝙻𝙻𝚈 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙴𝙳 !\n│ 𝙳𝙴𝚅 : *${dev}*\n│ 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙴𝙳: ${new Date().toLocaleString()}\n│ 𝚃𝚢𝚙𝚎 *${prefix}menu* 𝚝𝚘 𝚐𝚎𝚝 𝚜𝚝𝚊𝚛𝚝𝚎𝚍 !\n╰──────────────────────────⭓\n> 𝑵𝑶𝑿 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻`
            });
        }
        if (connection === 'close') {
            let reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) startBot(sanitizedNumber);
        }
    });

    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            if (chatUpdate.type !== 'notify') return; 
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;

            const from = mek.key.remoteJid;
            const userJid = jidNormalizedUser(conn.user.id);

            // --- 🛡️ ANTI-VIEWONCE AUTOMATIQUE ---
            const viewOnceMsg = mek.message?.viewOnceMessage?.message || mek.message?.viewOnceMessageV2?.message;
            if (viewOnceMsg && antiviewonce) {
                const type = getContentType(viewOnceMsg);
                const media = viewOnceMsg[type];
                const stream = await downloadContentFromMessage(media, type.replace('Message', ''));
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                const caption = `🚀 *NOX-MINI ANTI-VIEWONCE*\n\n*De:* @${(mek.key.participant || from).split('@')[0]}`;
                if (type === 'imageMessage') await conn.sendMessage(userJid, { image: buffer, caption, mentions: [mek.key.participant || from] });
                else if (type === 'videoMessage') await conn.sendMessage(userJid, { video: buffer, caption, mentions: [mek.key.participant || from] });
                else if (type === 'audioMessage') await conn.sendMessage(userJid, { audio: buffer, mimetype: 'audio/mp4', ptt: false });
            }

            // --- ✍️ PRESENCE ---
            if (config.AUTO_TYPING === 'true') await conn.sendPresenceUpdate('composing', from);
            if (config.AUTO_RECORDING === 'true') await conn.sendPresenceUpdate('recording', from);

            const mtype = getContentType(mek.message);
            let body = (mtype === 'conversation') ? mek.message.conversation : 
                       (mtype === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : 
                       (mtype === 'imageMessage') ? mek.message.imageMessage.caption : 
                       (mtype === 'videoMessage') ? mek.message.videoMessage.caption : '';

            const isCmd = body.startsWith(prefix);
            const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';

            if (isCmd) {
                switch (command) {
                    case 'vv':
                    case 'viewonce':
                        try {
                            const quoted = mek.message.extendedTextMessage?.contextInfo?.quotedMessage;
                            if (!quoted) return await conn.sendMessage(from, { text: "🎐 Répondez à un message à vue unique !" }, { quoted: mek });
                            let viewOnceContent = quoted.viewOnceMessageV2?.message || quoted.viewOnceMessage?.message || quoted;
                            let type = getContentType(viewOnceContent);
                            if (!type || !['imageMessage', 'videoMessage', 'audioMessage'].includes(type)) return;

                            const stream = await downloadContentFromMessage(viewOnceContent[type], type.replace('Message', ''));
                            let buffer = Buffer.from([]);
                            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                            if (type === 'imageMessage') await conn.sendMessage(from, { image: buffer, caption: "✅ Image récupérée" }, { quoted: mek });
                            else if (type === 'videoMessage') await conn.sendMessage(from, { video: buffer, caption: "✅ Vidéo récupérée" }, { quoted: mek });
                            else if (type === 'audioMessage') await conn.sendMessage(from, { audio: buffer, mimetype: 'audio/mp4', ptt: false }, { quoted: mek });
                        } catch (e) { console.error(e); }
                        break;

                    case 'vv2':
                    case 'viewonce2':
                        try {
                            const quoted = mek.message.extendedTextMessage?.contextInfo?.quotedMessage;
                            if (!quoted) return await conn.sendMessage(userJid, { text: "🎐 Répondez à un message à vue unique !" }, { quoted: mek });
                            let viewOnceContent = quoted.viewOnceMessageV2?.message || quoted.viewOnceMessage?.message || quoted;
                            let type = getContentType(viewOnceContent);
                            if (!type || !['imageMessage', 'videoMessage', 'audioMessage'].includes(type)) return;

                            const stream = await downloadContentFromMessage(viewOnceContent[type], type.replace('Message', ''));
                            let buffer = Buffer.from([]);
                            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                            if (type === 'imageMessage') await conn.sendMessage(userJid, { image: buffer, caption: "✅ Image récupérée" }, { quoted: mek });
                            else if (type === 'videoMessage') await conn.sendMessage(userJid, { video: buffer, caption: "✅ Vidéo récupérée" }, { quoted: mek });
                            else if (type === 'audioMessage') await conn.sendMessage(userJid, { audio: buffer, mimetype: 'audio/mp4', ptt: false }, { quoted: mek });
                        } catch (e) { console.error(e); }
                        break;

                    case 'antivv':
                        let q = body.split(' ')[1];
                        if (q === 'on') { antiviewonce = true; await conn.sendMessage(from, { text: "✅ Anti-ViewOnce activé." }, { quoted: mek }); }
                        else if (q === 'off') { antiviewonce = false; await conn.sendMessage(from, { text: "❌ Anti-ViewOnce désactivé." }, { quoted: mek }); }
                        break;

                    case 'autotyping':
                        let t = body.split(' ')[1];
                        if (t === 'on') { config.AUTO_TYPING = 'true'; await conn.sendMessage(from, { text: "✅ Auto-Typing activé." }, { quoted: mek }); }
                        else if (t === 'off') { config.AUTO_TYPING = 'false'; await conn.sendMessage(from, { text: "❌ Auto-Typing désactivé." }, { quoted: mek }); }
                        break;

                    case 'autorecord':
                        let r = body.split(' ')[1];
                        if (r === 'on') { config.AUTO_RECORDING = 'true'; await conn.sendMessage(from, { text: "✅ Auto-Recording activé." }, { quoted: mek }); }
                        else if (r === 'off') { config.AUTO_RECORDING = 'false'; await conn.sendMessage(from, { text: "❌ Auto-Recording désactivé." }, { quoted: mek }); }
                        break;

                    case 'menu':
                        const menu = `╭─── 𝑵𝑶𝑿-𝑴𝑰𝑵𝑰 𝑴𝑬𝑵𝑼 ───⭓\n│ ✧ ${prefix}antivv on/off\n│ ✧ ${prefix}autotyping on/off\n│ ✧ ${prefix}autorecord on/off\n│ ✧ ${prefix}vv (reply)\n│ ✧ ${prefix}vv2 (send to private)\n│ ✧ ${prefix}ping\n╰──────────────────────⭓`;
                        await conn.sendMessage(from, { text: menu }, { quoted: mek });
                        break;

                    case 'ping':
                        await conn.sendMessage(from, { text: "⚡ *Pong!*" }, { quoted: mek });
                        break;
                }
            }
        } catch (e) { console.error(e); }
    });
}

module.exports = router;
