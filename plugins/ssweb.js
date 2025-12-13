Const { cmd } = require('../command');
const axios = require("axios");
const URL_API = "https://fast-dev-apis.vercel.app/screenshot"; // Définir l'URL de l'API

cmd({
    pattern: "ss|screenshot",
    desc: "Prend une capture d'écran d'un site web via une URL.",
    category: "Utility",
    react: "📸"
},
async (socket, mek, m, { reply, args, from }) => {

    let targetUrl = args.join(" ");

    // 1. Vérification de l'URL fournie
    if (!targetUrl) {
        return reply(`
📸 *SCREENSHOT UTILITY* 🌐

Veuillez fournir l'URL du site web à capturer.

*Exemple :*
\`!ss https://www.google.com\`
        `);
    }

    // Ajouter 'https://' si manquant pour garantir le bon formatage de l'URL
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
    }
    
    reply("⏳ *Capture en cours...* Veuillez patienter.");

    try {
        const params = {
            url: targetUrl
        };

        // 2. Appel de l'API pour obtenir la capture (réponse binaire)
        const response = await axios.get(URL_API, { 
            params: params,
            responseType: 'arraybuffer' // Demande de la réponse en tant que Buffer
        });
        
        // 3. Vérification du statut HTTP
        if (response.status !== 200 || !response.data) {
            return reply(`❌ *Erreur* : Impossible de récupérer la capture d'écran. Statut : ${response.status}`);
        }

        const buffer = Buffer.from(response.data);

        // 4. Envoi de l'image (capture d'écran)
        await socket.sendMessage(from, {
            image: buffer,
            caption: `
📸 *Capture d'Écran* 🌐
-----------------------------
🔗 **URL :** \`${targetUrl}\`
-----------------------------
            `
        });

    } catch (e) {
        console.error("Erreur lors de la capture d'écran :", e.message);
        // Gérer les erreurs de connexion ou de l'API
        reply("❌ *Erreur Système* : Une erreur est survenue lors de l'appel de l'API. Assurez-vous que l'URL est valide et accessible.");
    }
});
  
