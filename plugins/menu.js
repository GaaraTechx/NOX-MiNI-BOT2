const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');

// NOTE: Le chemin vers le dossier 'plugins' doit être ajusté si votre structure de fichiers est différente.
// Ici, on suppose que 'plugins' est le dossier parent du fichier 'menu.js'.
const PLUGINS_DIR = path.join(__dirname, '..', 'plugins'); 

cmd({
    pattern: "menu",
    desc: "Affiche la liste de toutes les commandes disponibles, classées par catégorie.",
    category: "Utility",
    react: "📜"
},
async (socket, mek, m, { reply, args, from }) => {

    // 1. Lire tous les fichiers dans le dossier plugins
    let pluginFiles;
    try {
        pluginFiles = fs.readdirSync(PLUGINS_DIR);
    } catch (e) {
        console.error("Erreur lors de la lecture du dossier plugins:", e);
        return reply("❌ *Erreur* : Impossible de lire le dossier des plugins.");
    }

    // 2. Filtrer et charger les informations des plugins
    const allCommands = {};

    for (const file of pluginFiles) {
        // S'assurer que c'est un fichier .js et qu'il ne s'agit pas du plugin menu lui-même
        if (file.endsWith('.js') && file !== 'menu.js') {
            try {
                // Construction du chemin absolu pour l'importation
                const pluginPath = path.join(PLUGINS_DIR, file);
                
                // Suppression du cache pour recharger les plugins s'ils sont modifiés (important en dev)
                // Note: En production, cela n'est pas toujours nécessaire et peut être retiré.
                delete require.cache[require.resolve(pluginPath)]; 
                
                // Importation du plugin
                const plugin = require(pluginPath); 

                // Les informations du plugin sont généralement stockées dans le premier argument de cmd()
                if (plugin && typeof plugin === 'object' && plugin.pattern && plugin.category) {
                    const category = plugin.category.toUpperCase();
                    
                    if (!allCommands[category]) {
                        allCommands[category] = [];
                    }

                    // Ajout du pattern et de la description dans la catégorie correspondante
                    allCommands[category].push({
                        pattern: plugin.pattern,
                        desc: plugin.desc || "Pas de description fournie."
                    });
                }
            } catch (e) {
                console.error(`Erreur lors du chargement de ${file}:`, e.message);
                // On ignore les fichiers qui provoquent une erreur de chargement
            }
        }
    }

    // 3. Construction du message de menu
    let menuText = "📜 *LISTE DES COMMANDES DISPONIBLES* 📜\n\n";

    const categories = Object.keys(allCommands).sort();

    if (categories.length === 0) {
        menuText += "Aucune commande trouvée. Le dossier des plugins est vide ou mal configuré.";
    } else {
        for (const category of categories) {
            menuText += `\n╭─「 *${category}* 」\n`;
            
            // Tri des commandes par ordre alphabétique pour la lisibilité
            allCommands[category].sort((a, b) => a.pattern.localeCompare(b.pattern));
            
            for (const cmd of allCommands[category]) {
                // Utilisation du premier pattern s'il y en a plusieurs (ex: "ss|screenshot")
                const mainPattern = cmd.pattern.split('|')[0]; 
                
                menuText += `│ 🏷️ *!${mainPattern}* : ${cmd.desc}\n`;
            }
            menuText += "╰──────────────────\n";
        }
    }
    
    // 4. Envoi du message final
    reply(menuText);
});
          
