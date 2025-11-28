const { cmd, commands } = require('../command');
const config = require('../config');
const os = require('os');

// =================================================================
// 🏓 COMMANDE PING (Style Speedtest)
// =================================================================
cmd({
    pattern: "Uptime",
    alias: ["speed"],
    desc: "Vérifier la latence et les ressources",
    category: "general",
    react: "⚡"
},
async(conn, mek, m, { from, reply, myquoted }) => {
    try {
        const start = Date.now();
        
        // 1. Message d'attente
        const msg = await conn.sendMessage(from, { text: '🔄 ᴛᴇsᴛɪɴɢ sᴘᴇᴇᴅ..._' }, { quoted: myquoted });
        
        const end = Date.now();
        const latency = end - start;
        
        // 2. Calcul Mémoire (RAM)
        const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
        const freeMem = (os.freemem() / 1024 / 1024).toFixed(0);
        const usedMem = (totalMem - freeMem).toFixed(0);

        // 3. Message Final Stylé
        const pingMsg = `
⚡ *NOX MINI SPEED* ⚡

📟 *ʟᴀᴛᴇɴᴄʏ:* ${latency}ms
💻 *ʀᴀᴍ:* ${usedMem}MB / ${totalMem}MB
🚀 *sᴇʀᴠᴇʀ:*ᴀᴄᴛɪᴠᴇe

> ${config.BOT_FOOTER}
`;

        // 4. Édition du message (Effet visuel)
        await conn.sendMessage(from, { text: pingMsg, edit: msg.key });

    } catch (e) {
        reply("Error: " + e.message);
    }
});
//cmd ping2
//==============[ PING PLUGIN — NOX MINI ]===============//

cmd({
    name: "ping",
    alias: ['speed', 'latence'],
    desc: "Teste la vitesse du bot",
    category: "Général",
    react: "📍",

    start: async (socket, msg, { sender, pushName, prefix }) => {
        try {

            await socket.sendMessage(sender, { 
                react: { text: '📍', key: msg.key } 
            });

            let videoUrl = 'https://files.catbox.moe/8das33.mp4';
            const start = performance.now();

            await socket.sendMessage(sender, { 
                text: "🔄 *𝐍𝐎𝐗 𝐌𝐈𝐍𝐈 𝐏𝐈𝐍𝐆 𝐓𝐄𝐒𝐓𝐈𝐍𝐆...*" 
            }, { quoted: msg });

            const latency = Math.floor(performance.now() - start);

            let quality, color, bar;

            if (latency < 100) {
                quality = "🟢 𝐄𝐗𝐂𝐄𝐋𝐋𝐄𝐍𝐓";
                color = "🟢";
                bar = "███████";
            } else if (latency < 300) {
                quality = "🟡 𝐆𝐎𝐎𝐃";
                color = "🟡";
                bar = "█████░░";
            } else if (latency < 600) {
                quality = "🟠 𝐅𝐀𝐈𝐑";
                color = "🟠";
                bar = "███░░░░";
            } else {
                quality = "🔴 𝐏𝐎𝐎𝐑";
                color = "🔴";
                bar = "█░░░░░░";
            }

            const caption = `
╭────────────────⭓
│ 🚀 *𝐍𝐎𝐗 𝐌𝐈𝐍𝐈 𝐏𝐈𝐍𝐆 𝐓𝐄𝐒𝐓*
│ ⚡ *Vitesse:* ${latency}ms
│ ${color} *Qualité:* ${quality}
│ 📶 *Signal:* [${bar}]
│ 🕒 *Heure:* ${new Date().toLocaleString()}
╰────────────────⭓
> 𝙽𝙾𝚇 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃 
            `.trim();

            await socket.sendMessage(sender, {
                video: { url: videoUrl },
                caption: caption,
                buttons: [
                    { buttonId: `${prefix}bot_info`, buttonText: { displayText: '🔮 Bot Info' }, type: 1 },
                    { buttonId: `${prefix}bot_stats`, buttonText: { displayText: '📊 Stats' }, type: 1 }
                ],
                headerType: 4
            }, { quoted: msg });

        } catch (err) {
            console.error("PING ERROR:", err);
        }
    }
};
// =================================================================
// 📜 COMMANDE MENU (Style Dashboard)
// =================================================================
cmd({
    pattern: "menu",
    alias: ["list", "help", "commands"],
    desc: "Afficher le tableau de bord",
    category: "general",
    react: "🕷️"
},
async(conn, mek, m, { from, pushname, reply, isOwner, myquoted }) => {
    try {
        // 1. Calcul de l'Uptime (Temps d'activité)
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const uptimeString = `${hours}h ${minutes}m ${seconds}s`;

        // 2. Date et Heure
        const date = new Date().toLocaleDateString("fr-FR");
        const time = new Date().toLocaleTimeString("fr-FR");

        // 3. En-tête du Menu
        let menu = `
╭━━━━━━❖ NＯＸ  ＭＩＮＩ  ＢＯＴ* ❖━━━━━━╮
│  
│ 🧑‍💻 *Utilisateur:* ${pushname}
│ 👑 *Propriétaire:* ${isOwner ? 'Oui' : 'Non'}
│ ⏳ *Uptime:* ${uptimeString}
│ 📆 *Date:* ${date}
│ 🕒 *Heure:* ${time}
│ 💽 *RAM:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯


╭━━━━━━❖ *ＭＯＤＵＬＥＳ  ＤＵ  ＢＯＴ* ❖━━━━━━╮
`;

const keys = Object.keys(categoryMap).sort();

keys.forEach((category) => {
    menu += `
│ 🔻 *${category}*
│─────────────────────────────`;
    categoryMap[category].forEach((cmd) => {
        menu += `\n│ ➤ ${config.PREFIX}${cmd}`;
    });
    menu += `\n│`;
});

menu += `
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🔹 *${config.BOT_FOOTER}* `;
        await conn.sendMessage(from, { 
            image: { url: config.IMAGE_PATH },
            caption: menu
        }, { quoted: myquoted }); // Utilisation de ton myquoted personnalisé

    } catch (e) {
        console.error(e);
        reply("Error building menu: " + e.message);
    }
});

// =================================================================
// 👑 COMMANDE OWNER (Carte de visite)
// =================================================================
cmd({
    pattern: "owner",
    desc: "Contacter le créateur",
    category: "general",
    react: "👑"
},
async(conn, mek, m, { from, myquoted }) => {
    const ownerNumber = config.OWNER_NUMBER;
    
    // Création d'une vCard (Fiche contact)
    const vcard = 'BEGIN:VCARD\n' +
                  'VERSION:3.0\n' +
                  'FN:DyBy Tech (Owner)\n' +
                  'ORG:Shadow Corp;\n' +
                  `TEL;type=CELL;type=VOICE;waid=${ownerNumber}:${ownerNumber}\n` +
                  'END:VCARD';

    await conn.sendMessage(from, {
        contacts: {
            displayName: 'GAARA TECH',
            contacts: [{ vcard }]
        }
    }, { quoted: myquoted });
});
