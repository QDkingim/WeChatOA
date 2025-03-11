const axios = require("axios"); // 用于发送HTTP请求

// 配置API密钥和参数
const WEATHER_API_KEY = "5328f1abc2eb4ffea7cef89eb70cacfc"; // 替换为你的Key
let WEATHER_LOCATION = "101010100"; // 替换为你的城市代码，如北京
const HUANGLI_API_KEY = "5313f0a16ae2d48d86c89526ca7b4eeb"; // 替换为你的Key
const LOVE_TALK_API = "https://api.lovelive.tools/api/SweetNothings"; // 情话API
let latitude, longitude; // 用于存储地理位置信息
// 获取地理位置信息
async function getLocation() {
  const url = `https://geoapi.qweather.com/v2/city/lookup?location=卫辉&adm=新乡&key=${WEATHER_API_KEY}`;
  const response = await axios.get(url);
  // console.log(response.data); // 本地测试用
  // debugger;
  WEATHER_LOCATION = response.data.location[0].id; // 更新城市代码
  latitude = response.data.location[0].lat; // 纬度
  longitude = response.data.location[0].lon; // 经度
  return response.data.location[0]; // 返回城市基本信息
}

// 获取天气数据
async function getWeather() {
  const url = `https://devapi.qweather.com/v7/weather/now?location=${WEATHER_LOCATION}&key=${WEATHER_API_KEY}`;
  const response = await axios.get(url);
  return response.data.now; // 返回天气描述，如“晴”
}

// 获取黄历数据
async function getHuangli() {
  const today = new Date().toISOString().split("T")[0]; // 获取当前日期，如2023-10-20
  const url = `https://v.juhe.cn/laohuangli/d?date=${today}&key=${HUANGLI_API_KEY}`;
  const response = await axios.get(url);
  return response.data.result; // 返回宜忌信息
}

// 获取情话（每天随机）
async function getLoveTalk() {
  const response = await axios.get(LOVE_TALK_API);
  return response.data; // 返回一句情话
}

// 云函数主入口
// main = async (event, context) => {
exports.main = async (event, context) => {
  try {
    const location = await getLocation();
    const weather = await getWeather();
    const huangli = await getHuangli();
    const loveTalk = await getLoveTalk();

    // 组合消息
    const message = `今日天气：${weather.text}  温度：${weather.temp}°C  风力：${weather.windScale}  体感温度：${weather.feelsLike}°C \n\n今日宜：${huangli.yi}\n\n今日忌：${huangli.ji}\n\n宝宝今天我要对你说：${loveTalk}`;
    // console.log(message); // 本地测试用
    return message; // 返回消息，供后续发送
  } catch (error) {
    console.error("错误：", error);
    return "数据获取失败";
  }
};

// main();
