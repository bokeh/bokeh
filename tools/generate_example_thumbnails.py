''' Generate small index thumbnails from documentation, apps, or notebooks. '''
from __future__ import annotations

import argparse
import json
import sys
import time
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote

from PIL import Image, ImageOps

from bokeh.embed import EmbedResult, embed
from bokeh.io.export import get_screenshot_as_png, get_screenshot_as_png_from_html
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


def server_thumbnail(path: Path) -> Image.Image:
    from bokeh.command.util import build_single_handler_application

    application = build_single_handler_application(str(path.parent if path.name == 'main.py' else path))
    document = application.create_document()
    if not document.roots:
        raise ValueError('The application did not create any document roots')
    result = embed(document, callback_policy='suppress')
    html = result.page(resources=_ExportResources(mode='cdn'), template=document.template,
                       template_variables=document.template_variables)
    return get_screenshot_as_png_from_html(html, timeout=25)


def server_url_thumbnail(url: str, wait: float) -> Image.Image:
    from bokeh.client import pull_session

    session = pull_session(url=url)
    try:
        deadline = time.monotonic() + wait
        while time.monotonic() < deadline:
            session.force_roundtrip()
            time.sleep(0.1)
        assert session.document is not None
        return get_screenshot_as_png(session.document, timeout=25)
    finally:
        session.close()


def notebook_thumbnail(path: Path) -> Image.Image:
    import nbformat
    from jupyter_client.manager import KernelManager
    from nbclient import NotebookClient

    from bokeh.io.jupyter_export import _artifact_payload

    notebook = nbformat.read(path, as_version=4)  # type: ignore[no-untyped-call]
    manager = KernelManager(kernel_name='python3')
    assert manager.kernel_spec is not None
    manager.kernel_spec.argv = [sys.executable, '-m', 'ipykernel_launcher', '-f', '{connection_file}']
    client = NotebookClient(notebook, km=manager, timeout=45,
                            resources={'metadata': {'path': str(path.parent)}})
    with client.setup_kernel(cwd=str(path.parent)):
        for index, cell in enumerate(list(notebook.cells)):
            if cell.cell_type != 'code':
                continue
            client.execute_cell(cell, index)
            for output in cell.get('outputs', []):
                html = output.get('data', {}).get('text/html', '')
                if isinstance(html, list):
                    html = ''.join(html)
                payload = _artifact_payload(html)
                if payload:
                    artifact = EmbedResult.from_json(payload)
                    return get_screenshot_as_png_from_html(
                        artifact.page(resources=_ExportResources(mode='cdn')), timeout=25,
                    )

            # Server notebook outputs contain a connection, so capture the app's initial document.
            if cell.get('outputs'):
                probe = nbformat.v4.new_code_cell(  # type: ignore[no-untyped-call]
                    "import json\nfrom bokeh.io.jupyter_app import NotebookApplication\nfrom bokeh.embed import embed\n"
                    "print(json.dumps([embed(value.asgi.core.applications['/'].application.create_document(), "
                    "callback_policy='suppress').to_json_string() for value in list(globals().values()) "
                    "if isinstance(value, NotebookApplication) and not value.stopped]))",
                )
                notebook.cells.append(probe)
                try:
                    client.execute_cell(probe, len(notebook.cells) - 1)
                finally:
                    notebook.cells.pop()
                artifacts = json.loads(''.join(output.get('text', '') for output in probe.outputs
                                              if output.get('name') == 'stdout'))
                if artifacts:
                    artifact = EmbedResult.from_json(artifacts[0])
                    return get_screenshot_as_png_from_html(
                        artifact.page(resources=_ExportResources(mode='cdn')), timeout=25,
                    )
    raise ValueError('The notebook did not produce a capturable Bokeh output')


def save_thumbnail(image: Image.Image, target: Path) -> None:
    thumbnail = ImageOps.contain(image, (120, 120), Image.Resampling.LANCZOS)
    flattened = Image.new('RGB', thumbnail.size, 'white')
    flattened.paste(thumbnail, mask=thumbnail.getchannel('A') if thumbnail.mode == 'RGBA' else None)
    target.parent.mkdir(parents=True, exist_ok=True)
    flattened.save(target, optimize=True)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('examples', nargs='*', help='Example paths relative to examples/, optionally ending in .py')
    parser.add_argument('--build-dir', type=Path, default=ROOT / 'docs/bokeh/build')
    parser.add_argument('--wait', type=float, default=0, help='Seconds to collect live app updates before capture')
    parser.add_argument('--overwrite', action='store_true', help='Refresh existing thumbnails')
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--server', action='store_true', help='Capture an initial Bokeh application document')
    mode.add_argument('--server-url', help='Capture a running Bokeh app, including its session initialization')
    mode.add_argument('--notebook', action='store_true', help='Execute a notebook copy up to its first Bokeh output')
    args = parser.parse_args(argv)
    html = args.build_dir / 'html/docs/examples'
    if not (args.server or args.server_url or args.notebook) and not html.is_dir():
        parser.error('Build the HTML documentation before generating thumbnails')
    if (args.server or args.server_url or args.notebook) and not args.examples:
        parser.error('Explicit example paths are required for server and notebook captures')
    selected = {Path(value).with_suffix('') for value in args.examples}
    pages = {Path(value).with_suffix(''): (ROOT / 'examples' / value, '') for value in args.examples} \
        if args.server or args.server_url or args.notebook else example_pages(args.build_dir)
    generated = 0
    failures = []
    for relative, (page, anchor) in sorted(pages.items()):
        if selected and relative not in selected:
            continue
        target = IMAGES / '_index' / relative.with_suffix('.png')
        if target.exists() and not args.overwrite:
            continue
        try:
            if args.server:
                thumbnail = server_thumbnail(page)
            elif args.server_url:
                thumbnail = server_url_thumbnail(args.server_url, args.wait)
            elif args.notebook:
                thumbnail = notebook_thumbnail(page)
            else:
                payload = ExamplePayload(anchor)
                payload.feed(page.read_text(encoding='utf-8'))
                if payload.filename is None:
                    continue
                gallery = IMAGES / relative.with_suffix('.png')
                if gallery.is_file():
                    with Image.open(gallery) as image:
                        thumbnail = image.copy()
                else:
                    result = EmbedResult.from_json((page.parent / payload.filename).read_text(encoding='utf-8'))
                    thumbnail = get_screenshot_as_png_from_html(
                        result.page(resources=_ExportResources(mode='cdn')), timeout=15,
                    )
            save_thumbnail(thumbnail, target)
            generated += 1
            print(f'{relative}: {target.relative_to(IMAGES)}', flush=True)
        except Exception as error:
            failures.append(relative)
            print(f'{relative}: {type(error).__name__}: {error}', flush=True)
    print(f'Generated {generated} thumbnails, {len(failures)} failures')
    return bool(failures)


if __name__ == '__main__':
    raise SystemExit(main())
