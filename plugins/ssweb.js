const { cmd } = require('../command');
const axios = require('axios'); // Nécessite 'npm install axios'
const fs = require('fs/promises'); // Pour la gestion asynchrone des fichiers
const fsSync = require('fs'); // Pour la vérification/création synchrone du dossier

// --- 1. Chemin du Dossier Spécifique ---
const CAPTURE_DIR = './sswebimage';

// --- 2. Fonction pour trouver le prochain nom de fichier ---
/**
 * Trouve le prochain nom de fichier libre sous le format imageX.png
 * en vérifiant l'existence de image1.png, image2.png, etc.
 */
const getNextImageFileName = () => {
    let index = 1;
    let fileName = '';
    let filePath = '';

    // Boucle pour trouver le premier index disponible
    do {
        fileName = `image${index}.png`;
        filePath = `${CAPTURE_DIR}/${fileName}`;
        index++;
    } while (fsSync.existsSync(filePath)); // S'arrête dès qu'un fichier n'existe pas

    return { fileName, filePath };
};

// --- 3. Création automatique du dossier si nécessaire (Logique d'initialisation) ---
// Cette fonction sera exécutée à chaque fois que le plugin est chargé.
const ensureDirExists = () => {
    if (!fsSync.existsSync(CAPTURE_DIR)) {
        try {
            fsSync.mkdirSync(CAPTURE_DIR);
            console.log(`Dossier '${CAPTURE_DIR}' créé automatiquement pour les captures d'écran.`);
        } catch (e) {
            console.error(`Erreur critique lors de la création du dossier '${CAPTURE_DIR}' :`, e);
        }
    }
};
// Exécuter l'initialisation immédiatement après la définition
ensureDirExists();
// -----------------------------------------------------------------------------------


cmd({
    pattern: "ss", 
    alias: ["screenshot", "capture"],
    desc: "Prend une capture d'écran de l'URL fournie et l'enregistre dans sswebimage/.",
    category: "tools",
    react: "📸"
},
async(conn, mek, m, { from, q, reply, myquoted }) => {
    
    // Vérifier si une URL a été fournie
    if (!q) {
        return reply("❌ Veuillez fournir une URL pour la capture d'écran. Exemple: !ss google.com");
    }
    
    const apiUrl = "https://fast-dev-apis.vercel.app/screenshot";
    // Assurer que l'URL commence par http(s)
    const targetUrl = q.startsWith('http') ? q : `https://${q}`;
    
    // Obtenir le chemin de fichier unique (e.g., ./sswebimage/image5.png)
    const { fileName, filePath } = getNextImageFileName(); 

    try {
        await reply(`⏳ Capture d'écran de *${targetUrl}* en cours...`);

        // --- Appel à l'API externe pour la capture d'écran ---
        const response = await axios.get(apiUrl, {
            params: {
                "url": targetUrl
            },
            responseType: 'arraybuffer' // Demander la réponse en binaire (Buffer)
        });

        // --- Traitement de la réponse ---
        if (response.status === 200 && response.headers['content-type'] && response.headers['content-type'].includes('image')) {
            
            const imageBuffer = response.data;

            // Enregistrer le buffer dans le fichier spécifique (e.g., ./sswebimage/imageX.png)
            await fs.writeFile(filePath, imageBuffer);
            
            // Envoyer l'image en utilisant le chemin du fichier local
            await conn.sendMessage(from, { 
                image: { url: filePath }, 
                caption: `𝑪𝑨𝑷𝑻𝑼𝑹𝑬 𝑭𝑶𝑹  *${targetUrl}*.\n> 𝑷𝑶𝑾𝑬𝑹𝑬𝑫 𝑩𝒀 𝑵𝑶𝑿 𝑴𝑰𝑵𝑰 𝑩𝑶𝑻*`
            }, { quoted: myquoted });
            
            // Laissez le fichier ici car vous vouliez qu'il soit stocké.

        } else {
            reply(`❌ Échec de la capture d'écran. Statut: ${response.status}.`);
        }

    } catch (error) {
        console.error("Erreur lors de l'exécution de la commande SS:", error.message);
        reply("❌ Une erreur est survenue lors de l'exécution de la commande. Vérifiez l'URL.");
        // Nettoyer en cas d'échec
        try { await fs.unlink(filePath); } catch {}
    }
});
