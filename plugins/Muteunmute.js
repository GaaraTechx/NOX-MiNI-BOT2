const config = require('../config');
const { cmd } = require('../command');

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
// Les variables isOwner, isAdmin et groupMetadata sont reçues ici.
async(conn, mek, m, { from, reply, isOwner, isAdmin, groupMetadata, myquoted }) => {
    
    // --- VÉRIFICATION UTILISATEUR (Owner ou Admin) ---
    // Utilisation de la variable 'isAdmin' fournie par le framework pour l'utilisateur
    if (!isOwner && !isAdmin) {
        return reply("❌ Seul l'Owner du Bot ou un Administrateur du Groupe peut utiliser cette commande.");
    }

    // --- VÉRIFICATION BOT ADMIN MANUELLE ---
    const botId = conn.user.jid || conn.user.id; 
    
    // Recherche le statut du bot dans les métadonnées de groupe (pour contourner le problème m.isBotAdmin)
    const botStatus = groupMetadata.participants.find(p => p.id.includes(botId.split('@')[0])); 
    const isBotAdminManual = botStatus && (botStatus.admin || botStatus.isAdmin); // S'adapte aux différents noms de champs possibles

    if (!isBotAdminManual) { 
        return reply("❌ Je dois être administrateur du groupe pour exécuter cette commande. Veuillez m'ajouter comme admin.");
    }
    // --------------------------------------------------

    try {
        await reply("⏳ Tentative d'ouverture du groupe...");

        // 'not_announcement' met le groupe en mode normal/ouvert
        await conn.groupSettingUpdate(from, 'not_announcement');
        
        const finalMessage = "📢 GROUPE OUVERT MAINTENANT. VOUS POUVEZ ENVOYER DES MESSAGES.";
        
        // Récupérer tous les IDs des participants pour les mentions
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
async(conn, mek, m, { from, reply, isOwner, isAdmin, groupMetadata, myquoted }) => {
    
    // --- VÉRIFICATION UTILISATEUR (Owner ou Admin) ---
    // Utilisation de la variable 'isAdmin' fournie par le framework pour l'utilisateur
    if (!isOwner && !isAdmin) {
        return reply("❌ Seul l'Owner du Bot ou un Administrateur du Groupe peut utiliser cette commande.");
    }
    
    // --- VÉRIFICATION BOT ADMIN MANUELLE ---
    const botId = conn.user.jid || conn.user.id; 
    const botStatus = groupMetadata.participants.find(p => p.id.includes(botId.split('@')[0]));
    const isBotAdminManual = botStatus && (botStatus.admin || botStatus.isAdmin);
    
    if (!isBotAdminManual) { 
        return reply("❌ Je dois être administrateur du groupe pour exécuter cette commande. Veuillez m'ajouter comme admin.");
    }
    // --------------------------------------------------

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
