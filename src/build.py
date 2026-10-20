#!/usr/bin/env python3
"""Build PDF Werkstatt v0.1.4 from bundled local sources.

python3 src/build.py           -> index.html (fully offline)
python3 src/build.py --online  -> PDF-Werkstatt-online.html (basic libraries use CDNs)

Requires Python 3 only; no additional packages are needed.
"""
import argparse
import base64
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
JS_FILES = sorted((ROOT / 'js').glob('*.js'))
LIBRARIES = {
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js': 'pdf.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js': 'pdf.worker.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js': 'pdf-lib.min.js',
    'https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js': 'fontkit.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js': 'jszip.min.js',
}


def encode_file(path: Path) -> str:
    return base64.b64encode(path.read_bytes()).decode('ascii')


def build(online: bool = False) -> Path:
    template = (ROOT / 'template.html').read_text(encoding='utf-8')
    icons = (ROOT / 'icons.json').read_text(encoding='utf-8')
    font_dir = ROOT / 'fonts'
    fonts = {
        'reg': encode_file(font_dir / 'inter-Regular.ttf'),
        'semi': encode_file(font_dir / 'inter-SemiBold.ttf'),
        'script': encode_file(font_dir / 'DancingScript.ttf'),
    }
    font_metadata = json.loads((ROOT / 'fonts.json').read_text(encoding='utf-8'))
    for family in font_metadata:
        for style, filename in list(family['variants'].items()):
            if not filename:
                del family['variants'][style]
                continue
            key = ('reg' if filename == 'inter-Regular.ttf' else
                   'semi' if filename == 'inter-SemiBold.ttf' else
                   'script' if filename == 'DancingScript.ttf' else
                   family['id'] + '.' + style)
            if key not in fonts:
                fonts[key] = encode_file(font_dir / filename)
            family['variants'][style] = key

    # Embed PDF engines and OCR workers/models, also in the CDN variant.
    vendor = ROOT / 'vendor'
    asset_names = [
        'mupdf/mupdf.js', 'mupdf/mupdf-wasm.js', 'mupdf/mupdf-wasm.wasm',
        'ocr/worker.min.js', 'ocr/tesseract-core-lstm.wasm.js',
        *['ocr/' + path.name for path in sorted((vendor / 'ocr').glob('*.traineddata.gz'))],
    ]
    assets = {name: encode_file(vendor / name) for name in asset_names}
    application = ''.join(path.read_text(encoding='utf-8') for path in JS_FILES)
    html = (template.replace('/*__ICONS__*/{}', icons)
                    .replace('/*__FONTS__*/{}', json.dumps(fonts))
                    .replace('/*__FONT_META__*/[]', json.dumps(font_metadata, ensure_ascii=True))
                    .replace('/*__ASSETS__*/{}', json.dumps(assets))
                    .replace('/*__APP__*/', application))
    ocr_code = (vendor / 'ocr/tesseract.min.js').read_text(encoding='utf-8').replace('</script', '<\\/script')
    html = html.replace('<script>\nconst ICONS', '<script>\n' + ocr_code + '\n</script>\n<script>\nconst ICONS')
    if not online:
        for url, filename in LIBRARIES.items():
            code = (vendor / filename).read_text(encoding='utf-8').replace('</script', '<\\/script')
            tag = f'<script src="{url}"></script>'
            if tag not in html:
                raise SystemExit(f'Missing library tag in template: {tag}')
            html = html.replace(tag, f'<script>/* {filename}: see licenses/ for license details. */\n{code}\n</script>')
    output = ROOT.parent / ('PDF-Werkstatt-online.html' if online else 'index.html')
    output.write_text(html, encoding='utf-8')
    return output


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--online', action='store_true', help='Load basic PDF/ZIP libraries from CDNs.')
    args = parser.parse_args()
    output = build(args.online)
    print(f'Built: {output} ({output.stat().st_size / 1024 / 1024:.1f} MiB)')
