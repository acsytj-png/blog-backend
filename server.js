// 1. 加载依赖和环境变量
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// 2. 创建Express应用
const app = express();
// Replit会自动分配PORT，兜底5000
const PORT = process.env.PORT || 5000;

// 3. 基础配置（跨域 + JSON解析）
// 允许所有前端访问（测试/个人用足够）
app.use(cors());
// 解析前端提交的JSON数据
app.use(express.json());

// 4. 连接MongoDB数据库（核心）
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB 连接成功！");
  } catch (err) {
    console.error("❌ MongoDB 连接失败：", err.message);
    // 数据库连不上也不退出服务，保证API能访问
  }
}
// 启动时连接数据库
connectDB();

// 5. 定义博客数据模型
const PostSchema = new mongoose.Schema({
  title: { type: String, required: [true, "标题不能为空"] },
  category: { type: String, default: "未分类" },
  content: { type: String, required: [true, "内容不能为空"] },
  createdAt: { type: Date, default: Date.now }
});
const Post = mongoose.model("Post", PostSchema);

// 6. 核心API接口
// 6.1 获取所有博客（倒序）
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: "获取博客失败：" + err.message });
  }
});

// 6.2 获取单篇博客（通过ID）
app.get("/api/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "博客不存在" });
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ message: "获取博客失败：" + err.message });
  }
});

// 6.3 发布新博客
app.post("/api/posts", async (req, res) => {
  try {
    const newPost = new Post(req.body);
    await newPost.save();
    res.status(201).json({ message: "发布成功！", post: newPost });
  } catch (err) {
    res.status(400).json({ message: "发布失败：" + err.message });
  }
});

// 6.4 健康检查接口（验证服务是否存活）
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", port: PORT });
});

// 7. 启动服务器
app.listen(PORT, () => {
  console.log("✅ 后端服务启动成功！端口：", PORT);
  console.log("🔗 访问地址：http://localhost:" + PORT);
});