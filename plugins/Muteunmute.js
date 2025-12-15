const { cmd } = require('../command');
const config = require('../config');
// ---------------------------------------------
// --- 1. Commande : !open (Ouvrir le Groupe) ---
// ---------------------------------------------

cmd({
    pattern: "open",
    alias: ["unlock", "ouvrir"],
    desc: "Ouvre le groupe (permet aux membres de chatter) avec hidetag.",
    category: "admin",
    react: "🔓"
},
async(conn, mek, m, { from, reply, isOwner, isAdmin, groupMetadata, myquoted }) => {
    
    // --- VÉRIFICATION D'AUTORISATION ---
    // Vérifie si l'utilisateur est Owner du Bot OU Admin du Groupe
    if (!isOwner && !isAdmin) {
        return reply("❌ Seul l'Owner du Bot ou un Administrateur du Groupe peut utiliser cette commande.");
    }
    
    // Vérifie si le Bot est Admin (nécessaire pour changer les paramètres)
    if (!m.isBotAdmin) { 
        return reply("❌ Je dois être administrateur du groupe pour exécuter cette commande.");
    }

    try {
        await reply("⏳ Tentative d'ouverture du groupe...");

        // 'not_announcement' met le groupe en mode normal/ouvert
        await conn.groupSettingUpdate(from, 'not_announcement');
        
        const finalMessage = "📢 GROUPE OUVERT MAINTENANT. VOUS POUVEZ ENVOYER DES MESSAGES.";
        
        // Récupérer tous les IDs des participants pour les mentions
        // IMPORTANT: La structure de groupMetadata dépend de votre framework WA.
        const participants = groupMetadata.participants.map(p => p.id);

        // Envoyer le message en hidetag (avec l'option mentions)
        await conn.sendMessage(from, { 
            text: finalMessage,
            mentions: participants 
        }, { quoted: myquoted });
        
    } catch (e) {
        console.error("Erreur commande OPEN:", e);
        reply("❌ Erreur critique lors de l'ouverture du groupe.");
    }
});

// -----------------------------------------------
// --- 2. Commande : !close (Fermer le Groupe) ---
// -----------------------------------------------

cmd({
    pattern: "close",
    alias: ["lock", "fermer"],
    desc: "Ferme le groupe (seuls les Admins peuvent chatter).",
    category: "admin",
    react: "🔒"
},
async(conn, mek, m, { from, reply, isOwner, isAdmin, myquoted }) => {
    
    // --- VÉRIFICATION D'AUTORISATION ---
    // Vérifie si l'utilisateur est Owner du Bot OU Admin du Groupe
    if (!isOwner && !isAdmin) {
        return reply("❌ Seul l'Owner du Bot ou un Administrateur du Groupe peut utiliser cette commande.");
    }
    
    // Vérifie si le Bot est Admin (nécessaire pour changer les paramètres)
    if (!m.isBotAdmin) { 
        return reply("❌ Je dois être administrateur du groupe pour exécuter cette commande.");
    }

    try {
        await reply("⏳ Tentative de fermeture du groupe...");
        
        // 'announcement' met le groupe en mode "Seuls les admins peuvent envoyer des messages"
        await conn.groupSettingUpdate(from, 'announcement');
        
        const finalMessage = "🚫 GROUPE FERMÉ MAINTENANT. SEULS LES ADMINS PEUVENT ENVOYER DES MESSAGES.";
        
        // Envoyer le message sans hidetag
        await conn.sendMessage(from, { 
            text: finalMessage
        }, { quoted: myquoted });
        
    } catch (e) {
        console.error("Erreur commande CLOSE:", e);
        reply("❌ Erreur critique lors de la fermeture du groupe.");
    }
});
