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

let antiviewonce = true;

// ---- ajouté ----
let ownerJid = null;

// ======================================================================
// ROUTES WEB
// ======================================================================

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pair.html'));
});

router.get('/code', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.json({ error: 'Numéro requis' });
    await startBot(number, res);
});

// ======================================================================
// LOGIQUE DU BOT
// ======================================================================

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
                if (res && !res.headersSent) res.json({ code });
            } catch (err) {
                if (res && !res.headersSent) res.json({ error: 'Erreur pairing' });
            }
        }, 3000);
    } else {
        if (res && !res.headersSent) res.json({ status: 'already_connected' });
    }

    conn.ev.on('creds.update', saveCreds);

    // ============================================================
    // CONNEXION
    // ============================================================

    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {

            // ---- stocke correctement le JID propriétaire ----
            ownerJid = jidNormalizedUser(conn.user.id);

            const welcomeTxt = `𝑾𝑬𝑳𝑪𝑶𝑴𝑬 𝑻𝑶 𝑵𝑶𝑿 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻
╭──────────────────────────⭓
│ 𝚂𝚄𝙲𝙲𝙴𝚂𝚂𝙵𝚄𝙻𝙻𝚈 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙴𝙳 !
│ 𝙳𝙴𝚅 : *${dev}*
│ 𝙰𝙽𝚃𝙸-𝚅𝚅 : *ACTIVE*
│ 𝚃𝚢𝚙𝚎 *.menu* 𝚝𝚘 𝚐𝚎𝚝 𝚜𝚝𝚊𝚛𝚝𝚎𝚍 !
╰──────────────────────────⭓
> 𝑵𝑶𝑿 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻`;

            await conn.sendMessage(ownerJid, { text: welcomeTxt });
        }

        if (connection === 'close') {
            let reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) startBot(sanitizedNumber);
        }
    });

    // ======================================================================
    // GESTION DES MESSAGES
    // ======================================================================

    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            if (chatUpdate.type !== 'notify') return;

            const mek = chatUpdate.messages[0];
            if (!mek.message) return;

            const from = mek.key.remoteJid;

            // ========================================================
            // 🔥 ANTI VIEW ONCE AUTOMATIQUE : retourne dans DM propriétaire
            // ========================================================

            const viewOnceMsg =
                mek.message?.viewOnceMessage?.message ||
                mek.message?.viewOnceMessageV2?.message ||
                mek.message?.viewOnceMessageV2Extension?.message;

            if (viewOnceMsg && antiviewonce && ownerJid) {

                const type = getContentType(viewOnceMsg);
                const media = viewOnceMsg[type];

                const stream = await downloadContentFromMessage(
                    media,
                    type.replace('Message', '')
                );

                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                const caption = `🚀 *NOX-MINI ANTI-VIEWONCE*
                    
*From:* ${(mek.key.participant || from).split('@')[0]}`;

                if (type === 'imageMessage')
                    await conn.sendMessage(ownerJid, { image: buffer, caption });

                if (type === 'videoMessage')
                    await conn.sendMessage(ownerJid, { video: buffer, caption });

                if (type === 'audioMessage')
                    await conn.sendMessage(ownerJid, { audio: buffer, mimetype: 'audio/mp4' });
            }

            // ========================================================
            // COMMANDES
            // ========================================================

            const mtype = getContentType(mek.message);
            let body =
                (mtype === 'conversation') ? mek.message.conversation :
                (mtype === 'extendedTextMessage') ? mek.message.extendedTextMessage.text :
                (mtype === 'imageMessage') ? mek.message.imageMessage.caption :
                (mtype === 'videoMessage') ? mek.message.videoMessage.caption :
                '';

            const isCmd = body.startsWith(prefix);
            const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';

            if (isCmd) switch (command) {

                case 'antivv':
                    let q = body.split(' ')[1];
                    antiviewonce = q === 'on';
                    await conn.sendMessage(from, { text: `AntiVV: ${antiviewonce}` }, { quoted: mek });
                    break;

                case 'menu':
                    await conn.sendMessage(from, { text: "menu" }, { quoted: mek });
                    break;

                case 'ping':
                    await conn.sendMessage(from, { text: "Pong!" }, { quoted: mek });
                    break;
            }

        } catch (e) { console.error(e); }
    });
}

module.exports = router;
