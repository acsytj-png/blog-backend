require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// 配置跨域（允许你的前端域名访问）
app.use(cors({
  origin: ["https://blog.ytjacs.cn"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

// 解析JSON请求体
app.use(express.json());

// 连接MongoDB数据库
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB数据库连接成功"))
  .catch(err => {
    console.error("❌ MongoDB连接失败：", err);
    process.exit(1);
  });

// 定义博客数据模型
const postSchema = new mongoose.Schema({
  title: { type: String, required: [true, "博客标题不能为空"] },
  category: { type: String, default: "未分类" },
  content: { type: String, required: [true, "博客内容不能为空"] },
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model("Post", postSchema);

// API接口：获取所有博客
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: "获取博客列表失败：" + err.message });
  }
});

// API接口：获取单篇博客
app.get("/api/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "该博客不存在" });
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ message: "获取博客详情失败：" + err.message });
  }
});

// API接口：发布新博客
app.post("/api/posts", async (req, res) => {
  try {
    const newPost = new Post(req.body);
    await newPost.save();
    res.status(201).json({ message: "博客发布成功！", post: newPost });
  } catch (err) {
    res.status(400).json({ message: "发布博客失败：" + err.message });
  }
});

// 健康检查接口（Render必需）
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`✅ 后端服务器运行在端口 ${PORT}`);
});