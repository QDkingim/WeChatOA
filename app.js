const express = require("express");
const mainModule = require("./main");
const app = express();
const port = 9000;

app.get("/", async (req, res) => {
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
