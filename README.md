# 离散—连续转换实验室 JavaScript 版

这是 `Discrete_Continuous_Lab` 的纯前端 JavaScript 改写版本。项目不使用 React、Vue、数据库或后端服务，直接通过浏览器运行。

## 技术栈

- HTML
- CSS
- JavaScript
- Plotly.js
- Math.js

## 项目结构

```text
Discrete_Continou_java/
├── index.html
├── styles.css
├── app.js
├── README.md
└── .gitignore
```

## 本地运行

可以直接双击打开 `index.html`。

页面通过 CDN 加载 Plotly.js 和 Math.js，因此首次打开时需要能够访问互联网。

如果浏览器限制本地脚本，也可以启动一个简单静态服务器：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

## 功能

- 输入数列表达式，例如 `n**2`、`n**3`、`log(n)/n`、`exp(n/10)`。
- 自动绘制“数列 → 函数”的稠密化过程。
- 自动绘制“差分 → 导函数”的差分稠密化过程。
- 支持 `0-15` 的抽样区间滑块，`n` 表示相邻两个整数点之间的采样点数。
- 支持自动演示。
- 支持设置自变量取值范围，例如 `0` 到 `100`。
- 输入表达式或自变量范围错误时，会提示错误并保留上一轮有效图像。

## 表达式说明

页面兼容原 Python 版常用输入：

```text
n**2
n**3
log(n)/n
exp(n/10)
sqrt(n)
sin(n)
```

内部会自动把 `**` 转换为 Math.js 使用的 `^`。

## 部署

这是静态网页项目，可以部署到：

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

上传整个文件夹后，将入口文件设置为：

```text
index.html
```
