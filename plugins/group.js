// 📌 HIDETAG — Tag tout le monde sans montrer les mentions
const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');
cmd({
    pattern: "hidetag",
    desc: "Tag tout le monde sans afficher les mentions",
    category: "group",
    react: "👻"
},
async (socket, mek, m, { reply, args, isGroup, participants, from }) => {

    if (!isGroup) return reply("❌ Groupe uniquement !");
    let text = args.join(" ") || " ";

    let members = participants.map(v => v.id);

    await socket.sendMessage(from, {
        text: text,
        mentions: members
    });
});


// 📌 TAGALL — Mentionne tout le groupe avec message visible
// 📌 TAGADMIN — Mentionne uniquement les admins

cmd({
    pattern: "tagall",
    desc: "Mentionne tous les membres du groupe.",
    category: "group",
    react: "📣"
},
async (conn, mek, m, { reply, args, from, isGroup, isAdmin }) => {

    // Vérification : S'assurer que la commande est utilisée dans un groupe
    if (!isGroup) {
        return reply("❌ Cette commande ne peut être utilisée que dans un groupe.");
    }

    // Vérification : Optionnel mais souvent utile pour éviter le spam par les non-admins
    
    
    // Message personnalisé par l'utilisateur (si fourni)
    const customMessage = args.join(" ") || "📢 Message important du NOX MINI BOT 📢";

    // 1. Récupérer les informations du groupe
    const groupMetadata = await conn.groupMetadata(from);
    const participants = groupMetadata.participants;
    const groupName = groupMetadata.subject;
    const membersCount = participants.length;
    
    // 2. Déterminer l'emoji conditionnel (emomember)
    let emoMember;
    if (membersCount < 100) {
        emoMember = "🔴"; // Rouge
    } else if (membersCount < 500) {
        emoMember = "🟠"; // Orange
    } else if (membersCount < 1000) {
        emoMember = "🟡"; // Jaune
    } else {
        emoMember = "🟢"; // Vert
    }

    // 3. Construction du message et de la liste des mentions
    let messageText = `
𝙽𝙾𝚇 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃 👑

📢 𝚃𝙰𝙶 𝙰𝙻𝙻 𝙼𝙴𝙼𝙱𝙴𝚁𝚂 𝙾𝙽 : ${groupName}
👥 𝚃𝙾𝚃𝙰𝙻 𝙼𝙴𝙼𝙱𝙴𝚁𝚂 : ${membersCount} ${emoMember}
💬 𝙼𝙴𝚂𝚂𝙰𝙶𝙴 : *${customMessage}*

━━━━━━━━━━━━━━━
`;
    
    let mentions = [];

    // Tri des participants pour mettre les admins en premier (ou juste les parcourir)
    participants.forEach(member => {
        const jid = member.id.split('@')[0];
        const isAdmin = member.admin === 'admin' || member.admin === 'superadmin';
        
        // Ajouter l'emoji ✰ devant les admins
        const adminEmoji = isAdmin ? "✰ " : "";
        
        // Ajouter le préfixe et le numéro à la liste du message
        messageText += `${adminEmoji}@${jid}\n`;
        
        // Ajouter l'ID complet (JID) à la liste des mentions pour que WhatsApp les reconnaisse
        mentions.push(member.id);
    });

    try {
        // 4. Envoi du message avec toutes les mentions
        await conn.sendMessage(from, {
            text: messageText,
            contextInfo: {
                // Cette partie est cruciale : elle dit à WhatsApp qui doit être mentionné
                mentionedJid: mentions
            }
        }, { quoted: mek }); // Utilisez 'mek' comme quoted pour citer le message de l'utilisateur

    } catch (e) {
        console.error("Erreur lors de la fonction tagall:", e);
        reply("❌ Une erreur est survenue lors de la tentative de mention de tous les membres.");
    }
});


// 📌 ONLINE — Liste les personnes en ligne + envoie à chacun
cmd({
    pattern: "online",
    desc: "Liste des personnes en ligne",
    category: "group",
    react: "🟢"
},
async (socket, mek, m, { reply, isGroup, participants, from }) => {

    if (!isGroup) return reply("❌ Groupe uniquement !");

    // 🔥 Baileys donne presence = "available" (en ligne)
    let onlines = participants.filter(p => p.isOnline || p.presence === "available");

    if (onlines.length === 0) return reply("😴 Personne n'est en ligne.");

    let list = "🟢 *Personnes en ligne :*\n\n";

    for (let u of onlines) {
        list += `• @${u.id.split("@")[0]}\n`;

        // envoyer un ping à chaque personne
        await socket.sendMessage(u.id, {
            text: "👀 Tu es en ligne !"
        });
    }

    await socket.sendMessage(from, {
        text: list,
        mentions: onlines.map(v => v.id)
    });
});


cmd({
    name: "adminmsg",
    alias: ['adminevents', 'adminevent'],
    category: "Général",
    desc: "Activer ou désactiver les messages promote/demote",
    react: "⚙️",

    start: async (sock, m, { text, isOwner, sender, prefix }) => {

        // Vérifier propriétaire
        if (!isOwner) {
            return sock.sendMessage(m.chat, { text: "❌ *Seul le propriétaire du bot peut utiliser cette commande !*" });
        }

        if (!text) {
            return sock.sendMessage(m.chat, {
                text: `⚙️ *𝐴𝐷𝑀𝐼𝑁 𝐸𝑉𝐸𝑁𝑇𝑆 𝑆𝐸𝑇𝑇𝐼𝑁𝐺*\n\n` +
                      `𝐸𝑇𝐴𝑇 : *${config.ADMINEVENTS}*\n\n` +
                      `• ${prefix}adminmsg on\n` +
                      `• ${prefix}adminmsg off`
            });
        }

        const choice = text.toLowerCase().trim();

        if (choice !== "on" && choice !== "off") {
            return sock.sendMessage(m.chat, { text: "❌ 𝑈𝑠𝑒 𝑜𝑛/𝑜𝑓𝑓" });
        }

        // Lire config.js
        const configPath = path.join(__dirname, '../config.js');
        let file = fs.readFileSync(configPath, 'utf8');

        // Remplace la valeur ADMINEVENTS
        file = file.replace(
            /ADMINEVENTS:\s*process\.env\.ADMINEVENTS\s*\|\|\s*['"]\w+['"]/,
            `ADMINEVENTS: process.env.ADMINEVENTS || '${choice}'`
        );

        // Écrire dans le fichier
        fs.writeFileSync(configPath, file, 'utf8');

        // Mettre à jour dans la mémoire du bot
        config.ADMINEVENTS = choice;

        await sock.sendMessage(m.chat, { 
            text: `✅ *ADMIN EVENTS mis à jour !*\n\n🔧 État : *${choice.toUpperCase()}*`
        });
    }
});
