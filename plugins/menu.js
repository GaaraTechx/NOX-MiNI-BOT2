const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');
cmd({
    pattern: "menu",
    alias: ["list", "help", "commands"],
    desc: "Afficher le tableau de bord",
    category: "general",
    react: "👑" // Nouvelle réaction élégante
},
async(conn, mek, m, { from, pushname, reply, isOwner, myquoted, commands, config }) => {
    try {
        // --- 1. Calcul de l'Uptime et Date/Heure ---
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const uptimeString = `${hours}h ${minutes}m ${seconds}s`;

        const date = new Date().toLocaleDateString("fr-FR");
        const time = new Date().toLocaleTimeString("fr-FR");

        // --- Vérification Cruciale ---
        // S'assurer que 'commands' est bien un tableau itérable
        if (!Array.isArray(commands)) {
            console.error("L'objet 'commands' est manquant ou non-itérable.");
            return reply("⚠️ Erreur interne : Impossible de charger la liste des commandes. Contactez le développeur.");
        }

        // --- 2. EN-TÊTE DIAMANTÉ (Design Amélioré) ---
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
        
        // --- 3. LOGIQUE DE CATÉGORISATION ---
        const categoryMap = {};

        commands.forEach((cmd) => {
            if (!cmd.dontAddCommandList && cmd.pattern) {
                // Met la première lettre en majuscule (ex: 'General')
                const cat = cmd.category.charAt(0).toUpperCase() + cmd.category.slice(1).toLowerCase();
                if (!categoryMap[cat]) {
                    categoryMap[cat] = [];
                }
                categoryMap[cat].push({ pattern: cmd.pattern, desc: cmd.desc });
            }
        });
        
        const keys = Object.keys(categoryMap).sort();

        // --- 4. AFFICHAGE DES CATÉGORIES EN ONGLET ---
        keys.forEach((category) => {
            // Mapping d'emojis pour un style visuel
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

        // --- 5. PIED DE PAGE ---
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
        reply("❌ Erreur interne lors de la construction du menu: " + e.message);
    }
});
