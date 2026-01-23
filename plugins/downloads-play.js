import yts from "yt-search";
import fetch from "node-fetch";

const DARKCORE_KEY = "shd_488b9c30e05c0927d77f79a6"; // tu key

const handler = async (m, { conn, text }) => {
  if (!text) return m.reply("🎶 Ingresa nombre o enlace de YouTube.");

  await m.react("🕘");

  try {
    let url = text;
    let title = "Desconocido";
    let authorName = "Desconocido";
    let durationTimestamp = "Desconocida";
    let views = "Desconocidas";
    let thumbnail = "";

    // si no es link, busca
    if (!text.startsWith("http")) {
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
⚡ 𝑷𝒐𝒘𝒆𝒓𝒆𝒅 𝒃𝒚 Picolas ⚡
`;

    await conn.sendMessage(
      m.chat,
      {
        image: thumb,
        caption,
        footer: "⚡ Shadow — Descargas rápidas ⚡",
        buttons: [
          { buttonId: `playaudio ${url}`, buttonText: { displayText: "🎵 Audio" }, type: 1 },
          { buttonId: `playvideo ${url}`, buttonText: { displayText: "🎬 Video" }, type: 1 },
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

// botones
handler.before = async (m, { conn }) => {
  const selected = m?.message?.buttonsResponseMessage?.selectedButtonId;
  if (!selected) return;

  const [cmd, ...parts] = selected.split(" ");
  const url = parts.join(" ");

  if (cmd === "playaudio") return downloadMedia(conn, m, url, "mp3");
  if (cmd === "playvideo") return downloadMedia(conn, m, url, "mp4");
};

// descarga
const downloadMedia = async (conn, m, url, type) => {
  try {
    await conn.sendMessage(m.chat, { text: `⏳ Procesando ${type}...` }, { quoted: m });

    const apiUrl = `https://api.darkcore.xyz/api/descargar/${type}?url=${encodeURIComponent(url)}&key=${DARKCORE_KEY}`;

    const r = await fetch(apiUrl);
    const data = await r.json();

    if (!data?.status) return m.reply("🚫 La API no pudo procesar este video.");

    const fileUrl = type === "mp3" ? data.audio_url : data.video_url;
    const fileTitle = cleanName(data.titulo || "Shadow_File");

    if (!fileUrl) return m.reply("🚫 Enlace no encontrado.");

    if (type === "mp3") {
      const res = await fetch(fileUrl);
      const audioBuffer = Buffer.from(await res.arrayBuffer());

      await conn.sendMessage(
        m.chat,
        { audio: audioBuffer, mimetype: "audio/mpeg", ptt: false },
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

    await conn.sendMessage(m.chat, { text: `✅ ¡Listo!` });
    await m.react("✅");

  } catch (e) {
    console.error(e);
    m.reply("❌ Error en descarga: " + e.message);
  }
};

// utilidades
const cleanName = (name) => name.replace(/[^\w\s-_.]/gi, "").substring(0, 50);
const formatViews = (views) => {
  if (!views) return "0";
  if (views >= 1e9) return `${(views / 1e9).toFixed(1)}B`;
  if (views >= 1e6) return `${(views / 1e6).toFixed(1)}M`;
  if (views >= 1e3) return `${(views / 1e3).toFixed(1)}K`;
  return views.toString();
};

handler.command = ["play", "play2", "yt", "ytmp3", "ytmp4"];
handler.tags = ["descargas"];
handler.register = true;

export default handler;
