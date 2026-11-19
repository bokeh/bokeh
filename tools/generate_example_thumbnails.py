''' Generate small index thumbnails from an existing documentation build. '''
from __future__ import annotations

import argparse
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote

from PIL import Image, ImageOps

from bokeh.embed import EmbedResult
from bokeh.io.export import get_screenshot_as_png_from_html
from bokeh.io.util import _ExportResources

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / 'docs/bokeh/source/_images/examples'


class ExamplePayload(HTMLParser):
    def __init__(self, anchor: str = "") -> None:
        super().__init__()
        self.anchor = anchor
        self.at_example = not anchor
        self.filename: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if attributes.get('id') == self.anchor:
            self.at_example = True
        if self.at_example and tag == 'div' and self.filename is None:
            self.filename = attributes.get('data-bokeh-payload-url')


def example_pages(build_dir: Path) -> dict[Path, tuple[Path, str]]:
    from sphinx.util.inventory import InventoryFile

    from bokeh.sphinxext._internal.bokeh_example_metadata import read_example_metadata

    html = build_dir / 'html'
    dedicated = html / 'docs/examples'
    pages = {
        page.relative_to(dedicated).with_suffix(''): (page, '')
        for page in sorted(dedicated.rglob('*.html'))
        if (ROOT / 'examples' / page.relative_to(dedicated).with_suffix('.py')).is_file()
    }
    inventory = html / 'objects.inv'
    sources = build_dir / 'doctrees/bokeh_example_inventory.json'
    if inventory.is_file() and sources.is_file():
        labels = InventoryFile.loads(inventory.read_bytes(), uri='').data['std:label']
        for name in json.loads(sources.read_text(encoding='utf-8'))['sources']:
            relative = Path(name)
            if relative.suffix != '.py':
                continue
            _, metadata = read_example_metadata(ROOT / 'examples' / relative)
            reference = metadata.get('example-ref')
            if reference and (label := labels.get(reference.lower())):
                filename, _, anchor = label.uri.partition('#')
                pages.setdefault(relative.with_suffix(''), (html / unquote(filename), unquote(anchor)))
    return pages


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('examples', nargs='*', help='Example paths relative to examples/, optionally ending in .py')
    parser.add_argument('--build-dir', type=Path, default=ROOT / 'docs/bokeh/build')
    parser.add_argument('--overwrite', action='store_true', help='Refresh existing thumbnails')
    args = parser.parse_args(argv)
    html = args.build_dir / 'html/docs/examples'
    if not html.is_dir():
        parser.error('Build the HTML documentation before generating thumbnails')
    selected = {Path(value).with_suffix('') for value in args.examples}
    generated = 0
    failures = []
    for relative, (page, anchor) in sorted(example_pages(args.build_dir).items()):
        if selected and relative not in selected:
            continue
        target = IMAGES / '_index' / relative.with_suffix('.png')
        if target.exists() and not args.overwrite:
            continue
        payload = ExamplePayload(anchor)
        payload.feed(page.read_text(encoding='utf-8'))
        if payload.filename is None:
            continue
        try:
            gallery = IMAGES / relative.with_suffix('.png')
            if gallery.is_file():
                with Image.open(gallery) as image:
                    thumbnail = image.convert('RGB')
            else:
                result = EmbedResult.from_json((page.parent / payload.filename).read_text(encoding='utf-8'))
                rendered = get_screenshot_as_png_from_html(result.page(resources=_ExportResources(mode="cdn")), timeout=15)
                thumbnail = Image.new('RGB', rendered.size, 'white')
                thumbnail.paste(rendered, mask=rendered.getchannel('A'))
            thumbnail = ImageOps.contain(thumbnail, (120, 120), Image.Resampling.LANCZOS)
            target.parent.mkdir(parents=True, exist_ok=True)
            thumbnail.save(target, optimize=True)
            generated += 1
            print(f'{relative}: {thumbnail.width}x{thumbnail.height}', flush=True)
        except Exception as error:
            failures.append(relative)
            print(f'{relative}: {type(error).__name__}: {error}', flush=True)
    print(f'Generated {generated} thumbnails, {len(failures)} failures')
    return bool(failures)


if __name__ == '__main__':
    raise SystemExit(main())
