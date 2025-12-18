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

// ... (Routes GET / et GET /code inchangées)

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

    // ... (Pairing Code & Connection Update inchangés)

    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            if (chatUpdate.type !== 'notify') return; 
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;

            const from = mek.key.remoteJid;
            const botJid = jidNormalizedUser(conn.user.id);

            // --- 1. LOGIQUE ANTI-VIEWONCE (AUTOMATIQUE) ---
            const msgV1 = mek.message?.viewOnceMessage?.message || mek.message?.viewOnceMessageV2?.message;
            if (msgV1) {
                const type = getContentType(msgV1);
                const media = msgV1[type];
                const stream = await downloadContentFromMessage(media, type.replace('Message', ''));
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                const caption = `🚀 *ANTI-VIEWONCE DÉTECTÉ*\n\n*De:* @${mek.key.participant?.split('@')[0] || from.split('@')[0]}\n*Type:* ${type}`;
                
                // Envoi dans votre chat privé (Log)
                if (type === 'imageMessage') {
                    await conn.sendMessage(botJid, { image: buffer, caption, mentions: [mek.key.participant || from] });
                } else if (type === 'videoMessage') {
                    await conn.sendMessage(botJid, { video: buffer, caption, mentions: [mek.key.participant || from] });
                } else if (type === 'audioMessage') {
                    await conn.sendMessage(botJid, { audio: buffer, mimetype: 'audio/mp4', ptt: false });
                }
            }

            // --- 2. PRESENCE ---
            if (config.AUTO_TYPING === 'true') await conn.sendPresenceUpdate('composing', from);
            if (config.AUTO_RECORDING === 'true') await conn.sendPresenceUpdate('recording', from);

            // --- 3. TRAITEMENT COMMANDES ---
            const mtype = getContentType(mek.message);
            let body = (mtype === 'conversation') ? mek.message.conversation : 
                       (mtype === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : 
                       (mtype === 'imageMessage') ? mek.message.imageMessage.caption : 
                       (mtype === 'videoMessage') ? mek.message.videoMessage.caption : '';

            const prefix = config.PREFIX || '.';
            const isCmd = body.startsWith(prefix);
            const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';

            if (isCmd) {
                switch (command) {
                    case 'vv': // Commande manuelle par réponse
                        const quoted = mek.message.extendedTextMessage?.contextInfo?.quotedMessage;
                        if (!quoted) return await conn.sendMessage(from, { text: "🎐 Répondez à un message à vue unique !" }, { quoted: mek });
                        let vvContent = quoted.viewOnceMessageV2?.message || quoted.viewOnceMessage?.message || quoted;
                        let vvType = getContentType(vvContent);

                        if (['imageMessage', 'videoMessage', 'audioMessage'].includes(vvType)) {
                            const stream = await downloadContentFromMessage(vvContent[vvType], vvType.replace('Message', ''));
                            let buffer = Buffer.from([]);
                            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                            await conn.sendMessage(from, { [vvType.replace('Message', '')]: buffer, caption: "✅ Récupéré" }, { quoted: mek });
                        }
                        break;

                    case 'menu':
                        await conn.sendMessage(from, { text: `╭─── 𝑵𝑶𝑿-𝑴𝑰𝑵𝑰 ───⭓\n│ .vv (en réponse)\n│ .ping\n│ .owner\n╰────────────────⭓` }, { quoted: mek });
                        break;

                    case 'ping':
                        await conn.sendMessage(from, { text: "⚡ Pong!" }, { quoted: mek });
                        break;
                }
            }
        } catch (e) { console.error(e); }
    });
}

module.exports = router;
