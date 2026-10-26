#!/usr/bin/env python3
"""Add reader-friendly PDF bookmarks to the published R1.2 engineering drawing set.

This changes the PDF outline only. All 14 drawing pages retain their original
visual appearance. Source: Heating Rate Controller R1.2 PDF.
"""
from pathlib import Path
import os
import tempfile

import fitz

ROOT = Path(__file__).resolve().parent
PDF = ROOT / "Heating_Rate_Controller_R1_2_Electrical_Drawings.pdf"

OUTLINE = [
    [1, "Terminal arrangements", 1],
    [2, "01 - Distribution capacity and block selection", 1],
    [2, "02 - Terminal assignments: mains and common DC", 2],
    [2, "03 - Terminal assignments: both channels", 3],
    [1, "Mains and control power", 4],
    [2, "04 - Mains supply and AC distribution", 4],
    [2, "05 - Shared 24 V supply and channel interlocks", 5],
    [1, "Heater enable and demand", 6],
    [2, "06 - Channel 1: EAO ENABLE and Finder control", 6],
    [2, "07 - Channel 2: EAO ENABLE and Finder control", 7],
    [2, "08 - Channel 1: SSR drive and ACTIVE indicator", 8],
    [2, "09 - Channel 2: SSR drive and ACTIVE indicator", 9],
    [1, "External DC heater power", 10],
    [2, "10 - Channel 1: complete DC heater loop", 10],
    [2, "11 - Channel 2: complete DC heater loop", 11],
    [1, "Connection schedules", 12],
    [2, "12 - Mains and 24 V connections", 12],
    [2, "13 - Controls and heater connections", 13],
    [1, "Components and maintenance", 14],
    [2, "14 - Component references and maintenance", 14],
]


def main() -> None:
    with fitz.open(PDF) as original:
        if len(original) != 14:
            raise RuntimeError(f"Expected 14 pages; found {len(original)}")
        if original.get_toc() == OUTLINE:
            print("R1.2 PDF already has the correct 20 bookmark entries.")
            return

        # Capture original text and low-res renders before editing the outline.
        original_text = [page.get_text() for page in original]
        original_renders = [
            page.get_pixmap(matrix=fitz.Matrix(0.6, 0.6), alpha=False).samples
            for page in original
        ]
        original.set_toc(OUTLINE)
        meta = dict(original.metadata or {})
        meta.update(
            title="Heating Rate Controller - R1.2 Electrical Drawings",
            subject="14-sheet electrical reference with named, navigable PDF bookmarks",
        )
        original.set_metadata(meta)
        fd, temp_path = tempfile.mkstemp(prefix="r12_toc_", suffix=".pdf", dir=ROOT)
        os.close(fd)
        try:
            original.save(temp_path, garbage=3, deflate=True)
            with fitz.open(temp_path) as final:
                assert len(final) == 14
                assert final.get_toc() == OUTLINE
                assert [p.get_text() for p in final] == original_text
                for i, page in enumerate(final):
                    actual = page.get_pixmap(
                        matrix=fitz.Matrix(0.6, 0.6), alpha=False
                    ).samples
                    if actual != original_renders[i]:
                        raise RuntimeError(f"Drawing sheet {i + 1} changed visually")
            os.replace(temp_path, PDF)
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    print("Updated R1.2 PDF bookmarks: 6 groups and 14 sheet titles; visuals unchanged.")


if __name__ == "__main__":
    main()
