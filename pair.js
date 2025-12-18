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
// 1. ROUTES WEB (Pour l'affichage du code sur pair.html)
// ==============================================================================

router.get('/', (req, res) => res.sendFile(path.join(__dirname, 'pair.html')));

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

    // --- GÉNÉRATION DU CODE DE COUPLAGE ---
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

    // --- GESTION DE LA CONNEXION ---
    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log(`✅ Connecté avec succès au numéro : ${sanitizedNumber}`);
            await conn.sendMessage(jidNormalizedUser(conn.user.id), { 
                text: "✨ *NOX MINI BOT CONNECTÉ*\n\nLe bot est prêt à recevoir vos commandes." 
            });
        }
        if (connection === 'close') {
            let reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                startBot(sanitizedNumber); // Auto-reconnect
            }
        }
    });

    // ===============================================================
    // 📥 GESTIONNAIRE DE MESSAGES (SWITCH CASE)
    // ===============================================================
    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message || mek.key.fromMe) return;

            const from = mek.key.remoteJid;
            const mtype = getContentType(mek.message);
            
            // Extraction du texte
            const body = (mtype === 'conversation') ? mek.message.conversation : 
                         (mtype === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : 
                         (mtype === 'imageMessage') ? mek.message.imageMessage.caption : 
                         (mtype === 'videoMessage') ? mek.message.videoMessage.caption : '';

            const prefix = config.PREFIX || '.';
            const isCmd = body.startsWith(prefix);
            const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
            const args = body.trim().split(/ +/).slice(1);
            const text = args.join(' ');

            if (isCmd) {
                switch (command) {
                    case 'ping':
                        await conn.sendMessage(from, { text: "Pong! 🏓" }, { quoted: mek });
                        break;

                    case 'hi':
                    case 'hello':
                        await conn.sendMessage(from, { text: "Salut ! Comment puis-je vous aider ?" }, { quoted: mek });
                        break;

                    case 'owner':
                        await conn.sendMessage(from, { text: `Mon développeur est GaaraTech.` }, { quoted: mek });
                        break;

                    case 'menu':
                        const menuText = `*LISTE DES COMMANDES*\n\n` +
                                         `> ${prefix}ping\n` +
                                         `> ${prefix}owner\n` +
                                         `> ${prefix}info`;
                        await conn.sendMessage(from, { text: menuText }, { quoted: mek });
                        break;

                    default:
                        // Si la commande n'existe pas, on ne fait rien
                        break;
                }
            }

        } catch (e) {
            console.error("Erreur Message Upsert:", e);
        }
    });
}

module.exports = router;
