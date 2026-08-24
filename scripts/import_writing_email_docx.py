from __future__ import annotations

import argparse
import json
import re
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET


NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Import a Writing Email DOCX into the local editable library JSON."
    )
    parser.add_argument("docx_path", type=Path)
    parser.add_argument("project_dir", type=Path)
    args = parser.parse_args()

    docx_path = args.docx_path.resolve()
    project_dir = args.project_dir.resolve()
    data_dir = project_dir / "data"
    image_dir = data_dir / "images"
    image_dir.mkdir(parents=True, exist_ok=True)

    entries, image_bytes_by_target = parse_docx(docx_path)

    exported_entries = []
    for index, entry in enumerate(entries, start=1):
        entry_id = f"email-{index:02d}"
        image_target = entry["image_target"]
        image_bytes = image_bytes_by_target[image_target]
        suffix = Path(image_target).suffix.lower() or ".png"
        output_name = f"{entry_id}{suffix}"
        output_path = image_dir / output_name
        output_path.write_bytes(image_bytes)

        exported_entries.append(
            {
                "id": entry_id,
                "title": f"Email {index:02d}",
                "notes": "",
                "promptImage": f"data/images/{output_name}",
                "sampleText": normalize_text(entry["sample_text"]),
            }
        )

    library = {
        "version": 1,
        "sourceFile": docx_path.name,
        "entryCount": len(exported_entries),
        "entries": exported_entries,
    }

    (data_dir / "email-library.json").write_text(
        json.dumps(library, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (data_dir / "email-library.js").write_text(
        "window.PTE_EMAIL_LIBRARY = "
        + json.dumps(library, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )

    print(
        json.dumps(
            {
                "docx": str(docx_path),
                "project_dir": str(project_dir),
                "entry_count": len(exported_entries),
                "output_json": str(data_dir / "email-library.json"),
            },
            ensure_ascii=False,
        )
    )


def parse_docx(docx_path: Path) -> tuple[list[dict[str, str]], dict[str, bytes]]:
    with zipfile.ZipFile(docx_path) as archive:
        relationships = read_relationships(archive)
        document_root = ET.fromstring(archive.read("word/document.xml"))
        body = document_root.find("w:body", NS)
        if body is None:
            raise ValueError("DOCX body not found")

        image_bytes_by_target: dict[str, bytes] = {}
        entries: list[dict[str, str]] = []
        current_entry: dict[str, object] | None = None

        for paragraph in body.findall("w:p", NS):
            paragraph_buffer: list[str] = []

            for run in paragraph.findall("w:r", NS):
                for item_type, value in iter_run_items(run, relationships):
                    if item_type == "image":
                        if current_entry is not None:
                            if paragraph_buffer:
                                current_entry["parts"].append("".join(paragraph_buffer))
                            flush_entry(entries, current_entry)

                        current_entry = {
                            "image_target": value,
                            "parts": [],
                        }

                        image_path_in_zip = f"word/{value}"
                        image_bytes_by_target[value] = archive.read(image_path_in_zip)
                        paragraph_buffer = []
                        continue

                    if current_entry is None:
                        continue

                    if item_type == "break":
                        if paragraph_buffer and paragraph_buffer[-1] != "\n":
                            paragraph_buffer.append("\n")
                        continue

                    if item_type == "text":
                        paragraph_buffer.append(value)
                        continue

                    if item_type == "tab":
                        paragraph_buffer.append(" ")

            if current_entry is not None and paragraph_buffer:
                current_entry["parts"].append("".join(paragraph_buffer))

        if current_entry is not None:
            flush_entry(entries, current_entry)

        return entries, image_bytes_by_target


def read_relationships(archive: zipfile.ZipFile) -> dict[str, str]:
    rels_root = ET.fromstring(archive.read("word/_rels/document.xml.rels"))
    relationships: dict[str, str] = {}

    for relation in rels_root:
        relation_id = relation.attrib.get("Id")
        target = relation.attrib.get("Target")
        if relation_id and target:
            relationships[relation_id] = target

    return relationships


def iter_run_items(run: ET.Element, relationships: dict[str, str]):
    for child in run:
        tag_name = child.tag.split("}")[-1]

        if tag_name == "drawing":
            for blip in child.findall(".//a:blip", NS):
                relation_id = blip.attrib.get(f"{{{NS['r']}}}embed")
                target = relationships.get(relation_id)
                if target:
                    yield "image", target
            continue

        if tag_name in {"br", "cr"}:
            yield "break", "\n"
            continue

        if tag_name == "tab":
            yield "tab", " "
            continue

        if tag_name == "t":
            yield "text", child.text or ""


def flush_entry(entries: list[dict[str, str]], current_entry: dict[str, object]) -> None:
    sample_text = "\n".join(str(part) for part in current_entry["parts"] if str(part).strip())
    entries.append(
        {
            "image_target": str(current_entry["image_target"]),
            "sample_text": sample_text,
        }
    )


def normalize_text(text: str) -> str:
    cleaned = text.replace("\u00a0", " ").replace("\u200b", "")
    cleaned = cleaned.replace("’", "'").replace("“", '"').replace("”", '"')
    cleaned = re.sub(r"[ \t]+\n", "\n", cleaned)
    cleaned = re.sub(r"\n[ \t]+", "\n", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    cleaned = re.sub(r"[ \t]{2,}", " ", cleaned)
    return cleaned.strip()


if __name__ == "__main__":
    main()
