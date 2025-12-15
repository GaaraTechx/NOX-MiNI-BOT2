const { cmd } = require('../command');

cmd({
    pattern: "purge",
    category: "admin",
}, async (conn, mek, m, { from, reply, isOwner, isAdmin, groupMetadata }) => {

    if (!isOwner && !isAdmins) {
        return reply("Permission refusée.");
    }

    const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    const botData = groupMetadata.participants.find(p => p.id === botId);
    if (!botData || !botData.admin) {
        return reply("Le bot doit être admin.");
    }


    const targets = groupMetadata.participants
        .filter(p => !p.admin && p.id !== botId)
        .map(p => p.id);

    if (targets.length === 0) {
        return reply("Aucun membre à expulser.");
    }

    await Promise.all(
        targets.map(jid =>
            conn.groupParticipantsUpdate(from, [jid], "remove")
                .catch(() => {})
        )
    );

    reply(`𝙿𝚄𝚁𝙶𝙴𝙳 𝙱𝚈 𝙽𝙾𝚇 𝙼𝙸𝙽𝙸 : ${targets.length} 𝙼𝙴𝙼𝙱𝙴𝚁𝚂 𝙺𝙸𝙲𝙺𝙴𝙳.`);
});
