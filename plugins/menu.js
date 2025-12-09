const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');

Cmd({
    pattern: "menu",
    alias: ["list", "help", "commands"],
    desc: "Afficher le tableau de bord",
    category: "general",
    react: "👑" // Nouvelle réaction !
},
async(conn, mek, m, { from, pushname, reply, isOwner, myquoted, commands, config }) => {
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

        // --- EN-TÊTE DIAMANTÉ ---
        let menu = `
💎━━━━━━ 『 *ＮＯＸ ＭＩＮＩ ＢＯＴ* 』 ━━━━━━💎
┃
┃  ✨ *UTILISATEUR* : ${pushname}
┃  ${isOwner ? '🔑' : '👤'} *STATUT* : ${isOwner ? 'Propriétaire' : 'Membre'}
┃
┃  🌐 *ACTIF DEPUIS* : ${uptimeString}
┃  ⚙️ *MÉMOIRE* : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
┃  📅 *DATE/HEURE* : ${date} à ${time}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━━━━━━━━ 『 *PANNEAU DE CONTRÔLE* 』 ━━━━━━━━━━━╮
`;
        // --- LOGIQUE DE CATÉGORISATION ---
        const categoryMap = {};

        commands.forEach((cmd) => {
            if (!cmd.dontAddCommandList && cmd.pattern) {
                // Met la première lettre en majuscule, le reste en minuscule (ex: 'General')
                const cat = cmd.category.charAt(0).toUpperCase() + cmd.category.slice(1).toLowerCase();
                if (!categoryMap[cat]) {
                    categoryMap[cat] = [];
                }
                categoryMap[cat].push({ pattern: cmd.pattern, desc: cmd.desc });
            }
        });
        
        const keys = Object.keys(categoryMap).sort();

        // --- AFFICHAGE DES CATÉGORIES EN ONGLET ---
        keys.forEach((category) => {
            // Mapping d'emojis plus stylisé
            let catEmoji;
            switch (category.toLowerCase()) {
                case 'general':
                    catEmoji = '🌍';
                    break;
                case 'tools':
                    catEmoji = '🧰';
                    break;
                case 'owner':
                    catEmoji = '🔐';
                    break;
                case 'image':
                    catEmoji = '🎨';
                    break;
                case 'download':
                    catEmoji = '📥';
                    break;
                default:
                    catEmoji = '🗂️';
            }

            menu += `
│ 
│ ╭────── *${catEmoji} ${category.toUpperCase()}* ──────
`;
            categoryMap[category].forEach((cmd) => {
                // Utilise le chevron pour pointer la commande
                menu += `│ ┃ ➪ ${config.PREFIX}${cmd.pattern}\n`;
            });
            menu += `│ ╰────────────────────\n`; // Fermeture de l'onglet
        });

        // --- PIED DE PAGE ---
        menu += `
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

*» ℹ️ Pour plus de détails, utilisez ${config.PREFIX}help <commande>*
${config.BOT_FOOTER}`;
        
        // Envoi du message avec l'image
        await conn.sendMessage(from, { 
            image: { url: config.IMAGE_PATH },
            caption: menu
        }, { quoted: myquoted });

    } catch (e) {
        console.error(e);
        reply("❌ Erreur lors de la construction du menu: " + e.message);
    }
});
