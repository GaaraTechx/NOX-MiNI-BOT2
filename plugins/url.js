const events = require('../command');
const axios = require('axios');
const FormData = require('form-data');
const { 
    downloadContentFromMessage 
} = require('@whiskeysockets/baileys'); 

// Fonction pour télécharger le média cité directement dans un Buffer
async function downloadMediaToBuffer(m) {
    const quotedMsg = m.quoted;
    if (!quotedMsg || !quotedMsg.message) return null;
    
    // Déterminer le type de message cité (e.g., imageMessage, videoMessage)
    let type = Object.keys(quotedMsg.message)[0];
    let mediaType = type.replace('Message', ''); // image, video, audio
    
    try {
        // Obtenir le flux de téléchargement Baileys
        const stream = await downloadContentFromMessage(quotedMsg.message[type], mediaType);
        let buffer = Buffer.from([]);
        
        // Lire le flux directement dans un Buffer en mémoire
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        
        // Déduire l'extension pour le nom de fichier Catbox (Approximation simple)
        let ext = mediaType === 'image' ? 'png' : mediaType === 'video' ? 'mp4' : mediaType === 'audio' ? 'ogg' : 'bin';
        
        return { buffer, ext, mediaType };
    } catch (e) {
        console.error("Erreur de téléchargement média:", e.message);
        return null;
    }
}

// ==============================================================================
// ENREGISTREMENT DE LA COMMANDE
// ==============================================================================

events.addCommand({
    pattern: ['url'],
    alias: ['tourl'],
    desc: 'Télécharge le média cité (photo, vidéo, audio) sur Catbox.moe.',
    usage: '.upload <citer un média>',
    react: '⬆️'
}, async (conn, mek, m, { reply }) => {
    
    const quoted = m.quoted;

    if (!quoted || (!quoted.isQuotedImage && !quoted.isQuotedVideo && !quoted.isQuotedAudio)) {
        return reply('⚠️ Veuillez citer une *image, une vidéo ou un fichier audio* pour l\'uploader.');
    }
    
    await reply('⏳ Téléchargement du média en mémoire et envoi vers Catbox...');

    let mediaData = null;

    try {
        // 1. Télécharger le média dans un Buffer
        mediaData = await downloadMediaToBuffer(m);
        
        if (!mediaData || mediaData.buffer.length === 0) {
            return reply('❌ Impossible de télécharger le média cité en mémoire. Le fichier est peut-être trop grand.');
        }

        // 2. Préparer l'upload
        const apiUrl = 'https://catbox.moe/user/api.php';
        const form = new FormData();
        
        form.append('reqtype', 'fileupload');
        
        // Simuler un nom de fichier pour l'upload multipart
        const fileName = `upload_nox.${mediaData.ext}`; 
        
        // Ajouter le Buffer au FormData (pas de fichier temporaire)
        form.append('fileToUpload', mediaData.buffer, {
            filename: fileName,
            contentType: `${mediaData.mediaType}/${mediaData.ext}`
        }); 

        // 3. Appel API
        const response = await axios.post(apiUrl, form, {
            // Ces options aident à la gestion des gros fichiers en mémoire
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            headers: {
                ...form.getHeaders(),
                'Content-Length': form.getLengthSync() 
            }
        });

        // 4. Traitement de la réponse
        const resultUrl = response.data.trim();

        if (resultUrl.startsWith('https://files.catbox.moe/')) {
            
            const mediaType = mediaData.mediaType.toUpperCase();

            const responseText = `
✅ *𝚄𝚁𝙻 𝙱𝚈 𝙽𝙾𝚇 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃*

*𝙼𝙴𝙳𝙸𝙰 𝚃𝚈𝙿𝙴 :* ${mediaType}
*𝙼𝙴𝙳𝙸𝙰 𝚄𝚁𝙻 :* ${resultUrl}
            `.trim();
            
            await reply(responseText);
        } else {
            await reply(`❌ Échec de l'upload. Réponse Catbox : ${resultUrl || 'Inconnue.'}`);
        }

    } catch (error) {
        console.error("Erreur Catbox.moe:", error.message);
        await reply('❌ Une erreur est survenue lors de l\'envoi (problème réseau ou fichier trop volumineux).');
    }
});
