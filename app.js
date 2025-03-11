const express = require("express");
const mainModule = require("./main");
const crypto = require("crypto");
const xml2js = require("xml2js"); // 用于解析XML
const app = express();
const port = 9000;

// 中间件解析XML
// app.use(express.text({ type: "text/xml" }));

// 处理微信消息
app.post("/", (req, res) => {
  const xmlData = req.body; // 接收到的XML数据

  // 解析XML
  xml2js.parseString(xmlData, async (err, result) => {
    if (err) {
      console.error("解析失败:", err);
      res.send("");
      return;
    }

    const msg = result.xml;
    const { FromUserName, ToUserName, MsgType, Content } = msg;

    // 只处理文本消息
    if (MsgType[0] === "text") {
      const userContent = Content[0]; // 用户发送的内容
      let replyContent;
      if (userContent === "小宝") {
        replyContent = await mainModule.main(); // 自定义回复
      } else {
        replyContent = "哼，你不叫我小宝，我是不会理你的！"; // 自定义回复
      }

      // 构造回复XML
      const replyXml = `
        <xml>
          <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
          <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
          <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
          <MsgType><![CDATA[text]]></MsgType>
          <Content><![CDATA[${replyContent}]]></Content>
        </xml>`;

      // 返回给微信
      res.send(replyXml);
    } else {
      res.send(""); // 非文本消息不回复
    }
  });
});

app.get("/", async (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;
  const token = "ethan"; // 微信公众号后台配置的token

  // 微信服务器验证逻辑
  if (signature && timestamp && nonce && echostr) {
    try {
      // 1. 将token、timestamp、nonce三个参数进行字典序排序
      const tmpArr = [token, timestamp, nonce].sort();

      // 2. 将三个参数字符串拼接成一个字符串进行sha1加密
      const tmpStr = tmpArr.join("");
      const sha1Code = crypto.createHash("sha1");
      const code = sha1Code.update(tmpStr, "utf-8").digest("hex");

      // 3. 将加密后的字符串与signature对比，验证请求来源
      if (code === signature) {
        res.send(echostr);
        return;
      }
      res.status(403).send("验证失败");
      return;
    } catch (error) {
      res.status(500).send("服务器错误");
      return;
    }
  }

  // 原有业务逻辑
  try {
    const message = await mainModule.main();
    res.send(message);
  } catch (error) {
    res.status(500).send("服务器内部错误");
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
