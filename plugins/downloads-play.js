import yts from "yt-search";
import fetch from "node-fetch";

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply("🎶 Ingresa el nombre o el enlace de YouTube.");

  await m.react("🕘");

  try {
    let url = text;
    let title = "Desconocido";
    let authorName = "Desconocido";
    let durationTimestamp = "Desconocida";
    let views = "Desconocidas";
    let thumbnail = "";

    // Buscador de YouTube si no es link
    if (!text.startsWith("https://")) {
      const res = await yts(text);
      if (!res?.videos?.length) return m.reply("🚫 No encontré resultados.");
      const video = res.videos[0];
      title = video.title;
      authorName = video.author?.name;
      durationTimestamp = video.timestamp;
      views = video.views;
      url = video.url;
      thumbnail = video.thumbnail;
    }

    const vistas = formatViews(views);
    const thumb = (await conn.getFile(thumbnail)).data;

    const caption = `
✧━───『 𝙸𝚗𝚏𝚘 𝚍𝚎𝚕 𝚅𝚒𝚍𝚎𝚘 』───━✧

👻 𝑻𝒊́𝒕𝒖𝒍𝒐: ${title}
😉 𝑪𝒂𝒏𝒂𝒍: ${authorName}
👁️ 𝑽𝒊𝒔𝒕𝒂𝒔: ${vistas}
⏳ 𝑫𝒖𝒓𝒂𝒄𝒊𝒐́𝒏: ${durationTimestamp}
🔗 𝑬𝒏𝒍𝒂𝒄𝒆: ${url}

✧━───『 gһ᥆s𝗍 ᑲ᥆𝗍 』───━✧
⚡ 𝑷𝒐𝒘𝒆𝒓𝒆𝒅 𝒃𝒚 𝒀𝒐𝒔𝒖𝒆 :D ⚡
`;

    // Enviamos el mensaje con botones
    await conn.sendMessage(
      m.chat,
      {
        image: thumb,
        caption,
        footer: "⚡ Shadow — Descargas rápidas ⚡",
        buttons: [
          { buttonId: `shadowaudio ${url}`, buttonText: { displayText: "🎵 Audio" }, type: 1 },
          { buttonId: `shadowvideo ${url}`, buttonText: { displayText: "🎬 Video" }, type: 1 },
        ],
        headerType: 4,
      },
      { quoted: m }
    );

    await m.react("✅");
  } catch (e) {
    m.reply("❌ Error: " + e.message);
  }
};

// Manejador de los botones
handler.before = async (m, { conn }) => {
  const selected = m?.message?.buttonsResponseMessage?.selectedButtonId;
  if (!selected) return;

  const parts = selected.split(" ");
  const cmd = parts.shift();
  const url = parts.join(" ");

  if (cmd === "shadowaudio") return downloadMedia(conn, m, url, "mp3");
  if (cmd === "shadowvideo") return downloadMedia(conn, m, url, "mp4");
};

// Función principal de descarga
const downloadMedia = async (conn, m, url, type) => {
  try {
    const sent = await conn.sendMessage(m.chat, { text: `⏳ Procesando ${type}...` }, { quoted: m });

    // Tu API corregida con la nueva Key
    const apiUrl =
  type === "mp3"
    ? `https://api.darkcore.xyz/api/descargar/mp3?url=${encodeURIComponent(url)}&key=shd_488b9c30e05c0927d77f79a6`
    : `https://api.darkcore.xyz/api/descargar/mp4?url=${encodeURIComponent(url)}&key=shd_488b9c30e05c0927d77f79a6`;

    const r = await fetch(apiUrl);
const text = await r.text();

console.log("API RESPONSE:", text);

// Intentamos parsear solo si es JSON
let data;
try {
  data = JSON.parse(text);
} catch {
  throw new Error("La API no devolvió JSON válido");
}

    if (!data?.status) return m.reply("🚫 Error: La API no pudo procesar el archivo.");

    // Mapeo directo desde la raíz del JSON
    const fileUrl = type === "mp3" ? data.audio_url : data.video_url;
    const fileTitle = cleanName(data.titulo || "Shadow_File");

    if (!fileUrl) return m.reply("🚫 Enlace no encontrado.");

    if (type === "mp3") {
      const res = await fetch(fileUrl);
      const audioBuffer = Buffer.from(await res.arrayBuffer());
      
      await conn.sendMessage(
        m.chat,
        {
          audio: audioBuffer,
          mimetype: "audio/mpeg",
          ptt: false,
        },
        { quoted: m }
      );
    } else {
      await conn.sendMessage(
        m.chat,
        {
          video: { url: fileUrl },
          mimetype: "video/mp4",
          fileName: `${fileTitle}.mp4`,
          caption: `✅ ${fileTitle}`,
        },
        { quoted: m }
      );
    }

    await conn.sendMessage(m.chat, { text: `✅ ¡Listo!`, edit: sent.key });
    await m.react("✅");

  } catch (e) {
    console.error(e);
    m.reply("❌ Error en descarga: " + e.message);
  }
};

// Utilidades
const cleanName = (name) => name.replace(/[^\w\s-_.]/gi, "").substring(0, 50);

const formatViews = (views) => {
  if (!views) return "0";
  if (views >= 1e9) return `${(views / 1e9).toFixed(1)}B`;
  if (views >= 1e6) return `${(views / 1e6).toFixed(1)}M`;
  if (views >= 1e3) return `${(views / 1e3).toFixed(1)}K`;
  return views.toString();
};

handler.command = ["play", "play2", "ytmp3", "ytmp4", "yt"];
handler.tags = ["descargas"];
handler.register = true;

export default handler;