const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { cmd } = require("../command");

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

cmd({
  pattern: "rmbg",
  alias: ["removebg"],
  react: "📸",
  desc: "Remove background from image",
  category: "img_edit",
  use: ".rmbg (reply image)",
  filename: __filename
}, 
async (conn, mek, m, { reply, myquoted }) => {
  try {
    const quoted = m.quoted || myquoted || m;
    const mime = quoted.mimetype || "";

    if (!mime.startsWith("image/"))
      return reply("❌ Please reply to an *image* (jpeg/png).");

    const buffer = await quoted.download();

    let ext = mime.includes("jpeg") ? ".jpg" :
              mime.includes("png")  ? ".png" : null;

    if (!ext) return reply("❌ Supported formats: *JPEG / PNG*.");

    const tempFile = path.join(os.tmpdir(), `removebg_${Date.now()}${ext}`);
    fs.writeFileSync(tempFile, buffer);


    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", fs.createReadStream(tempFile));

    const upload = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders()
    });

    fs.unlinkSync(tempFile);

    if (!upload.data.startsWith("https://"))
      return reply("❌ Catbox upload failed.");

    const url = upload.data;


    const api = `https://apis.davidcyriltech.my.id/removebg?url=${encodeURIComponent(url)}`;
    const remove = await axios.get(api, { responseType: "arraybuffer" });

    const finalImg = Buffer.from(remove.data);

    await conn.sendMessage(m.chat, {
      image: finalImg,
      caption: "✨ Background removed\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅʏʙʏ ᴛᴇᴄʜ"
    });

  } catch (err) {
    reply(`❌ Error: ${err.message}`);
  }
});
