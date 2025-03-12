const crypto = require("crypto");
const xml2js = require("xml2js");
const mainModule = require("./main");

// 微信服务器配置的 Token
const token = "ethan";

// 验证微信签名
function verifySignature(query) {
  const { signature, timestamp, nonce } = query;
  const hash = crypto.createHash("sha1");
  const str = [token, timestamp, nonce].sort().join("");
  hash.update(str);
  return hash.digest("hex") === signature;
}

// 解析 XML 消息
function parseXml(xml) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, { explicitArray: false }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.xml);
      }
    });
  });
}

// 构建回复消息的 XML
function buildReplyMessage(toUser, fromUser, content) {
  const createTime = Math.floor(Date.now() / 1000);
  return `<xml>
    <ToUserName><![CDATA[${toUser}]]></ToUserName>
    <FromUserName><![CDATA[${fromUser}]]></FromUserName>
    <CreateTime>${createTime}</CreateTime>
    <MsgType><![CDATA[text]]></MsgType>
    <Content><![CDATA[${content}]]></Content>
  </xml>`;
}

// 主处理函数
exports.main_handler = async (event, context) => {
  const { queryString, body, httpMethod } = event;

  // 验证签名
  if (!verifySignature(queryString)) {
    return {
      statusCode: 401,
      body: "Unauthorized",
    };
  }

  // 处理微信服务器的验证请求
  if (httpMethod === "GET") {
    return {
      statusCode: 200,
      body: queryString.echostr,
    };
  }

  // 处理用户发送的消息
  if (httpMethod === "POST") {
    try {
      const xmlData = body;
      const parsedMessage = await parseXml(xmlData);
      const { ToUserName, FromUserName, Content } = parsedMessage;
      let replyContent;
      if (Content === "小宝") {
        replyContent = await mainModule.main(); // 自定义回复
      } else {
        replyContent = "哼，你不叫我小宝，我是不会理你的！"; // 自定义回复
      }
      // 根据收到的消息内容进行处理，这里简单地回复相同的内容
      const replyMessage = buildReplyMessage(
        FromUserName,
        ToUserName,
        replyContent
      );

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/xml" },
        body: replyMessage,
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: "Internal Server Error",
      };
    }
  }

  return {
    statusCode: 405,
    body: "Method Not Allowed",
  };
};
