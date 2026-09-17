# PTE Writing Email Self-Check Platform

[Chinese version](README_zh.md)

This local web platform was built for PTE Core Writing Email practice.

One important note: the example answer shown in the interface is not included here and is absolutely not intended as something to memorize. It was generated entirely by AI and exists only to show where users should paste an answer they prepared themselves.

I should also say upfront that, even after building this tool, I do not think it is especially important for exam preparation. Under exam pressure, it is easy to forget a sentence, but forgetting the exact wording of a Writing Email template does not matter very much; you can still produce the required word count. Avoiding typos and using correct grammar matter far more. Whether the answer is beautifully written or closely follows a sample is less critical.

I am publishing the platform because I already built it. Perhaps other people can adapt it to a more useful purpose. If you need different behavior, ask your own Codex or Claude Code to customize it.

This is the main interface:

<img width="1085" height="725" alt="PTE Writing Email practice interface" src="https://github.com/user-attachments/assets/f6284509-472c-473b-b2d7-10154f1503ec" />

The design is based on mistakes I make frequently. I often omit small but important words through carelessness—prepositions, or words such as *the*, *a*, and *and*. While typing, the answer can look completely correct even when several words are missing. The comparison view makes those omissions visible immediately.

<img width="280" height="693" alt="Word-by-word typo and omission comparison" src="https://github.com/user-attachments/assets/c140396b-9efe-45c1-b611-62ea31774fef" />

To make practice convenient and reduce repeated work:

1. After pasting your own sample answer, you can save it locally instead of pasting it again for every practice session.
2. The question bank contains 13 prompts. Each prompt is kept separate and can be saved independently.
3. You can revise any sample answer at any time. Select **Edit Sample**, replace the text, save it, and begin practicing immediately. `DEPLOYMENT.md` documents JSON import and export for the entire question bank, but in actual use I find direct editing on the page much more convenient. Exam preparation is already enough work; there is no reason to create extra friction by managing JSON manually.

The platform provides two practice modes:

- **Reference-visible mode:** Displays your own sample answer while you type it. This helps catch unnoticed omissions such as *the* and *and*, as well as spelling mistakes that may have become habitual.
- **Memorization mode:** Hides the reference answer for recall practice.

You can switch freely between the two modes.

<img width="469" height="172" alt="Reference-visible and memorization mode selector" src="https://github.com/user-attachments/assets/5a4b927b-d67b-4a9f-a426-24f5764ee2f6" />

## Features

- Manage 13 separate Writing Email prompts.
- Display prompt images and edit sample answers.
- Practice with the sample answer visible or hidden.
- Compare the typed answer with the reference answer word by word.
- Detect matching words, replacements or spelling errors, missing words, and extra words.
- Store question-bank edits and practice answers locally in the browser.
- Import and export the question bank as JSON.

## Run Locally

This is a dependency-free static web app. It does not require Node.js, a database, or environment variables.

Open `index.html` directly, or double-click the desktop launcher.

To use a local HTTP server, run this command from the project directory:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Project Files

- `index.html`: Page structure
- `app.js`: Question-bank management, practice interactions, and word-by-word comparison
- `styles.css`: Page styling
- `data/email-library.json`: Editable question-bank text data
- `data/email-library.js`: Browser-loadable seed data used when opening the page directly
- `data/images/`: The 13 prompt images
- `scripts/import_writing_email_docx.py`: Re-imports the question bank from a Word document
- `DEPLOYMENT.md`: Detailed local-running and GitHub Pages deployment instructions

## Re-import the Word Question Bank

The original Word document is intentionally excluded from Git. If `Writing Email_Cleaned.docx` exists locally, run:

```powershell
$py = "C:\Users\yeche\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
& $py ".\scripts\import_writing_email_docx.py" ".\Writing Email_Cleaned.docx" "."
```
