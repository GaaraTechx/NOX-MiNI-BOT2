const { cmd } = require('../command');
const axios = require('axios'); // Nécessite 'npm install axios'
const fs = require('fs/promises'); // Pour la gestion asynchrone des fichiers
const fsSync = require('fs'); // Pour la vérification/création synchrone du dossier

// --- Fonction pour convertir en style Typewriter (Monospacé) ---
// Remplace chaque caractère par son équivalent Unicode Monospacé.
const toTypewriter = (text) => {
    if (!text) return '';
    // Utilise les caractères Unicode Fullwidth pour les chiffres et les lettres
    return text.split('').map(char => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) { // A-Z
            return String.fromCharCode(code + 127391);
        } else if (code >= 97 && code <= 122) { // a-z
            return String.fromCharCode(code + 127391);
        } else if (code >= 48 && code <= 57) { // 0-9
            return String.fromCharCode(code + 127381);
        }
        return char; // Laisse les autres caractères (espaces, :, -, etc.) tels quels
    }).join('');
};

// --- Chemin du Dossier Temporaire (pour les téléchargements) ---
const TEMP_DIR = './temp_downloads';

// --- Création automatique du dossier si nécessaire ---
const ensureDirExists = () => {
    if (!fsSync.existsSync(TEMP_DIR)) {
        try {
            fsSync.mkdirSync(TEMP_DIR);
            console.log(`Dossier temporaire '${TEMP_DIR}' créé automatiquement.`);
        } catch (e) {
            console.error(`Erreur critique lors de la création du dossier '${TEMP_DIR}' :`, e);
        }
    }
};
ensureDirExists();
// -------------------------------------------------------------------

cmd({
    pattern: "instadl", 
    alias: ["igdl", "reel", "insta"],
    desc: "Télécharge le contenu (Reel, Photo) d'une URL Instagram et affiche les statistiques.",
    category: "download",
    react: "⬇️"
},
async(conn, mek, m, { from, q, reply, myquoted }) => {
    
    // Vérifier si une URL a été fournie
    if (!q || !q.includes('instagram.com')) {
        return reply("❌ Veuillez fournir une URL valide de Reel ou de publication Instagram.");
    }
    
    const apiUrl = "https://fast-dev-apis.vercel.app/instadl";
    const targetUrl = q;
    
    // Nom de fichier temporaire unique
    const tempFilePath = `${TEMP_DIR}/igdl_${Date.now()}`; 

    try {
        await reply("⏳ Récupération des informations et du fichier Instagram en cours...");

        // --- 1. Appel à l'API Instagram DL ---
        const response = await axios.get(apiUrl, {
            params: { "url": targetUrl }
        });

        // Vérification de la réponse API
        if (response.status !== 200 || !response.data || !response.data.results) {
            return reply(`❌ Échec de la récupération des données Instagram. Statut: ${response.status}.`);
        }
        
        const data = response.data.results;
        
        // Assurez-vous qu'il y a du contenu à télécharger
        if (!data.medias || data.medias.length === 0) {
            return reply("❌ Aucun média trouvé dans cette publication. Le lien est-il correct ou privé ?");
        }

        const media = data.medias[0]; // On prend le premier média (pour les Reels/Photos simples)
        const downloadUrl = media.url;
        const mediaType = media.type; // 'video' ou 'image'
        
        // --- 2. Construction du Caption avec le style Typewriter ---
        
        // Formattage des stats
        
        
        let caption = `
╭━━━〔 𝐈𝐍𝐒𝐓𝐀𝐆𝐑𝐀𝐌 𝐃𝐋 〕━━━┈
┃ 🔗 *𝐋𝐈𝐄𝐍 :* ${targetUrl}
╰━━━━━━━━━━━━━━━━━┈
`;
        
        // --- 3. Téléchargement du Fichier ---
        
        const fileResponse = await axios.get(downloadUrl, {
            responseType: 'arraybuffer' 
        });
        
        const fileExtension = mediaType === 'video' ? 'mp4' : 'png';
        const finalFilePath = `${tempFilePath}.${fileExtension}`;
        
        await fs.writeFile(finalFilePath, fileResponse.data);

        // --- 4. Envoi du Média ---
        
        const messageOptions = {
            caption: caption,
            quoted: myquoted
        };

        if (mediaType === 'video') {
            messageOptions.video = { url: finalFilePath };
        } else {
            messageOptions.image = { url: finalFilePath };
        }

        await conn.sendMessage(from, messageOptions);
        
        // --- 5. Pied de page (Footer) ---
        // Le Footer est hors du style Typewriter comme demandé
        await reply(`
${caption}

*𝑷𝑶𝑾𝑬𝑹𝑬𝑫 𝑩𝒀 𝑵𝑶𝑿 𝑴𝑰𝑵𝑰 𝑩𝑶𝒀*
        `);


    } catch (error) {
        console.error("Erreur lors de l'exécution de la commande INSTADL:", error);
        reply("❌ Une erreur est survenue lors du traitement de votre demande Instagram. Assurez-vous que le lien est public.");
    } finally {
        // --- 6. Nettoyage ---
        // Supprimer le fichier temporaire, que l'envoi ait réussi ou non.
        try { 
            await fs.unlink(finalFilePath); 
        } catch (e) {
            // Ignorer les erreurs si le fichier n'a jamais été créé
            console.error("Erreur lors de la suppression du fichier temporaire:", e.message); 
        }
    }
});
