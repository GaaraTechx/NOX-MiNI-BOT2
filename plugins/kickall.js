const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "purge",
    alias: ["vider", "kickall2"],
    desc: "Expulse tous les membres d'un groupe, à l'exception des admins et de l'Owner du bot.",
    category: "group",
    react: "💨"
}, async(conn, mek, m, { from, reply, isOwner, isAdmin, groupMetadata, mcli, myquoted }) => {
    
    // 1. Vérification d'Autorisation (Owner du Bot ou Admin du Groupe)
    if (!isOwner && !isAdmins) {
        return reply("𝙾𝙽𝙻𝚈 𝙱𝙾𝚃 𝙾𝚆𝙽𝙴𝚁 𝙰𝙽𝙳 𝙶𝚁𝙾𝚄𝙿 𝙰𝙳𝙼𝙸𝙽𝚂 𝙲𝙰𝙽𝚃 𝚄𝚂𝙴 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳");
    }
    
 
    // 3. Préparation et récupération des participants
    if (!groupMetadata || !groupMetadata.participants) {
        return reply("❌ Unable to retrieve the participants list.");
    }
    
    const participants = groupMetadata.participants;

    // Récupérer l'ID du bot
    const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    
    // Filtrer les participants à expulser :
    const membersToKick = participants.filter(p => 
        !p.admin && 
        p.id !== botId && 
        p.id !== mcli.owner
    ).map(p => p.id); // Ne garder que les IDs (JID)

    if (membersToKick.length === 0) {
        return reply("✅ No non-admin members found to kick.");
    }

    // --- 4. ENVOI DE L'AVERTISSEMENT STYLISÉ ---
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
    const kickPromises = membersToKick.map(async (jid) => {
        try {
            await conn.groupParticipantsUpdate(from, [jid], 'remove');
            successCount++;
        } catch (e) {
            failureCount++;
        }
    });

    await Promise.all(kickPromises);

    // 6. Rapporter les Résultats avec votre style
    const finalMessage = `
*🌪️ 𝙶𝚁𝙾𝚄𝙿 𝙿𝚄𝚁𝙶𝙴𝙳 𝙱𝚈 𝙽𝙾𝚇 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃 !*

╭──────────────────────────⭓
│ ✅ 𝚂𝚄𝙲𝙲𝙴𝚂𝚂 : ${successCount}
╰──────────────────────────⭓   
> 𝑷𝑶𝑾𝑬𝑹𝑬𝑫 𝑩𝒀 𝑵𝑶𝑿 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻
    `.trim();

    // Envoyer le message final (le rapport)
    await conn.sendMessage(from, { 
        text: finalMessage
    }, { quoted: myquoted });
});
