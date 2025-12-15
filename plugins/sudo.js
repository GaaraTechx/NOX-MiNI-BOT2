const { cmd } = require('../command');
const fs = require('fs/promises'); 
const path = require('path');

// Le chemin vers sudo.json
const SUDO_FILE = path.join(__dirname, '..', 'sudo.json');

// --- Fonction utilitaire pour lire le fichier SUDO ---
const readSudoList = async () => {
    try {
        const data = await fs.readFile(SUDO_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        if (e.code === 'ENOENT' || e.message.includes('Unexpected end of JSON input')) {
            await fs.writeFile(SUDO_FILE, '[]'); // Créer le fichier s'il est manquant
            return [];
        }
        console.error("Erreur de lecture de sudo.json:", e);
        throw new Error("Impossible de lire la liste des Sudous.");
    }
};

// --- Fonction utilitaire pour écrire le fichier SUDO ---
const writeSudoList = async (list) => {
    try {
        await fs.writeFile(SUDO_FILE, JSON.stringify(list, null, 4), 'utf-8');
        // NOTE: Le bot doit être redémarré pour que la liste soit rechargée par index.js
    } catch (e) {
        console.error("Erreur d'écriture de sudo.json:", e);
        throw new Error("Impossible d'écrire dans le fichier sudo.json.");
    }
};

// ----------------------------------------------------
// --- Commande : !sudoadd (Ajouter un numéro) ---
// ----------------------------------------------------

cmd({
    pattern: "sudoadd",
    alias: ["addsudo"],
    desc: "Ajoute un utilisateur à la liste des Sudous.",
    category: "owner",
    react: "👑",
    SUDOCMD: true // Permet aux Sudous d'ajouter d'autres Sudous, si vous le souhaitez. (Peut être omis si seul l'Owner peut le faire)
},
async(conn, mek, m, { from, reply, q, isOwner }) => {
    
    if (!isOwner) {
        return reply("❌ Seul l'Owner du Bot peut gérer la liste des Sudous.");
    }
    
    if (!q) {
        return reply("Veuillez fournir un numéro (sans l'indicatif +, sans @s.whatsapp.net). Exemple: !sudoadd 50944737738");
    }
    
    const newSudoNumber = q.replace(/[^0-9]/g, ''); // Nettoyer le numéro

    try {
        let sudoList = await readSudoList();
        
        if (sudoList.includes(newSudoNumber)) {
            return reply(`⚠️ ${newSudoNumber} est déjà un Sudou.`);
        }
        
        sudoList.push(newSudoNumber);
        await writeSudoList(sudoList);
        
        reply(`✅ ${newSudoNumber} a été ajouté à la liste des Sudous.\n🚨 *REDÉMARRAGE NÉCESSAIRE* pour que les permissions soient appliquées.`);
        
    } catch (e) {
        reply(`❌ Échec de l'opération : ${e.message}`);
    }
});

// ----------------------------------------------------
// --- Commande : !sudoremove (Supprimer un numéro) ---
// ----------------------------------------------------

cmd({
    pattern: "sudoremove",
    alias: ["remsudo"],
    desc: "Supprime un utilisateur de la liste des Sudous.",
    category: "owner",
    react: "🗑️",
    SUDOCMD: true // Permet aux Sudous de retirer d'autres Sudous, si vous le souhaitez.
},
async(conn, mek, m, { from, reply, q, isOwner }) => {
    
    if (!isOwner) {
        return reply("❌ Seul l'Owner du Bot peut gérer la liste des Sudous.");
    }
    
    if (!q) {
        return reply("Veuillez fournir le numéro à supprimer. Exemple: !sudoremove 50944737738");
    }
    
    const targetSudoNumber = q.replace(/[^0-9]/g, '');

    try {
        let sudoList = await readSudoList();
        const initialLength = sudoList.length;
        
        sudoList = sudoList.filter(num => num !== targetSudoNumber);
        
        if (sudoList.length === initialLength) {
            return reply(`⚠️ ${targetSudoNumber} n'était pas dans la liste des Sudous.`);
        }
        
        await writeSudoList(sudoList);
        
        reply(`✅ ${targetSudoNumber} a été retiré de la liste des Sudous.\n🚨 *REDÉMARRAGE NÉCESSAIRE* pour que les permissions soient appliquées.`);
        
    } catch (e) {
        reply(`❌ Échec de l'opération : ${e.message}`);
    }
});
