#!/usr/bin/env python3
"""
Builds compressed single-file (.json.gz) offline Bible packs for Daily Bible
and generates data/translations_catalog.json.

Bundled default offline translations:
  - kjv (English — King James Version)
  - zulu (isiZulu — IBhayibheli Elingcwele 1959)

All additional translations are packaged into packs/<id>.json.gz (excluded from .vsix)
so users can search, preview, and download them on demand for permanent offline use.
"""

import csv
import gzip
import io
import json
import os
import re
import subprocess
import sys
import urllib.request
import zipfile
import xml.etree.ElementTree as ET

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(ROOT, "data")
PACKS_DIR = os.path.join(ROOT, "packs")
BOOKS_JSON = os.path.join(DATA_DIR, "books.json")
CATALOG_JSON = os.path.join(DATA_DIR, "translations_catalog.json")

GITHUB_RAW_BASE = "https://raw.githubusercontent.com/SitholeWB/daily-bread-bible/main/packs"

# Curated selection of ~55 full 66-book redistributable translations across world languages
# Format: (pack_id, ebible_id, region, shortName, friendlyName, friendlyLanguage)
CURATED_EBIBLE = [
    # English alternatives
    ("engbsb", "engbsb", "English", "BSB", "Berean Standard Bible (BSB)", "English"),
    ("engmsb", "engmsb", "English", "MSB", "Majority Standard Bible (MSB)", "English"),
    ("eng-asv", "eng-asv", "English", "ASV", "American Standard Version (1901)", "English"),
    ("engBBE", "engBBE", "English", "BBE", "Bible in Basic English (BBE)", "English"),
    ("engDBY", "engDBY", "English", "DBY", "Darby Translation (1890)", "English"),
    ("engylt", "engylt", "English", "YLT", "Young's Literal Translation (YLT)", "English"),
    ("engDRA", "engDRA", "English", "DRA", "Douay-Rheims 1899 (Catholic Public Domain)", "English"),
    ("enggnv", "enggnv", "English", "GNV", "Geneva Bible (1599)", "English"),
    ("engwebster", "engwebster", "English", "WBT", "Webster Bible (1833)", "English"),

    # African Languages (alongside bundled isiZulu)
    ("swhonen", "swhonen", "Africa", "KCV", "Kiswahili Contemporary Version (Neno)", "Swahili (Kiswahili)"),
    ("swhulb", "swhulb", "Africa", "SWULB", "Swahili Unlocked Literal Bible", "Swahili (Kiswahili)"),
    ("sna", "sna", "Africa", "SHONA", "chiShona Bible (Biblica Open)", "Shona (chiShona)"),
    ("nya", "nya", "Africa", "CHICH", "Chichewa Bible (Biblica Open)", "Chichewa"),
    ("yor", "yor", "Africa", "YOR", "Yorùbá Bible (Biblica Open)", "Yorùbá"),
    ("hausa", "hausa", "Africa", "HAUSA", "Hausa Contemporary Bible (Biblica Open)", "Hausa"),
    ("twi", "twi", "Africa", "TWI-A", "Akuapem Twi Bible (Biblica Open)", "Twi (Akuapem)"),
    ("twiasante", "twiasante", "Africa", "TWI-AS", "Asante Twi Bible (Biblica Open)", "Twi (Asante)"),
    ("ewe", "ewe", "Africa", "EWE", "Éwé Bible (Biblica Open)", "Éwé"),
    ("luo", "luo", "Africa", "LUO", "Dholuo Bible (Biblica Open)", "Dholuo"),

    # Spanish
    ("spaRV1909", "spaRV1909", "Americas & Europe", "RV1909", "Reina-Valera 1909", "Spanish (Español)"),
    ("spabes", "spabes", "Americas & Europe", "SPABES", "La Biblia en Español Sencillo", "Spanish (Español)"),
    ("spablm", "spablm", "Americas & Europe", "SPABLM", "Spanish Free Bible for the World", "Spanish (Español)"),

    # Portuguese
    ("porbr2018", "porbr2018", "Americas & Europe", "BLIVRE", "Bíblia Livre (Português)", "Portuguese (Português)"),
    ("porbrbsl", "porbrbsl", "Americas & Europe", "WPB", "World Portuguese Bible", "Portuguese (Português)"),

    # French
    ("fraLSG", "fraLSG", "Europe & Africa", "LSG", "Louis Segond 1910", "French (Français)"),
    ("frajnd", "frajnd", "Europe & Africa", "DARBY-FR", "Bible J.N. Darby (Français)", "French (Français)"),
    ("frasbl", "frasbl", "Europe & Africa", "FRASBL", "French Free Holy Bible", "French (Français)"),

    # Chinese
    ("cmn-cu89s", "cmn-cu89s", "Asia", "CUV-S", "Chinese Union Version (Simplified 和合本)", "Chinese Simplified (简体中文)"),
    ("cmn-cu89t", "cmn-cu89t", "Asia", "CUV-T", "Chinese Union Version (Traditional 和合本)", "Chinese Traditional (繁體中文)"),
    ("cmncbs", "cmncbs", "Asia", "CCB-S", "Mandarin Contemporary Bible (Simplified)", "Chinese Simplified (简体中文)"),

    # German, Italian, Dutch, Polish, Russian, Ukrainian, Romanian, Czech, Serbian, Turkish
    ("deu1912", "deu1912", "Europe", "LUT1912", "Luther Bibel 1912", "German (Deutsch)"),
    ("deuelo", "deuelo", "Europe", "ELB1905", "Unrevidierte Elberfelder", "German (Deutsch)"),
    ("ita1927", "ita1927", "Europe", "RIV1927", "Bibbia Riveduta 1927", "Italian (Italiano)"),
    ("ita1885", "ita1885", "Europe", "DIO1885", "Bibbia Giovanni Diodati", "Italian (Italiano)"),
    ("nld", "nld", "Europe", "SV1917", "Dutch Statenvertaling (1917)", "Dutch (Nederlands)"),
    ("polubg", "polubg", "Europe", "UBG", "Uwspółcześniona Biblia Gdańska", "Polish (Polski)"),
    ("russyn", "russyn", "Europe & Asia", "SYNO", "Russian Synodal Bible (Синодальный)", "Russian (Русский)"),
    ("ukr1871", "ukr1871", "Europe", "UKR1871", "Ukrainian Kulish Bible (1871)", "Ukrainian (Українська)"),
    ("ukrfb", "ukrfb", "Europe", "UKRFB", "Ukrainian Freedom Bible", "Ukrainian (Українська)"),
    ("ces1613", "ces1613", "Europe", "BKR", "Bible Kralická 1613", "Czech (Čeština)"),
    ("ron1924", "ron1924", "Europe", "RON1924", "Romanian Bible (1924)", "Romanian (Română)"),
    ("srp1865", "srp1865", "Europe", "SRP-L", "Serbian DK Bible (Latin)", "Serbian (Srpski)"),
    ("srp1868", "srp1868", "Europe", "SRP-C", "Serbian DK Bible (Cyrillic)", "Serbian (Српски)"),
    ("turytc", "turytc", "Middle East & Europe", "TUR", "Turkish World English Bible", "Turkish (Türkçe)"),

    # South & Southeast & East Asia
    ("hincv", "hincv", "Asia", "HINCV", "Hindi Contemporary Version", "Hindi (हिन्दी)"),
    ("hin2017", "hin2017", "Asia", "HINIRV", "Hindi Indian Revised Version (2017)", "Hindi (हिन्दी)"),
    ("benobcv", "benobcv", "Asia", "BENCV", "Open Bengali Contemporary Version", "Bengali (বাংলা)"),
    ("tam2017", "tam2017", "Asia", "TAMIRV", "Tamil Indian Revised Version (2017)", "Tamil (தமிழ்)"),
    ("tel2017", "tel2017", "Asia", "TELIRV", "Telugu Indian Revised Version (2017)", "Telugu (తెలుగు)"),
    ("mal2015", "mal2015", "Asia", "MAL1910", "Malayalam Contemporary Orthography", "Malayalam (മലയാളം)"),
    ("mar", "mar", "Asia", "MARIRV", "Marathi Indian Revised Version", "Marathi (मराठी)"),
    ("npiulb", "npiulb", "Asia", "NEP", "Nepali Unlocked Literal Bible", "Nepali (नेपाली)"),
    ("urd", "urd", "Asia", "URDIRV", "Urdu Indian Revised Version", "Urdu (اردو)"),
    ("indayt", "indayt", "Asia", "IND-AYT", "Indonesian AYT Bible", "Indonesian (Bahasa Indonesia)"),
    ("tglulb", "tglulb", "Asia", "TGL", "Tagalog Unlocked Literal Bible", "Tagalog (Filipino)"),
    ("cebocb", "cebocb", "Asia", "CEB", "Cebuano Open Ang Pulong sa Dios", "Cebuano"),
    ("vie1934", "vie1934", "Asia", "VIE1934", "Vietnamese Bible (1923)", "Vietnamese (Tiếng Việt)"),
    ("thafb", "thafb", "Asia", "THAFB", "Thai Freedom Bible", "Thai (ไทย)"),
    ("kor", "kor", "Asia", "KOR1910", "Korean Bible (1910)", "Korean (한국어)"),
    ("jpnm", "jpnm", "Asia", "JPN", "Japanese Freedom Bible", "Japanese (日本語)"),
    ("myajvb", "myajvb", "Asia", "MYAJVB", "Judson Burmese Bible", "Burmese (မြန်မာ)"),

    # Middle East & Classical
    ("arb-vd", "arb-vd", "Middle East", "ARBV", "Arabic Van Dyck Bible", "Arabic (العربية)"),
    ("arbnav", "arbnav", "Middle East", "NAV", "New Arabic Version (Biblica Open)", "Arabic (العربية)"),
    ("heb", "heb", "Middle East", "HEB", "Modern Hebrew Bible", "Hebrew (עברית)"),
    ("pesOPV", "pesOPV", "Middle East", "PES", "Old Persian Version Bible", "Persian (فارسی)"),
    ("latVUC", "latVUC", "Classical", "VULG", "Clementine Vulgate (1598)", "Latin (Latine)"),
]


