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
from html import escape
from pathlib import Path, PurePosixPath
from typing import Any

from sphinx.errors import SphinxError
from sphinx.util.rst import escape as escape_rst

from . import PARALLEL_SAFE, REPO_TOP, SphinxParallelSpec
from .bokeh_directive import BokehDirective
from .bokeh_example_metadata import read_example_metadata
from .templates import GALLERY_DETAIL, GALLERY_PAGE

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
    "js_callbacks": "JavaScript callbacks",
    "mathtext": "Math text",
    "scatters": "Scatter plots",
    "server": "Bokeh server",
    "stats": "Statistics",
    "styling": "Appearance",
    "timeseries": "Time series",
    "topics": "Topic guides",
}

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
        groups = []
        for location in self.content:
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

            for relative in sources:
                if relative.parent.as_posix() != location or relative.suffix != ".py":
                    continue
                source = examples / relative
                self.env.note_dependency(source)
                summary, metadata = read_example_metadata(source)
                if "gallery" not in metadata:
                    continue

                if not _has_example_page(relative, config):
                    raise SphinxError(f"Gallery example {relative} needs a rendered example page")
                image = (PurePosixPath("examples") / relative).with_suffix("").as_posix()
                for suffix in (".png", "@2x.png"):
                    thumbnail = srcdir / "_images" / f"{image}{suffix}"
                    self.env.note_dependency(thumbnail)
                    if not thumbnail.is_file():
                        raise SphinxError(f"Missing gallery thumbnail {thumbnail}")
                if not metadata.get("thumbnail-alt"):
                    raise SphinxError(f"Gallery example {relative} needs a :thumbnail-alt: description")

                opts.append({
                    "url": f"{image}.html",
                    "target": None,
                    "img": image,
                    "alt": escape(metadata["thumbnail-alt"]),
                    "title": escape(_example_title(source, metadata)),
                    "desc": escape(summary),
                })

            if opts:
                groups.append({"title": _topic_label(location.split("/")[-1]), "cards": opts})

        return self.parse(GALLERY_PAGE.render(groups=groups), "<bokeh-gallery>")


class BokehSearchableExamplesDirective(BokehDirective):

    def run(self) -> list[Any]:
        config = self.env.config
        examples = Path(REPO_TOP) / "examples"
        entries = []
        for relative in _read_inventory(self):
            source = examples / relative
            filename = f"examples/{relative.as_posix()}"
            summary = ""
            metadata = {}
            if source.suffix == ".py":
                self.env.note_dependency(source)
                summary, metadata = read_example_metadata(source)
            title = escape_rst(_example_title(source, metadata))

            guide = metadata.get("example-ref")
            rendered = _has_example_page(relative, config)
            if guide:
                heading = f":ref:`{title} <{guide}>`"
            elif rendered:
                docname = (PurePosixPath(config.bokeh_examples_dir) / relative).with_suffix("")
                heading = f":doc:`{title} </{docname}>`"
            else:
                heading = f":bokeh-tree:`{title} <{filename}>`"

            category = relative.parts[0]
            topic = _topic_label(category)
            if category in ("basic", "styling", "interaction", "topics") and len(relative.parts) > 2:
                topic += f" / {_topic_label(relative.parts[1])}"
            if relative.suffix == ".ipynb":
                example_type = "Notebook"
            elif category == "server":
                example_type = "Server example"
            elif guide or rendered:
                example_type = "Interactive example"
            else:
                example_type = "Python script"

            heading_block = (
                f".. container:: bk-example-heading\n\n"
                f"    {heading}\n\n"
                f"    .. container:: bk-example-facets\n\n"
                f"        .. container:: bk-example-topic\n\n"
                f"            {escape_rst(topic)}\n\n"
                f"        .. container:: bk-example-type\n\n"
                f"            {example_type}"
            )
            details = [escape_rst(summary)] if summary else []
            for field, label in (("apis", "APIs"), ("sampledata", "Sample data"), ("keywords", "Keywords")):
                if value := metadata.get(field, "").partition("#")[0].strip():
                    details.append(f"**{label}:** {escape_rst(value)}")
            details.append(f":bokeh-tree:`{filename}`")
            detail_body = "\n\n".join(f"    {paragraph}" for paragraph in details)
            blocks = f"{heading_block}\n\n.. container:: bk-example-details\n\n{detail_body}"
            body = "\n".join(f"    {line}" if line else "" for line in blocks.splitlines())
            entries.append(f".. container:: bk-example-entry\n\n{body}")
        return self.parse("\n\n".join(entries), "<bokeh-searchable-examples>")


def config_inited_handler(app: Any, config: Any) -> None:
    repo_examples = Path(REPO_TOP) / "examples"
    docs_examples = Path(app.srcdir) / config.bokeh_examples_dir
    sources = _discover_examples(repo_examples)
    inventory = Path(app.doctreedir) / "bokeh_example_sources.txt"
    _write_if_changed(inventory, "".join(f"{source.as_posix()}\n" for source in sources))

    expected = set()
    for relative in sources:
        if not _has_example_page(relative, config):
            continue
        path = docs_examples / relative.with_suffix(".rst")
        expected.add(path)
        content = GALLERY_DETAIL.render(
            filename=relative.stem,
            source_path=f"__REPO__/examples/{relative.as_posix()}",
            ref=f".. _example_{relative.stem}_{relative.parent.as_posix()}:",
        )
        _write_if_changed(path, content)

    for path in docs_examples.rglob("*.rst"):
        if path not in expected and path.read_text(encoding="utf-8").startswith(":orphan:\n\n.. index::\n   single: examples;"):
            path.unlink()


def setup(app: Any) -> SphinxParallelSpec:
    """ Required Sphinx extension setup function. """
    app.add_config_value("bokeh_gallery_catalog", "docs/gallery.json", "html")
    app.add_config_value("bokeh_examples_dir", "docs/examples", "html")
    app.add_config_value("bokeh_example_subdirs", [], "html")
    app.add_config_value("bokeh_sampledata_xref_skiplist", [], "html")
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
    inventory = Path(directive.env.doctreedir) / "bokeh_example_sources.txt"
    directive.env.note_dependency(inventory)
    return [Path(line) for line in inventory.read_text(encoding="utf-8").splitlines()]


def _write_if_changed(path: Path, content: str) -> None:
    if not path.is_file() or path.read_text(encoding="utf-8") != content:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")


def _has_example_page(relative: Path, config: Any) -> bool:
    return (
        relative.suffix == ".py"
        and relative.parent.as_posix() in config.bokeh_example_subdirs
        and f"examples/{relative.as_posix()}" not in config.bokeh_sampledata_xref_skiplist
    )


def _example_title(source: Path, metadata: dict[str, str]) -> str:
    return metadata.get("title") or source.stem.replace("_", " ").capitalize()


def _topic_label(slug: str) -> str:
    return TOPIC_LABELS.get(slug, slug.replace("_", " ").capitalize())

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
