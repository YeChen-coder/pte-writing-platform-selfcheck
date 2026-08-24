# Deployment and Usage

This project is a dependency-free static web app. It does not require Node.js, Python, a database, or an environment file to run.

## Run locally

Open `index.html` in a modern browser, or double-click the desktop launcher created for this project.

For a local HTTP server, run from the project directory:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish with GitHub Pages

1. Push the project to GitHub.
2. Open the repository's `Settings` page.
3. Open `Pages` under `Code and automation`.
4. Set the source to `Deploy from a branch`.
5. Select the default branch and the `/ (root)` folder.
6. Save and open the generated Pages URL.

The app uses relative paths for its local data and images, so it works from the repository root and from a GitHub Pages project URL.

## Local data and editing

- `data/email-library.json` is the editable text version of the imported question bank.
- `data/images/` contains the prompt images used by the app.
- `data/email-library.js` is the browser-loadable seed copy used when opening `index.html` directly.
- The browser stores working edits and typed answers in local storage.
- Use the app's `导出题库 JSON` action to create a backup of edited question data.

## Re-import the Word source

The original Word file is intentionally ignored by Git. If it is present locally, re-import it with:

```powershell
$py = "C:\Users\yeche\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
& $py ".\scripts\import_writing_email_docx.py" ".\Writing Email_Cleaned.docx" "."
```

After re-importing, commit the updated files under `data/`.