def load_books():
    with open(BOOKS_JSON, "r", encoding="utf-8") as f:
        books = json.load(f)
    code_to_id = {b["code"]: b["id"] for b in books}
    return books, code_to_id


def clean_text(t: str) -> str:
    return re.sub(r"\s+", " ", (t or "")).strip()


def pack_local_folder(tid: str) -> int:
    """Packs local data/translations/<tid>/1..66.json into packs/<tid>.json.gz"""
    src_dir = os.path.join(DATA_DIR, "translations", tid)
    if not os.path.isdir(src_dir):
        raise RuntimeError(f"Missing folder: {src_dir}")
    bundle = {}
    for book_id in range(1, 67):
        fp = os.path.join(src_dir, f"{book_id}.json")
        with open(fp, "r", encoding="utf-8") as f:
            bundle[str(book_id)] = json.load(f)
    out_path = os.path.join(PACKS_DIR, f"{tid}.json.gz")
    raw = json.dumps(bundle, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    with gzip.open(out_path, "wb", compresslevel=9) as gz:
        gz.write(raw)
    return os.path.getsize(out_path)


def fetch_ebible_csv():
    raw = subprocess.check_output(["curl", "-fsSL", "https://ebible.org/Scriptures/translations.csv"])
    text = raw.decode("utf-8-sig")
    return {r["translationId"]: r for r in csv.DictReader(io.StringIO(text))}


def parse_vpl_zip(zip_bytes: bytes, code_to_id: dict) -> dict:
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        xml_names = [n for n in zf.namelist() if n.endswith("_vpl.xml")]
        if not xml_names:
            raise RuntimeError("No _vpl.xml found in zip")
        xml_data = zf.read(xml_names[0])

    # Parse <v b="GEN" c="1" v="1">text</v>
    root = ET.fromstring(xml_data)
    books_dict = {str(i): [] for i in range(1, 67)}

    for elem in root.iter("v"):
        b_code = elem.attrib.get("b", "").strip()
        if b_code not in code_to_id:
            continue
        book_id = str(code_to_id[b_code])
        try:
            ch = int(elem.attrib.get("c", "0"))
            vs = int(elem.attrib.get("v", "0"))
        except ValueError:
            continue
        if ch < 1 or vs < 1:
            continue
        text = clean_text("".join(elem.itertext()))
        chapters = books_dict[book_id]
        while len(chapters) < ch:
            chapters.append([])
        chapter_arr = chapters[ch - 1]
        while len(chapter_arr) < vs:
            chapter_arr.append("")
        if chapter_arr[vs - 1]:
            chapter_arr[vs - 1] = f"{chapter_arr[vs - 1]} {text}".strip()
        else:
            chapter_arr[vs - 1] = text

    # Verify all 66 books have chapters
    missing = [bid for bid, chs in books_dict.items() if len(chs) == 0]
    if missing:
        raise RuntimeError(f"Missing books: {missing[:5]}")
    return books_dict


def main():
    os.makedirs(PACKS_DIR, exist_ok=True)
    _, code_to_id = load_books()
    csv_map = fetch_ebible_csv()

    catalog = [
        {
            "id": "kjv",
            "languageCode": "en",
            "language": "English",
            "name": "King James Version (KJV)",
            "shortName": "KJV",
            "direction": "ltr",
            "copyright": "Public Domain (1769 Oxford Standard)",
            "bundled": True,
            "sizeKB": 4200,
            "region": "Default Offline",
        },
        {
            "id": "zulu",
            "languageCode": "zu",
            "language": "isiZulu",
            "name": "IBhayibheli Elingcwele (1959)",
            "shortName": "ZULU",
            "direction": "ltr",
            "copyright": "Public Domain (1959 Edition)",
            "bundled": True,
            "sizeKB": 3800,
            "region": "Default Offline",
        },
    ]

    # Convert local 'web' into packs/web.json.gz if present in data/translations/web
    web_pack = os.path.join(PACKS_DIR, "web.json.gz")
    if os.path.isdir(os.path.join(DATA_DIR, "translations", "web")):
        web_bytes = pack_local_folder("web")
    elif os.path.isfile(web_pack):
        web_bytes = os.path.getsize(web_pack)
    else:
        raise RuntimeError("Neither data/translations/web nor packs/web.json.gz found!")

    catalog.append(
        {
            "id": "web",
            "languageCode": "en",
            "language": "English",
            "name": "World English Bible (WEB)",
            "shortName": "WEB",
            "direction": "ltr",
            "copyright": "Public Domain",
            "bundled": False,
            "sizeKB": max(1, round(web_bytes / 1024)),
            "region": "English",
            "downloadUrl": f"{GITHUB_RAW_BASE}/web.json.gz",
        }
    )
    print(f"[OK] web -> {round(web_bytes/1024)} KB")

    for pack_id, ebible_id, region, short_name, friendly_name, friendly_lang in CURATED_EBIBLE:
        out_path = os.path.join(PACKS_DIR, f"{pack_id}.json.gz")
        meta = csv_map.get(ebible_id, {})
        copyright_text = meta.get("Copyright") or "Public Domain / Open Access"
        direction = meta.get("textDirection") or "ltr"
        lang_code = meta.get("languageCode") or pack_id[:3]

        if os.path.isfile(out_path) and os.path.getsize(out_path) > 100000:
            sz = os.path.getsize(out_path)
            print(f"[CACHED] {pack_id} -> {round(sz/1024)} KB")
        else:
            url = f"https://ebible.org/Scriptures/{ebible_id}_vpl.zip"
            try:
                zip_bytes = subprocess.check_output(["curl", "-fsSL", url], timeout=45)
                bundle = parse_vpl_zip(zip_bytes, code_to_id)
                raw = json.dumps(bundle, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
                with gzip.open(out_path, "wb", compresslevel=9) as gz:
                    gz.write(raw)
                sz = os.path.getsize(out_path)
                print(f"[OK] {pack_id} ({friendly_lang}) -> {round(sz/1024)} KB")
            except Exception as e:
                print(f"[SKIP] {pack_id}: {e}", file=sys.stderr)
                continue

        catalog.append(
            {
                "id": pack_id,
                "languageCode": lang_code,
                "language": friendly_lang,
                "name": friendly_name,
                "shortName": short_name,
                "direction": direction,
                "copyright": copyright_text,
                "bundled": False,
                "sizeKB": max(1, round(sz / 1024)),
                "region": region,
                "downloadUrl": f"{GITHUB_RAW_BASE}/{pack_id}.json.gz",
            }
        )

    with open(CATALOG_JSON, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {len(catalog)} translations to {CATALOG_JSON}")


if __name__ == "__main__":
    main()
