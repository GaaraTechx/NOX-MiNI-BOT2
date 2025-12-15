//const { cmd } = require('../command');
const config = require('../config');

const { cmd } = require('../command');

// --------------------------------------------------
// --- COMMANDE : !kickall (Expulsion de masse) ---
// --------------------------------------------------

cmd({
    pattern: "kickall",
    alias: ["vider", "purge"],
    desc: "Expulse tous les membres d'un groupe, à l'exception des admins et de l'Owner du bot.",
    category: "admin",
    react: "💨"
}, async(conn, mek, m, { from, reply, isOwner, isAdmin, groupMetadata, mcli, myquoted }) => {
    
    // 1. Vérification d'Autorisation (Owner du Bot ou Admin du Groupe)
    if (!isOwner && !isAdmin) {
        return reply("❌ Only the Bot Owner or a Group Admin can use this command.");
    }
    
    // 2. Vérification du Bot Admin (Nécessaire pour kick)
    if (!m.isBotAdmin) { 
        return reply("❌ I must be an administrator of the group to execute this command.");
    }

    // 3. Préparation et récupération des participants
    if (!groupMetadata || !groupMetadata.participants || groupMetadata.participants.length === 0) {
        return reply("❌ Unable to retrieve the participants list.");
    }
    
    const participants = groupMetadata.participants;

    // Récupérer l'ID du bot (JID complet)
    // Utilisation d'une vérification robuste au cas où conn.user serait incomplet
    const botId = conn.user && conn.user.id ? conn.user.id.split(':')[0] + '@s.whatsapp.net' : null;
    
    // Récupérer l'ID de l'Owner du Bot (JID complet)
    const ownerId = mcli && mcli.owner ? mcli.owner : null; 
    
    // Filtrer les participants à expulser :
    const membersToKick = participants.filter(p => {
        // p.admin n'est pas un admin (null ou undefined ou false)
        const isAdminInGroup = p.admin !== null && p.admin !== undefined; 

        const isBot = p.id === botId;
        const isOwnerBot = p.id === ownerId;
        
        // Cible : Non Admin ET Non Bot ET Non Owner
        return !isAdminInGroup && !isBot && !isOwnerBot;
    }).map(p => p.id); // Ne garder que les IDs (JID)

    if (membersToKick.length === 0) {
        return reply("✅ No non-admin members found to kick.");
    }

    // --- 4. ENVOI DE L'AVERTISSEMENT STYLISÉ (Première réponse) ---
    const warningMessage = `
╭──────────────────────────⭓
│ ⚠️ 𝚆𝙰𝚁𝙽𝙸𝙽𝙶 : 𝙰𝙻𝙻 𝙼𝙴𝙼𝙱𝙴𝚁𝚂 𝚆𝙸𝙻𝙻 𝙱𝙴 𝙴𝚇𝙿𝚄𝙻𝚂𝙴𝙳
│ 👥 𝚃𝙰𝚁𝙶𝙴𝚃 : ${membersToKick.length} 𝚗𝚘𝚗-𝚊𝚍𝚖𝚒𝚗 𝚖𝚎𝚖𝚋𝚎𝚛𝚜
╰──────────────────────────⭓
    `.trim();

    await conn.sendMessage(from, { text: warningMessage }, { quoted: myquoted });
    
    let successCount = 0;
    let failureCount = 0;
    
    // 5. Exécution (Kick en parallèle/rapide)
    // Lance toutes les requêtes d'expulsion simultanément pour la rapidité.
    const kickPromises = membersToKick.map(async (jid) => {
        try {
            await conn.groupParticipantsUpdate(from, [jid], 'remove');
            successCount++;
        } catch (e) {
            failureCount++;
        }
    });

    await Promise.all(kickPromises);

    // 6. Rapporter les Résultats avec votre style (Deuxième réponse)
    const finalMessage = `
**🌪️ 𝙺𝙸𝙲𝙺𝙰𝙻𝙻 𝙾𝙿𝙴𝚁𝙰𝚃𝙸𝙾𝙽 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙴𝙳**

╭──────────────────────────⭓
│ ✅ 𝚂𝚄𝙲𝙲𝙴𝚂𝚂 : ${successCount}
│ ❌ 𝙵𝙰𝙸𝙻𝙴𝙳 : ${failureCount}
╰──────────────────────────⭓
    
> 𝑷𝑶𝑾𝑬𝑹𝑬𝑫 𝑩𝒀 𝑵𝑶𝑿 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻
    `.trim();

    // Envoyer le message final (le rapport)
    await conn.sendMessage(from, { 
        text: finalMessage
    }, { quoted: myquoted });
});
