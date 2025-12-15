//const fetch = require("node-fetch");
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, sleep, fetchJson} = require('../lib/functions')
const { cmd } = require("../command");

// get pair 2

cmd({
    pattern: "pair",
    alias: ["getpair", "clonebot"],
    react: "✅",
    desc: "Pairing code",
    category: "main",
    use: ".pair +50900XXX",
    filename: __filename
}, 
async (conn, mek, m, { from, prefix, quoted, q, reply }) => {
    try {
        // Helper function for delay
        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        // Validate input
        if (!q) {
            return await reply("*ᴇxᴀᴍᴘʟᴇ : .Pair 509xxxxx*");
        }

        // Fetch pairing code
        //const fetch = require("node-fetch");
        const response = await fetch(`https://test-c77o.onrender.com/code?number=${q}`);
        const pair = await response.json();

        // Check for errors in response
        if (!pair || !pair.code) {
            return await reply("Failed to retrieve pairing code. Please check the phone number and try again.");
        }

        // Success response
        const pairingCode = pair.code;
        const doneMessage = "> *𝙽𝙾𝚇 𝙼𝙸𝙽𝙸 𝙿𝙰𝙸𝚁 𝙲𝙾𝙳𝙴*";

        // Send first message
        await reply(`${doneMessage}\n\n> *𝚈𝙾𝚄𝚁 𝙿𝙰𝙸𝚁𝙸𝙽𝙶 𝙲𝙾𝙳𝙴 :* ${pairingCode}*`);

        // Add a delay of 2 seconds before sending the second message
        await sleep(2000);

        // Send second message with just the pairing code
        await reply(`${pairingCode}`);
    } catch (error) {
        console.error(error);
        await reply("An error occurred. Please try again later.");
    }
});
          
