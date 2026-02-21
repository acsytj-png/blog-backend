// 1. 加载依赖和环境变量
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
// 显式引入mongodb包（确保依赖生效）
const { MongoClient } = require("mongodb");

// 2. 创建Express应用
const app = express();
const PORT = process.env.PORT || 5000;

// 3. 基础配置
app.use(cors()); // 允许跨域
app.use(express.json()); // 解析JSON请求

// 4. 双重验证MongoDB连接（mongoose + mongodb原生）
async function connectDB() {
  try {
    // 方式1：mongoose连接（主连接）
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Mongoose 连接MongoDB成功！");

    // 方式2：mongodb原生连接（备用验证）
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    console.log("✅ MongoDB原生包连接成功！");
    client.close();
  } catch (err) {
    console.error("❌ MongoDB连接失败：", err.message);
  }
}
connectDB();

// 5. 博客数据模型
const PostSchema = new mongoose.Schema({
  title: { type: String, required: [true, "标题不能为空"] },
  category: { type: String, default: "未分类" },
  content: { type: String, required: [true, "内容不能为空"] },
  createdAt: { type: Date, default: Date.now }
});
const Post = mongoose.model("Post", PostSchema);

// 6. 核心API接口
// 6.1 健康检查
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", port: PORT });
});

// 6.2 获取所有博客
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: "获取博客失败：" + err.message });
  }
});

// 6.3 发布博客
app.post("/api/posts", async (req, res) => {
  try {
    const newPost = new Post(req.body);
    await newPost.save();
    res.status(201).json({ message: "发布成功！", post: newPost });
  } catch (err) {
    res.status(400).json({ message: "发布失败：" + err.message });
  }
});

// 7. 启动服务器
app.listen(PORT, () => {
  console.log(`✅ 后端服务启动成功！端口：${PORT}`);
  console.log(`🔗 访问地址：https://localhost:${PORT}`);
});