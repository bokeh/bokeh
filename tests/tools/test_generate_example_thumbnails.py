from __future__ import annotations

from pathlib import Path

from PIL import Image

from tools import generate_example_thumbnails as thumbnails


def test_reuses_gallery_image_without_loading_payload(tmp_path: Path, monkeypatch) -> None:
    images = tmp_path / 'images'
    images.mkdir()
    Image.new('RGB', (300, 150), 'blue').save(images / 'example.png')
    (tmp_path / 'examples').mkdir()
    (tmp_path / 'examples/example.py').write_text('raise RuntimeError("Do not execute examples")')
    pages = tmp_path / 'build/html/docs/examples'
    pages.mkdir(parents=True)
    (pages / 'example.html').write_text('<div data-bokeh-payload-url="missing.json"></div>')
    monkeypatch.setattr(thumbnails, 'ROOT', tmp_path)
    monkeypatch.setattr(thumbnails, 'IMAGES', images)

    assert thumbnails.main(['--build-dir', str(tmp_path / 'build')]) == 0
    target = images / '_index/example.png'
    with Image.open(target) as image:
        assert image.size == (120, 60)
    before = target.stat().st_mtime_ns
    assert thumbnails.main(['--build-dir', str(tmp_path / 'build')]) == 0
    assert target.stat().st_mtime_ns == before


def test_inline_payload_starts_at_reference_target() -> None:
    payload = thumbnails.ExamplePayload('styled-sliders')
    payload.feed('''<div data-bokeh-payload-url="unrelated.json"></div>
        <span id="styled-sliders"></span>
        <div data-bokeh-payload-url="sliders.json"></div>
        <div data-bokeh-payload-url="another.json"></div>''')
    assert payload.filename == 'sliders.json'
