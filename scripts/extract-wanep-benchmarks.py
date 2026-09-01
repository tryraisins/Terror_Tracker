from __future__ import annotations

import hashlib
import json
from pathlib import Path

import fitz
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
PDF_ROOT = ROOT / "tmp" / "pdfs"
RUN_ROOT = ROOT / "audit-2026" / "rerun-2026-08-30-genuine"
OUT_ROOT = RUN_ROOT / "wanep-benchmarks"

REPORTS = [
    ("2026-05-01/2026-05-15", "wanep-may-01-15.pdf", "https://wanepnigeria.org/wp-content/uploads/2026/05/Nigeria-Situation-Report-%E2%80%93-May-1-15-2026.pdf"),
    ("2026-05-16/2026-05-31", "wanep-may-16-31.pdf", "https://wanepnigeria.org/wp-content/uploads/2026/06/Nigeria-Situation-Report-%E2%80%93-May-16%E2%80%9331-2026.pdf"),
    ("2026-06-01/2026-06-15", "wanep-jun-01-15.pdf", "https://wanepnigeria.org/wp-content/uploads/2026/07/Nigeria-Situation-Report-%E2%80%93-JUNE-1-15-2026-2.pdf"),
    ("2026-06-16/2026-06-30", "wanep-jun-16-30.pdf", "https://wanepnigeria.org/wp-content/uploads/2026/07/Nigeria-Situation-Report-%E2%80%93-June-16%E2%80%9330-2026-1.pdf"),
    ("2026-07-01/2026-07-15", "wanep-jul-01-15.pdf", "https://wanepnigeria.org/wp-content/uploads/2026/07/Nigeria-Situation-Report-%E2%80%93-JULY-1-15-2026.pdf"),
    ("2026-07-16/2026-07-31", "wanep-jul-16-31.pdf", "https://wanepnigeria.org/wp-content/uploads/2026/08/Nigeria-Situation-Report-%E2%80%93-July-16-31-2026.pdf"),
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    manifest = []
    for period, filename, source_url in REPORTS:
        pdf_path = PDF_ROOT / filename
        reader = PdfReader(str(pdf_path))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        text_path = OUT_ROOT / f"{pdf_path.stem}.txt"
        text_path.write_text(text, encoding="utf-8")

        document = fitz.open(pdf_path)
        images = []
        for index, page in enumerate(document):
            pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            image_path = OUT_ROOT / f"{pdf_path.stem}-page-{index + 1}.png"
            pixmap.save(image_path)
            images.append(str(image_path.relative_to(RUN_ROOT)).replace("\\", "/"))
        document.close()

        manifest.append({
            "period": period,
            "sourceUrl": source_url,
            "downloadedPdf": str(pdf_path.relative_to(ROOT)).replace("\\", "/"),
            "sha256": sha256(pdf_path),
            "pages": len(reader.pages),
            "extractedCharacters": len(text),
            "extractedText": str(text_path.relative_to(RUN_ROOT)).replace("\\", "/"),
            "renderedPages": images,
        })

    manifest_path = OUT_ROOT / "manifest.json"
    manifest_path.write_text(json.dumps({"reports": manifest}, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"manifest": str(manifest_path), "reports": len(manifest)}, indent=2))


if __name__ == "__main__":
    main()
