const config = require('../config');

const groupEvents = async (sock, update) => {
    try {
        const { id, participants, action } = update;
        
        if (config.WELCOME !== 'true' && config.GOODBYE !== 'true') return;

        let metadata;
        try {
            metadata = await sock.groupMetadata(id);
        } catch (e) {
            return; 
        }

        for (const participant of participants) {
            let ppUrl;
            try {
                ppUrl = await sock.profilePictureUrl(participant, 'image');
            } catch (e) {
                ppUrl = config.IMAGE_PATH;
            }

            if (action === 'add' && config.WELCOME === 'true') {
                const welcomeText = `
✦ 𝑵𝑶𝑿 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻 — 𝑾𝑬𝑳𝑪𝑶𝑴𝑬 ✦
╭────────────────────────⭓
│ 👋 𝑯𝒆𝒚 @${participant.split('@')[0]} !
│ 🏠 𝑾𝒆𝒍𝒄𝒐𝒎𝒆 𝒕𝒐: ${metadata.subject}
│ 👥 𝑴𝒆𝒎𝒃𝒆𝒓𝒔: ${metadata.participants.length}
│ 📜 𝑮𝒓𝒐𝒖𝒑 𝑫𝒆𝒔𝒄:
│ “${metadata.desc?.toString().slice(0, 70) || "𝚆𝙴𝙻𝙲𝙾𝙼𝙴"}...”
╰────────────────────────⭓
> 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝙶𝙰𝙰𝚁𝙰 𝚃𝙴𝙲𝙷
`;
                await sock.sendMessage(id, { image: { url: ppUrl }, caption: welcomeText, mentions: [participant] });
            }

            if (action === 'remove' && config.GOODBYE === 'true') {
                const goodbyeText = `
✦ 𝑵𝑶𝑿 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻 — 𝑮𝑶𝑶𝑫𝑩𝒀𝑬 ✦

╭────────────────────────⭓
│ 👋 𝑭𝒂𝒓𝒆𝒘𝒆𝒍𝒍 @${participant.split('@')[0]}
│ 🚪 𝑳𝒆𝒇𝒕 𝒈𝒓𝒐𝒖𝒑: ${metadata.subject}
│ 📉 𝑴𝒆𝒎𝒃𝒆𝒓𝒔 𝒓𝒆𝒎𝒂𝒊𝒏𝒊𝒏𝒈: ${metadata.participants.length}
╰────────────────────────⭓
> 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝙶𝙰𝙰𝚁𝙰 𝚃𝙴𝙲𝙷
`;
                await sock.sendMessage(id, { image: { url: ppUrl }, caption: goodbyeText, mentions: [participant] });
            }
        }
    } catch (e) {
        console.error('❌ Error in groupEvents:', e);
    }
};

module.exports = { groupEvents };
