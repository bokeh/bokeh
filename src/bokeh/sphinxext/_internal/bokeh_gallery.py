# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Generate a gallery of Bokeh plots from a configuration file.

"""

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
from __future__ import annotations

import logging  # isort:skip

log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

import json
import re
from html import escape
from pathlib import Path, PurePosixPath
from typing import Any

from sphinx.errors import SphinxError
from sphinx.util.rst import escape as escape_rst

from . import PARALLEL_SAFE, REPO_TOP, SphinxParallelSpec
from .bokeh_directive import BokehDirective
from .bokeh_example_metadata import read_example_metadata, sampledata_modules
from .templates import EXAMPLE_INDEX, GALLERY_DETAIL, GALLERY_PAGE

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "BokehGalleryDirective",
    "setup",
)

TOPIC_LABELS = {
    "basic": "Basic plotting",
    "geo": "Geospatial",
    "hex": "Hex tiles",
    "js_callbacks": "JavaScript callbacks",
    "mathtext": "Math text",
    "scatters": "Scatter plots",
    "server": "Bokeh server",
    "stats": "Statistics",
    "styling": "Appearance",
    "timeseries": "Time series",
    "topics": "Topic guides",
    "webgl": "WebGL",
}

EXAMPLE_INVENTORY = "bokeh_example_inventory.json"

# Keep initials and dotted abbreviations such as U.S. inside the sentence.
SUMMARY_SENTENCE_BREAK = re.compile(r"(?<=[.!?])(?<!\b[A-Z]\.)\s+(?=[A-Z])")

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------
class BokehGalleryDirective(BokehDirective):

    has_content = True

    def run(self) -> list[Any]:
        config = self.env.config
        srcdir = Path(self.env.srcdir)
        examples = Path(REPO_TOP) / "examples"
        sources = _read_inventory(self)
        records = []
        for relative in sources:
            if relative.suffix == ".py":
                self.env.note_dependency(examples / relative)
                summary, metadata = read_example_metadata(examples / relative)
                if "gallery" in metadata:
                    records.append((relative, summary, metadata))
        groups = []
        for line in self.content:
            _validate_category(line, examples, config)
            location = line
            opts = []
            if location == "server/app":
                catalog = srcdir / config.bokeh_gallery_catalog
                self.env.note_dependency(catalog)
                for detail in json.loads(catalog.read_text(encoding="utf-8"))[location]:
                    opts.append({
                        "url": detail["url"],
                        "target": "_blank",
                        "img": f"examples/{location}/{detail['name']}",
                        "alt": escape(detail["alt"]),
                        "title": escape(detail["title"]),
                        "desc": detail["desc"],
                    })
                groups.append({"title": "", "cards": opts})
                continue

            for relative, summary, metadata in records:
                source = examples / relative
                if location not in _example_categories(relative, metadata):
                    continue
                alt = metadata["gallery"]
                if not alt:
                    raise SphinxError(f"Gallery example {relative} needs thumbnail alt text in :gallery:")

                if not _has_example_page(relative, metadata, config):
                    raise SphinxError(f"Gallery example {relative} needs a rendered example page")
                image = (PurePosixPath("examples") / relative).with_suffix("").as_posix()
                for suffix in (".png", "@2x.png"):
                    thumbnail = srcdir / "_images" / f"{image}{suffix}"
                    self.env.note_dependency(thumbnail)
                    if not thumbnail.is_file():
                        raise SphinxError(f"Missing gallery thumbnail {thumbnail}")
                opts.append({
                    "url": f"{image}.html",
                    "target": None,
                    "img": image,
                    "alt": escape(alt),
                    "title": escape(_example_title(source, metadata)),
                    "desc": SUMMARY_SENTENCE_BREAK.split(summary, maxsplit=1)[0],
                    "parse_desc": True,
                })

            if opts:
                groups.append({"title": _topic_label(location.split("/")[-1]), "cards": opts})

        return self.parse(GALLERY_PAGE.render(groups=groups), "<bokeh-gallery>") if groups else []


class BokehSearchableExamplesDirective(BokehDirective):

    def run(self) -> list[Any]:
        if EXAMPLE_INDEX.filename is not None:
            self.env.note_dependency(EXAMPLE_INDEX.filename)
        config = self.env.config
        examples = Path(REPO_TOP) / "examples"
        entries: list[dict[str, Any]] = []
        categories: set[str] = set()
        for relative in _read_inventory(self):
            source = examples / relative
            filename = f"examples/{relative.as_posix()}"
            summary = ""
            metadata: dict[str, str] = {}
            if source.suffix == ".py":
                self.env.note_dependency(source)
                summary, metadata = read_example_metadata(source)
            lead, *remainder = SUMMARY_SENTENCE_BREAK.split(summary, maxsplit=1)
            guide = metadata.get("example-ref")
            rendered = _has_example_page(relative, metadata, config)
            if guide:
                role, target = "ref", guide
            elif rendered:
                docname = (PurePosixPath(config.bokeh_examples_dir) / relative).with_suffix("")
                role, target = "doc", f"/{docname}"
            else:
                role, target = None, None

            category = relative.parts[0]
            example_categories = _example_categories(relative, metadata)
            categories.update(example_categories)
            topics = [_category_label(value) for value in example_categories]
            if relative.suffix == ".ipynb":
                example_type = "Notebook"
            elif category == "server":
                example_type = "Server example"
            elif guide or rendered:
                example_type = "Interactive example"
            else:
                example_type = "Python script"

            details = []
            for field, label in (("apis", "APIs"), ("sampledata", "Sample data"), ("keywords", "Keywords")):
                if value := metadata.get(field, "").partition("#")[0].strip():
                    details.append((label, escape_rst(value)))
            thumbnail = PurePosixPath("examples/_index") / relative.with_suffix(".png")
            thumbnail_path = Path(self.env.srcdir) / "_images" / thumbnail
            if thumbnail_path.parent.is_dir():
                self.env.note_dependency(thumbnail_path.parent)
            if thumbnail_path.is_file():
                self.env.note_dependency(thumbnail_path)
            entries.append(dict(
                title=escape_rst(_example_title(source, metadata)),
                role=role,
                target=target,
                topics=[escape_rst(topic) for topic in topics],
                example_type=example_type,
                summary=lead,
                remaining_summary=remainder[0] if remainder else "",
                details=details,
                filename=filename,
                thumbnail=thumbnail.as_posix() if thumbnail_path.is_file() else None,
            ))
        gallery = Path(self.env.srcdir) / "docs/gallery.rst"
        topic_order = []
        if gallery.is_file():
            self.env.note_dependency(gallery)
            topic_order = list(dict.fromkeys(
                _category_label(line.strip()) for line in gallery.read_text(encoding="utf-8").splitlines()
                if line.strip() in categories
            ))
        entries.sort(key=lambda entry: (entry["title"].casefold(), entry["filename"]))
        return self.parse(EXAMPLE_INDEX.render(entries=entries, topic_order=topic_order), "<bokeh-searchable-examples>")


def config_inited_handler(app: Any, config: Any) -> None:
    repo_examples = Path(REPO_TOP) / "examples"
    docs_examples = Path(app.srcdir) / config.bokeh_examples_dir
    sources = _discover_examples(repo_examples)
    expected = set()
    backlinks: dict[str, list[str]] = {}
    for relative in sources:
        if relative.suffix != ".py":
            continue
        _, metadata = read_example_metadata(repo_examples / relative)
        for category in _example_categories(relative, metadata):
            _validate_category(category, repo_examples, config, source=relative)
        if not _has_example_page(relative, metadata, config):
            continue
        path = docs_examples / relative.with_suffix(".rst")
        expected.add(path)
        content = GALLERY_DETAIL.render(
            filename=relative.stem,
            title=escape_rst(_example_title(relative, metadata)),
            source_path=f"__REPO__/examples/{relative.as_posix()}",
            ref=f".. _example_{relative.stem}_{relative.parent.as_posix()}:",
        )
        _write_if_changed(path, content)
        docname = path.relative_to(app.srcdir).with_suffix("").as_posix()
        for module in set(sampledata_modules(metadata.get("sampledata"))):
            backlinks.setdefault(module, []).append(docname)

    inventory = dict(sources=[source.as_posix() for source in sources], sampledata=backlinks)
    _write_if_changed(Path(app.doctreedir) / EXAMPLE_INVENTORY, json.dumps(inventory, sort_keys=True))

    for path in docs_examples.rglob("*.rst"):
        if path not in expected and path.read_text(encoding="utf-8").startswith(":orphan:\n\n.. index::\n   single: examples;"):
            path.unlink()


def setup(app: Any) -> SphinxParallelSpec:
    """ Required Sphinx extension setup function. """
    app.add_config_value("bokeh_gallery_catalog", "docs/gallery.json", "html")
    app.add_config_value("bokeh_examples_dir", "docs/examples", "html")
    app.add_config_value("bokeh_example_subdirs", [], "html")
    app.add_config_value("bokeh_example_categories", [], "html")
    app.connect("config-inited", config_inited_handler)
    app.add_directive("bokeh-gallery", BokehGalleryDirective)
    app.add_directive("bokeh-searchable-examples", BokehSearchableExamplesDirective)

    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

def _discover_examples(root: Path) -> list[Path]:
    sources = []
    for directory, subdirs, filenames in root.walk():
        subdirs[:] = [name for name in subdirs if not name.startswith((".", "_"))]
        for name in filenames:
            if not name.startswith((".", "_")) and Path(name).suffix in (".py", ".ipynb"):
                sources.append((directory / name).relative_to(root))
    return sorted(sources)


def _read_inventory(directive: BokehDirective) -> list[Path]:
    inventory = Path(directive.env.doctreedir) / EXAMPLE_INVENTORY
    directive.env.note_dependency(inventory)
    return [Path(source) for source in json.loads(inventory.read_text(encoding="utf-8"))["sources"]]


def _write_if_changed(path: Path, content: str) -> None:
    if not path.is_file() or path.read_text(encoding="utf-8") != content:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")


def _example_categories(relative: Path, metadata: dict[str, str]) -> list[str]:
    if "categories" not in metadata:
        return [relative.parent.as_posix()]
    categories = [value.strip() for value in metadata["categories"].split(",")]
    return list(dict.fromkeys(categories))


def _validate_category(category: str, root: Path, config: Any, *, source: Path | None = None) -> None:
    path = PurePosixPath(category)
    valid = (
        bool(category) and not path.is_absolute() and ".." not in path.parts
        and category == path.as_posix()
        and ((root / category).is_dir() or category in config.bokeh_example_categories)
    )
    if not valid:
        context = f" in examples/{source.as_posix()}" if source else " in bokeh-gallery"
        raise SphinxError(f"Unknown example category {category!r}{context}")


def _category_label(category: str) -> str:
    parts = category.split("/")
    if parts[0] in ("basic", "styling", "interaction", "topics") and len(parts) > 1:
        return f"{_topic_label(parts[0])} / {_topic_label(parts[1])}"
    return _topic_label(parts[0])


def _has_example_page(relative: Path, metadata: dict[str, str], config: Any) -> bool:
    if relative.suffix != ".py" or "no-render" in metadata:
        return False
    directory = PurePosixPath(relative.parent.as_posix())
    return "gallery" in metadata or "render" in metadata or any(
        directory.full_match(pattern) for pattern in config.bokeh_example_subdirs
    )


def _example_title(source: Path, metadata: dict[str, str]) -> str:
    return metadata.get("title") or source.stem.replace("_", " ").capitalize()


def _topic_label(slug: str) -> str:
    return TOPIC_LABELS.get(slug, slug.replace("_", " ").capitalize())

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
