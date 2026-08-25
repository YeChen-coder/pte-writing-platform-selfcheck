# PTE Writing Email Self-Check Platform

## 中文说明

这是一个用于练习 PTE Core Writing Email 的本地网页平台。

主要功能：

- 管理 13 篇 Writing Email 题目
- 显示题目图片和可编辑例文
- 支持“显示例文”和“不显示例文”两种练习模式
- 按单词比较输入内容与参考例文
- 检测匹配、替换/拼写错误、漏写和多写
- 在浏览器本地保存题库修改和练习输入
- 支持导入和导出题库 JSON

### 本地运行

本项目是无依赖的静态网页，不需要 Node.js、数据库或环境变量。

直接打开 `index.html`，或者双击桌面上的启动脚本即可运行。

如果希望通过本地 HTTP 服务运行，可以在项目目录执行：

```powershell
python -m http.server 8000
```

然后访问 `http://localhost:8000`。

### 目录说明

- `index.html`: 页面结构
- `app.js`: 题库管理、练习交互和逐词对比逻辑
- `styles.css`: 页面样式
- `data/email-library.json`: 可编辑的题库文字数据
- `data/email-library.js`: 浏览器直接打开页面时使用的题库种子数据
- `data/images/`: 13 张题目图片
- `scripts/import_writing_email_docx.py`: 从 Word 文件重新导入题库
- `DEPLOYMENT.md`: 更完整的本地运行和 GitHub Pages 部署说明

### 重新导入 Word 题库

原始 Word 文件默认不会提交到 Git。若本地存在 `Writing Email_Cleaned.docx`，可以执行：

```powershell
$py = "C:\Users\yeche\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
& $py ".\scripts\import_writing_email_docx.py" ".\Writing Email_Cleaned.docx" "."
```

## English

This is a local web platform for practicing PTE Core Writing Email.

Features include:

- Manage 13 Writing Email prompts
- Display prompt images and edit sample answers
- Practice with the sample answer visible or hidden
- Compare the typed answer with the reference answer word by word
- Detect matching words, replacements/spelling errors, missing words, and extra words
- Store question-bank edits and practice answers in the browser locally
- Import and export the question bank as JSON

### Run locally

This is a dependency-free static web app. It does not require Node.js, a database, or environment variables.

Open `index.html` directly, or double-click the desktop launcher.

For a local HTTP server, run this command from the project directory:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

### Project files

- `index.html`: Page structure
- `app.js`: Library management, practice interaction, and word-by-word comparison
- `styles.css`: Page styling
- `data/email-library.json`: Editable question-bank text data
- `data/email-library.js`: Browser-loadable seed data for direct local opening
- `data/images/`: The 13 prompt images
- `scripts/import_writing_email_docx.py`: Re-imports the question bank from a Word document
- `DEPLOYMENT.md`: Detailed local and GitHub Pages deployment instructions

### Re-import the Word question bank

The original Word document is intentionally excluded from Git. If `Writing Email_Cleaned.docx` exists locally, run:

```powershell
$py = "C:\Users\yeche\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
& $py ".\scripts\import_writing_email_docx.py" ".\Writing Email_Cleaned.docx" "."
```
