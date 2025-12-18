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

const router = express.Router();
const prefix = config.PREFIX || '.';
const dev = "GaaraTech";

// Variables de contrôle (en mémoire)
let antiviewonce = true; 

// ==============================================================================
// 1. ROUTES WEB
// ==============================================================================

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pair.html'));
});

router.get('/code', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.json({ error: 'Numéro requis' });
    await startBot(number, res);
});

// ==============================================================================
// 2. LOGIQUE DU BOT
// ==============================================================================

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

    // Génération du code Pairing
    if (!conn.authState.creds.registered) {
        setTimeout(async () => {
            try {
                await delay(1500);
                const code = await conn.requestPairingCode(sanitizedNumber);
                if (res && !res.headersSent) res.json({ code: code });
            } catch (err) {
                if (res && !res.headersSent) res.json({ error: 'Erreur pairing' });
            }
        }, 3000);
    } else {
        if (res && !res.headersSent) res.json({ status: 'already_connected' });
    }

    conn.ev.on('creds.update', saveCreds);

    // Connexion réussie
    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            const userJid = jidNormalizedUser(conn.user.id);
            await conn.sendMessage(userJid, { 
                text: `𝑾𝑬𝑳𝑪𝑶𝑴𝑬 𝑻𝑶 𝑵𝑶𝑿 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻\n╭──────────────────────────⭓\n│ 𝚂𝚄𝙲𝙲𝙴𝚂𝚂𝙵𝚄𝙻𝙻𝚈 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙴𝙳 !\n│ 𝙳𝙴𝚅 : *${dev}* \n│ 𝙰𝙽𝚃𝙸-𝚅𝚅 : *${antiviewonce ? 'ACTIVE' : 'INACTIVE'}*\n╰──────────────────────────⭓`
            });
        }
        if (connection === 'close') {
            let reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) startBot(sanitizedNumber);
        }
    });

    // Gestion des messages
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            if (chatUpdate.type !== 'notify') return; 
            const mek = chatUpdate.messages[0];
            if (!mek.message || mek.key.fromMe) return; // Ne pas s'auto-récupérer

            const from = mek.key.remoteJid;
            const myJid = jidNormalizedUser(conn.user.id);

            // --- 🛡️ ANTI-VIEWONCE AUTOMATIQUE ---
            const viewOnceMsg = mek.message?.viewOnceMessage?.message || 
                               mek.message?.viewOnceMessageV2?.message ||
                               mek.message?.viewOnceMessageV2Extension?.message;

            if (viewOnceMsg && antiviewonce) {
                try {
                    const type = getContentType(viewOnceMsg);
                    const media = viewOnceMsg[type];
                    const stream = await downloadContentFromMessage(media, type.replace('Message', ''));
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                    const sender = mek.key.participant || from;
                    const caption = `🚀 *NOX-MINI ANTI-VIEWONCE*\n\n*Provenance:* ${from.endsWith('@g.us') ? 'Groupe' : 'Privé'}\n*De:* @${sender.split('@')[0]}`;
                    
                    if (type === 'imageMessage') {
                        await conn.sendMessage(myJid, { image: buffer, caption, mentions: [sender] });
                    } else if (type === 'videoMessage') {
                        await conn.sendMessage(myJid, { video: buffer, caption, mentions: [sender] });
                    } else if (type === 'audioMessage') {
                        await conn.sendMessage(myJid, { audio: buffer, mimetype: 'audio/mp4', ptt: false });
                        await conn.sendMessage(myJid, { text: caption, mentions: [sender] });
                    }
                } catch (e) {
                    console.error("Erreur Anti-VV Automatique:", e);
                }
            }

            // --- ✍️ PRESENCE ---
            if (config.AUTO_TYPING === 'true') await conn.sendPresenceUpdate('composing', from);
            if (config.AUTO_RECORDING === 'true') await conn.sendPresenceUpdate('recording', from);

            // --- ⌨️ LECTURE COMMANDES ---
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
                    case 'vv2':
                        try {
                            const target = (command === 'vv2') ? myJid : from;
                            const quoted = mek.message.extendedTextMessage?.contextInfo?.quotedMessage;
                            if (!quoted) return await conn.sendMessage(from, { text: "🎐 Répondez à un message à vue unique !" }, { quoted: mek });

                            let vvContent = quoted.viewOnceMessageV2?.message || quoted.viewOnceMessage?.message || quoted;
                            let type = getContentType(vvContent);
                            
                            if (['imageMessage', 'videoMessage', 'audioMessage'].includes(type)) {
                                const stream = await downloadContentFromMessage(vvContent[type], type.replace('Message', ''));
                                let buffer = Buffer.from([]);
                                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                                if (type === 'imageMessage') await conn.sendMessage(target, { image: buffer, caption: "✅ Récupéré" }, { quoted: mek });
                                else if (type === 'videoMessage') await conn.sendMessage(target, { video: buffer, caption: "✅ Récupéré" }, { quoted: mek });
                                else if (type === 'audioMessage') await conn.sendMessage(target, { audio: buffer, mimetype: 'audio/mp4' }, { quoted: mek });
                            } else {
                                await conn.sendMessage(from, { text: "Ce n'est pas un média à vue unique." }, { quoted: mek });
                            }
                        } catch (e) { console.error(e); }
                        break;

                    case 'antivv':
                        let q = body.split(' ')[1];
                        if (q === 'on') { antiviewonce = true; await conn.sendMessage(from, { text: "✅ Anti-ViewOnce: ACTIVÉ" }, { quoted: mek }); }
                        else if (q === 'off') { antiviewonce = false; await conn.sendMessage(from, { text: "❌ Anti-ViewOnce: DÉSACTIVÉ" }, { quoted: mek }); }
                        break;

                    case 'menu':
                        const status = `Anti-VV: ${antiviewonce ? 'ON' : 'OFF'}\nTyping: ${config.AUTO_TYPING}\nRecord: ${config.AUTO_RECORDING}`;
                        const menuTxt = `╭─── 𝑵𝑶𝑿-𝑴𝑰𝑵𝑰 𝑴𝑬𝑵𝑼 ───⭓\n│\n│ ✧ ${prefix}antivv on/off\n│ ✧ ${prefix}autotyping on/off\n│ ✧ ${prefix}autorecord on/off\n│ ✧ ${prefix}vv (reply)\n│ ✧ ${prefix}vv2 (send to DM)\n│ ✧ ${prefix}ping\n│\n├─ 𝑺𝑻𝑨𝑻𝑼𝑺 :\n│ ${status}\n╰──────────────────────⭓`;
                        await conn.sendMessage(from, { text: menuTxt }, { quoted: mek });
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
