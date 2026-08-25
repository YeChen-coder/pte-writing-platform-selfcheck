# PTE Writing Email Self-Check Platform

## 中文说明

这个是给 PTE Core 的 Writing Email 准备用的。（注意一下，这里面是不包括那个例文的。界面上的那个例文，它1000%纯AI写的，只是告诉大家自己准备的例文往哪里粘而已。它不是一个用于背诵的东西。）

话先说在前面，虽然把这个做出来了，但作者觉得这东西真没有什么大用。因为在考场上一紧张很容易忘句子，而 Writing Email 忘不忘句子其实不重要，反正凑够字数就行；最重要的是保证不打错字、语法正确，至于范文好不好、跟不跟范文走，问题都不大。

所以作者单纯是觉得既然做了就先放这儿吧，但再次强调，作者觉得这个平台没什么用。不过也不好说，大家可能可以把它用在别的地方，就这样吧。如果有什么要定制化的东西，可以让自家的 Codex 或者 Claude Code 去改改咯。

下图是它的一个界面的图。

<img width="1085" height="725" alt="pte-writingemail" src="https://github.com/user-attachments/assets/f6284509-472c-473b-b2d7-10154f1503ec" />

这边整体的设计思路，主要是根据作者经常犯的错来设计的。作者经常会因为粗心大意漏写东西，比如漏掉一些介词，或者 the、a、and 之类的词。所以这里加了一个功能（具体看下图）：类似于你输入的时候觉得自己写得一点问题都没有，但实际上漏了不少重要的东西，它能帮你直接比对出来。

<img width="280" height="693" alt="pte-we-typo" src="https://github.com/user-attachments/assets/c140396b-9efe-45c1-b611-62ea31774fef" />

另外，本着方便使用、减少重复劳动的原则：

（1）当你把自己的例文粘贴上去后，系统是支持保存的，不用每次练习都重新粘贴一遍例文

（2）题库一共 13 道题，每道题都是分开且支持单独保存的，避免重复劳动

（3）自己放上去的例文随时可以修改，点“编辑例文” - 直接把新例文粘过去保存，就可以开始练习了 （在 deployment.md 这个文件里面，确实写了可以通过整体导入导出来处理这些题目的 JSON 文件。但是作者自己实际使用下来，觉得还是在页面上直接改更方便一点，不至于再去折腾 JSON 了。你就在页面直接改吧，多方便、多直接啊！大家都是来备考的，就别给自己在这方面添堵了。）

下图是两种不同的模式：

例文对照模式：单纯显示你自己写的例文，你照着输入即可。这个模式是为了减少类似“呃”、“the”、“and”这种完全没注意、直接漏掉的问题，同时也能帮你查出日常打词时自己都不注意的一些拼写错误；

纯背诵模式。

这两种模式都可以选，自由度非常之高。

<img width="469" height="172" alt="pte-mode" src="https://github.com/user-attachments/assets/5a4b927b-d67b-4a9f-a426-24f5764ee2f6" />

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

## English

This is a local web platform for practicing PTE Core Writing Email. The sample answers are not included as fixed exam answers; users can paste, edit, and maintain their own reference answers in the interface.

The platform is designed to help detect careless typing mistakes, including missing prepositions, articles, conjunctions, letters, and spelling differences.

Features include:

- Manage 13 separate Writing Email prompts
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
