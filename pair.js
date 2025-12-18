const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    jidNormalizedUser,
    DisconnectReason,
    getContentType
} = require('@whiskeysockets/baileys');

const express = require('express');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const config = require('./config'); 

const router = express.Router();

// ==============================================================================
// 1. ROUTES WEB (INTERFACE PAIRING)
// ==============================================================================

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pair.html'));
});

router.get('/code', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.json({ error: 'Numéro de téléphone requis' });
    await startBot(number, res);
});

// ==============================================================================
// 2. LOGIQUE DU BOT & CONNEXION
// ==============================================================================

async function startBot(number, res = null) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const sessionDir = path.join(__dirname, 'session', `session_${sanitizedNumber}`);
    
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

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

    // --- GÉNÉRATION DU CODE DE COUPLAGE ---
    if (!conn.authState.creds.registered) {
        setTimeout(async () => {
            try {
                await delay(1500);
                const code = await conn.requestPairingCode(sanitizedNumber);
                if (res && !res.headersSent) res.json({ code: code });
            } catch (err) {
                console.error("Erreur pairing:", err);
                if (res && !res.headersSent) res.json({ error: 'Erreur lors de la génération' });
            }
        }, 3000);
    } else {
        if (res && !res.headersSent) res.json({ status: 'already_connected' });
    }

    conn.ev.on('creds.update', saveCreds);

    // --- GESTION DE LA CONNEXION ---
    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'open') {
            console.log(`✅ NOX-MINI connecté sur : ${sanitizedNumber}`);
            const userJid = jidNormalizedUser(conn.user.id);
            
            await conn.sendMessage(userJid, { 
                text: "✨ *NOX MINI BOT CONNECTÉ*\n\nAuto-Typing & Auto-Recording: ACTIVÉS ✅" 
            });
        }

        if (connection === 'close') {
            let reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                startBot(sanitizedNumber);
            }
        }
    });

    // ===============================================================
    // 📥 GESTIONNAIRE DE MESSAGES (AVEC AUTO-PRESENCE)
    // ===============================================================
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            // Empêche les doublons
            if (chatUpdate.type !== 'notify') return; 

            const mek = chatUpdate.messages[0];
            if (!mek.message) return;

            const from = mek.key.remoteJid;

            // --- AUTO RECORDING / TYPING ---
            // Le bot simule l'activité dès qu'il reçoit un message
            if (config.AUTO_TYPING === 'true') {
                await conn.sendPresenceUpdate('composing', from);
            }
            if (config.AUTO_RECORDING === 'true') {
                await conn.sendPresenceUpdate('recording', from);
            }

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
                        
                    

        case 'vv':
case 'viewonce':
    try {
        // 1. Vérifier si un message est cité
        const quoted = mek.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) return await conn.sendMessage(from, { text: "🎐 Répondez à un message à vue unique !" }, { quoted: mek });

        // 2. Extraire le contenu réel du View Once (Gestion des couches V2 et V1)
        // On cherche le message à l'intérieur de viewOnceMessageV2 ou viewOnceMessage
        let viewOnceContent = quoted.viewOnceMessageV2?.message || quoted.viewOnceMessage?.message || quoted;

        // 3. Déterminer le type de média (imageMessage, videoMessage, etc.)
        let type = getContentType(viewOnceContent);

        // 4. Vérification stricte du type
        if (!type || !['imageMessage', 'videoMessage', 'audioMessage'].includes(type)) {
            return await conn.sendMessage(from, { text: "❌ Erreur : Le message cité ne contient pas de média à vue unique valide." }, { quoted: mek });
        }

        // 5. Téléchargement du média
        const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
        const media = viewOnceContent[type];
        const stream = await downloadContentFromMessage(media, type.replace('Message', ''));
        
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // 6. Renvoi du média sans la restriction de vue unique
        if (type === 'imageMessage') {
            await conn.sendMessage(from, { image: buffer, caption: media.caption || "✅ Image récupérée" }, { quoted: mek });
        } else if (type === 'videoMessage') {
            await conn.sendMessage(from, { video: buffer, caption: media.caption || "✅ Vidéo récupérée" }, { quoted: mek });
        } else if (type === 'audioMessage') {
            await conn.sendMessage(from, { audio: buffer, mimetype: 'audio/mp4', ptt: false }, { quoted: mek });
        }

    } catch (e) {
        console.error("Erreur VV:", e);
        await conn.sendMessage(from, { text: "❌ Impossible de récupérer ce média." }, { quoted: mek });
    }
    break;


                    case 'menu':
                        const menuMsg = `╭─── 𝑵𝑶𝑿-𝑴𝑰𝑵𝑰 𝑴𝑬𝑵𝑼 ───⭓
│ ✧ ${prefix}ping
│ ✧ ${prefix}owner
│ ✧ ${prefix}hi
╰──────────────────────⭓`;
                        await conn.sendMessage(from, { text: menuMsg }, { quoted: mek });
                        break;

                    case 'ping':
                        await conn.sendMessage(from, { text: "⚡ *Pong!* Bot réactif." }, { quoted: mek });
                        break;

                    case 'owner':
                        await conn.sendMessage(from, { text: "👤 *Dev:* GaaraTech" }, { quoted: mek });
                        break;

                    case 'hi':
                        await conn.sendMessage(from, { text: "Salut ! Je suis Nox-Mini." }, { quoted: mek });
                        break;

                    default:
                        break;
                }
            }
        } catch (e) {
            console.error("Erreur message:", e);
        }
    });
}

module.exports = router;
