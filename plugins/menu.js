const { cmd, commands } = require('../command');
const config = require('../config');

cmd({
    pattern: "menu",
    alias: ["list", "help", "commands"],
    desc: "Afficher le menu",
    category: "general",
    react: "📠"
}, async (conn, mek, m, { from, pushname, reply, isOwner, myquoted }) => {

    // ─── STYLE TYPEWRITER (FOOTER) ───
    const toTypewriter = (text) => {
        if (!text) return '';
        return text.split('').map(char => {
            const code = char.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCharCode(code + 127391);
            if (code >= 97 && code <= 122) return String.fromCharCode(code + 127391);
            if (code >= 48 && code <= 57) return String.fromCharCode(code + 127381);
            return char;
        }).join('');
    };

    try {
        // ─── UPTIME ───
        const uptime = process.uptime();
        const h = Math.floor(uptime / 3600);
        const mnt = Math.floor((uptime % 3600) / 60);
        const s = Math.floor(uptime % 60);
        const uptimeString = `${h}h ${mnt}m ${s}s`;

        // ─── DATE & HEURE (HAÏTI) ───
        const date = new Date().toLocaleDateString("fr-FR", {
            timeZone: "America/Port-au-Prince"
        });
        const time = new Date().toLocaleTimeString("fr-FR", {
            timeZone: "America/Port-au-Prince"
        });

        // ─── RAM ───
        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + "MB";

        // ─── HEADER MENU (STYLE JOLIE) ───
        let menu = `
╭┄┄『 ✦ 𝑵𝑶𝑿 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻 ✦ 』
┆ 👤 *𝚄𝚂𝙴𝚁* : ${pushname}
┆ 👑 *𝚁𝙰𝙽𝙺* : ${isOwner ? 'OWNER' : 'USER'}
┆ ⏳ *𝚄𝙿𝚃𝙸𝙼𝙴* : ${uptimeString}
┆ 💾 *𝚁𝙰𝙼* : ${memoryUsage}
┆ 🗓️ *𝙳𝙰𝚃𝙴* : ${date}
┆ ⌚ *𝚃𝙸𝙼𝙴* : ${time}
╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌◇
`;

        // ─── CLASSEMENT DES COMMANDES PAR CATÉGORIE ───
        const categoryMap = {};

        commands.forEach(cmd => {
            const cat = cmd.category || "general";
            if (!categoryMap[cat]) categoryMap[cat] = [];
            categoryMap[cat].push(cmd.pattern);
        });

        // ─── TRI DES CATÉGORIES ───
        const categories = Object.keys(categoryMap).sort();

        // ─── CONSTRUCTION DU MENU ───
        categories.forEach(cat => {
            menu += `
╭┄┄〔 ${cat.toUpperCase()} 〕
`;
            categoryMap[cat].forEach(c => {
                menu += `┆◈ ${config.PREFIX}${c}\n`;
            });
            menu += `╰╌╌╌╌╌╌╌╌╌╌✹\n`;
        });

        // ─── FOOTER ───
        const footer = toTypewriter(config.BOT_FOOTER || "> 𝑷𝑶𝑾𝑬𝑹𝑬𝑫 𝑩𝒀 𝑵𝑶𝑿 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻");

        menu += `
> ${footer}
`;

        // ─── ENVOI ───
        await conn.sendMessage(from, {
            image: { url: config.IMAGE_PATH },
            caption: menu
        }, { quoted: myquoted });

    } catch (err) {
        console.error(err);
        reply("❌ Erreur lors de la génération du menu:\n" + err.message);
    }
});
