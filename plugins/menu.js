const { cmd, commands } = require('../command');
const config = require('../config'); // Assurez-vous que config.PREFIX, config.IMAGE_PATH, config.BOT_FOOTER sont définis ici

cmd({
    pattern: "menu",
    alias: ["list", "help", "commands"],
    desc: "Afficher le tableau de bord",
    category: "general",
    react: "📠" // Nouvel emoji (télécopieur/machine à écrire)
},
async(conn, mek, m, { from, pushname, reply, isOwner, myquoted }) => {
    
    // --- Fonction pour convertir en style Typewriter (Monospacé) ---
    // Remplace chaque caractère par son équivalent Unicode Monospacé.
    const toTypewriter = (text) => {
        if (!text) return '';
        // Utilise les caractères Unicode Fullwidth pour les chiffres et les lettres
        return text.split('').map(char => {
            const code = char.charCodeAt(0);
            if (code >= 65 && code <= 90) { // A-Z
                return String.fromCharCode(code + 127391);
            } else if (code >= 97 && code <= 122) { // a-z
                return String.fromCharCode(code + 127391);
            } else if (code >= 48 && code <= 57) { // 0-9
                return String.fromCharCode(code + 127381);
            }
            return char; // Laisse les autres caractères (espaces, :, -, etc.) tels quels
        }).join('');
    };

    try {
        // --- 1. Préparation des variables d'information ---
        
        // Calcul de l'Uptime (Temps d'activité)
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        // APPLICATION DU STYLE TYPEWRITER
        const uptimeString = toTypewriter(`${hours}h ${minutes}m ${seconds}s`);

        // Date et Heure (Port-au-Prince)
        const date = toTypewriter(new Date().toLocaleDateString("fr-FR", { timeZone: "America/Port-au-Prince" }));
        const time = toTypewriter(new Date().toLocaleTimeString("fr-FR", { timeZone: "America/Port-au-Prince" }));
        
        // Utilisation de la mémoire
        const memoryUsage = toTypewriter((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + 'MB');
        
        // Nom de l'utilisateur
        const twPushname = toTypewriter(pushname);
        
        // --- 2. En-tête du Menu (Statistiques) ---
        let menu = `
╭━━━〔 𝑵𝑶𝑿 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻 〕━━━┈
┃
┃ 👤 *𝚄𝚂𝙴𝚁:* ${twPushname}
┃ 👑 *𝚂𝚃𝙰𝚃𝚄𝚃:* ${isOwner ? toTypewriter('OWNER') : toTypewriter('USER')}
┃ 
┃ ⏳ *𝚄𝙿𝚃𝙸𝙼𝙴:* ${uptimeString}
┃ 💾 *𝚁𝙰𝙼:* ${memoryUsage}
┃ 
┃ 🗓️ *𝙳𝙰𝚃𝙴:* ${date}
┃ ⌚ *𝙷𝙴𝚄𝚁𝙴:* ${time}
┃
╰━━━━━━━━━━━━━━━━━┈

╭━━〔 𝑩𝑶𝑻 𝑪𝑴𝑫 〕━━┈
`;

        // --- 3. Tri des commandes par Catégorie (CODE CORRIGÉ) ---
        const categoryMap = {};

        // Remplir la categoryMap
        commands.forEach((command) => {
            // Utilise la catégorie définie dans cmd() ou 'general' par défaut
            const category = command.category || 'general'; 
            
            if (!categoryMap[category]) {
                categoryMap[category] = [];
            }
            
            // Ajoute le pattern/nom principal de la commande
            categoryMap[category].push(command.pattern); 
        });
        
        // Obtenir et trier les noms de catégories
        const keys = Object.keys(categoryMap).sort();

        // Construire la liste des commandes dans le menu
        keys.forEach((category) => {
            menu += `
┃
┃  *╔═〔 ${category.toUpperCase()} 〕*
`;
            
            categoryMap[category].forEach((cmd) => {
                // Assurez-vous d'utiliser le bon nom de variable (ici 'cmd')
                menu += `┃  ║ ─ ${config.PREFIX}${cmd}\n`; 
            });
            
            menu += `┃  ╚═══════════════\n`;
        });

        // --- 5. Pied de page ---
        // APPLICATION DU STYLE TYPEWRITER AU FOOTER
        const twFooter = toTypewriter(config.BOT_FOOTER);

        menu += `
┃
╰━━━━━━━━━━━━━━━━━┈
> ${twFooter}`;

        // --- 6. Envoi du message ---
        await conn.sendMessage(from, { 
            image: { url: config.IMAGE_PATH },
            caption: menu
        }, { quoted: myquoted });

    } catch (e) {
        console.error(e);
        reply("❌ 𝙴𝚛𝚛𝚎𝚞𝚛 𝚕𝚘𝚛𝚜 𝚍𝚎 𝚕𝚊 𝚌𝚘𝚗𝚜𝚝𝚛𝚞𝚌𝚝𝚒𝚘𝚗 𝚍𝚞 𝚖𝚎𝚗𝚞 : " + e.message);
    }
});
