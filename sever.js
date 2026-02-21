// 加载环境变量（本地+Vercel都生效）
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// 创建Express应用
const app = express();
// 兼容Vercel的端口（Vercel会自动分配PORT环境变量）
const PORT = process.env.PORT || 3000;

// 配置跨域（允许你的前端域名访问，替换为实际前端域名）
app.use(cors({
  origin: ["https://blog.ytjacs.cn"], // 你的前端域名，保持不变
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

// 解析JSON请求体（接收前端提交的博客数据）
app.use(express.json());

// 连接MongoDB数据库（核心逻辑，保持不变）
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB数据库连接成功"))
  .catch(err => {
    console.error("❌ MongoDB连接失败：", err);
    // 非生产环境才退出进程（兼容Vercel的进程管理）
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
  });

// 定义博客数据模型（核心逻辑，保持不变）
const postSchema = new mongoose.Schema({
  title: { type: String, required: [true, "博客标题不能为空"] },
  category: { type: String, default: "未分类" },
  content: { type: String, required: [true, "博客内容不能为空"] },
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model("Post", postSchema);

// API接口1：获取所有博客列表（按创建时间倒序）
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: "获取博客列表失败：" + err.message });
  }
});

// API接口2：获取单篇博客详情（通过ID）
app.get("/api/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "该博客不存在" });
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ message: "获取博客详情失败：" + err.message });
  }
});

// API接口3：发布新博客
app.post("/api/posts", async (req, res) => {
  try {
    const newPost = new Post(req.body);
    await newPost.save();
    res.status(201).json({ message: "博客发布成功！", post: newPost });
  } catch (err) {
    res.status(400).json({ message: "发布博客失败：" + err.message });
  }
});

// 健康检查接口（Vercel/Render通用，验证服务是否存活）
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// 适配Vercel的启动逻辑：本地开发时监听端口，Vercel生产环境导出app
if (process.env.NODE_ENV !== "production") {
  // 本地开发环境（npm start）：手动监听端口
  app.listen(PORT, () => {
    console.log(`✅ 后端服务器运行在端口 ${PORT}`);
  });
}

// 导出app供Vercel的Node.js运行时使用（核心适配点）
module.exports = app;