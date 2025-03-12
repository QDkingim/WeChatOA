const crypto = require("crypto");
const xml2js = require("xml2js");
const axios = require("axios");
const mainModule = require("./main");

// 微信配置参数
const config = {
  appId: "wx9c47973f9723b1af", // 请替换为实际AppID
  appSecret: "9d0d2e0fa9e4720da3fe492b1873a292", // 请替换为实际AppSecret
  token: "ethan",
};

// 全局缓存access_token
let accessToken = {
  value: "",
  expires: 0,
};

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

// 获取微信access_token
async function getAccessToken() {
  const now = Date.now();
  if (accessToken.value && now < accessToken.expires) {
    return accessToken.value;
  }

  try {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appId}&secret=${config.appSecret}`;
    const response = await axios.get(url);

    if (response.data.errcode) {
      throw new Error(response.data.errmsg);
    }

    accessToken = {
      value: response.data.access_token,
      expires: now + (response.data.expires_in - 300) * 1000, // 提前5分钟刷新
    };

    return accessToken.value;
  } catch (error) {
    console.error("获取access_token失败:", error.message);
    throw error;
  }
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
// 主动推送消息给用户
async function sendMessageToUser(openId, content) {
  try {
    const accessToken = await getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${accessToken}`;

    const message = {
      touser: openId,
      msgtype: "text",
      text: {
        content: content,
      },
    };

    const response = await axios.post(url, message);

    if (response.data.errcode && response.data.errcode !== 0) {
      throw new Error(response.data.errmsg);
    }

    return true;
  } catch (error) {
    console.error("消息推送失败:", error.message);
    return false;
  }
}

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

// 导出推送消息方法
module.exports = {
  ...module.exports,
  sendMessageToUser,
};
