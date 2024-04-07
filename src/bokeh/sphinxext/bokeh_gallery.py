# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Generate a gallery of Bokeh plots from a configuration file.

To enable this extension, add `"bokeh.sphinxext.bokeh_gallery"` to the
extensions list in your Sphinx configuration module.

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

# Standard library imports
import json
import os
from os.path import (
    abspath,
    dirname,
    exists,
    getmtime,
    isdir,
    isfile,
    join,
)
from pathlib import PurePath
from typing import TypedDict

# External imports
from sphinx.errors import SphinxError
from sphinx.util import ensuredir
from sphinx.util.display import status_iterator

# Bokeh imports
from . import PARALLEL_SAFE
from .bokeh_directive import BokehDirective
from .templates import GALLERY_DETAIL, GALLERY_PAGE
from .util import _REPO_TOP

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "BokehGalleryDirective",
    "setup",
)

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------
class GalleryDetail(TypedDict):
    name: str
    path: str
    ref: str
    rst_file_path: str

class BokehGalleryDirective(BokehDirective):

    has_content = True
    required_arguments = 0

    def run(self):
        docdir = dirname(self.env.doc2path(self.env.docname))

        gallery_file = join(docdir, "gallery.json")

        gallery_dir = join(dirname(dirname(gallery_file)), "gallery")
        if not exists(gallery_dir) and isdir(gallery_dir):
            raise SphinxError(f"gallery dir {gallery_dir!r} missing for gallery file {gallery_file!r}")

        gallery_json = json.load(open(gallery_file))

        opts = []

        for location in self.content:

            for detail in gallery_json[location]:
                path = PurePath("examples") / location / detail["name"]
                if "url" in detail:
                    url = detail.get("url")
                    target = "_blank"
                else:
                    url = str(path.with_suffix(".html"))
                    target = None
                opts.append({
                    "url": url,
                    "target": target,
                    "img": str(path.with_suffix("")),
                    "alt": detail.get("alt"),
                    "title": path.stem,
                    "desc": detail.get("desc", None),
                })

        rst_text = GALLERY_PAGE.render(opts=opts)

        return self.parse(rst_text, "<bokeh-gallery>")


def config_inited_handler(app, config):
    gallery_dir = join(app.srcdir, config.bokeh_gallery_dir)
    examples_dir = join(app.srcdir, config.bokeh_examples_dir)

    gallery_file = f"{gallery_dir}.json"

    if not exists(gallery_file) and isfile(gallery_file):
        raise SphinxError(f"could not find gallery file {gallery_file!r} for configured gallery dir {gallery_dir!r}")

    gallery_file_mtime = getmtime(gallery_file)

    ensuredir(gallery_dir)
    ensuredir(examples_dir)
    for subdir in config.bokeh_example_subdirs:
        ensuredir(join(examples_dir, subdir))

    # we will remove each file we process from this set and see if anything is
    # left at the end (and remove it in that case)
    extras = set(os.listdir(gallery_dir))

    details = get_details(app)
    details_iter = status_iterator(details, "creating gallery file entries... ", "brown", len(details), app.verbosity, stringify_func=lambda x: x["name"] + ".rst")

    for detail in details_iter:
        detail_file_path = join(examples_dir, detail["rst_file_path"])

        if detail_file_path in extras:
            extras.remove(detail_file_path)

        # if the gallery detail file is newer than the gallery file, assume it is up to date
        if exists(detail_file_path) and getmtime(detail_file_path) > gallery_file_mtime:
            continue

        with open(detail_file_path, "w") as f:
            source_path = abspath(join(app.srcdir, "..", "..", "..", detail["path"]))
            f.write(GALLERY_DETAIL.render(filename=detail["name"], source_path=source_path, ref=detail["ref"]))

    for extra_file in extras:
        os.remove(join(gallery_dir, extra_file))


def get_details(app):
    details = []
    for subdir in app.config.bokeh_example_subdirs:
        for name in os.listdir(_REPO_TOP / "examples" / subdir):
            path = PurePath("examples", subdir, name).as_posix()
            if not name.startswith('_') and name.endswith('.py') and path not in app.config.bokeh_sampledata_xref_skiplist:
                name = name.replace('.py', '')
                rst_file_path = join(subdir, f'{name}.rst')
                ref = f'.. _example_{name}_{subdir}:'
                detail: GalleryDetail = {"path": path, "name": name, "rst_file_path": rst_file_path, "ref": ref}
                details.append(detail)
    return details

def setup(app):
    """ Required Sphinx extension setup function. """
    app.add_config_value("bokeh_gallery_dir", join("docs", "gallery"), "html")
    app.add_config_value("bokeh_examples_dir", join("docs", "examples"), "html")
    app.add_config_value("bokeh_example_subdirs", [], "html")
    app.add_config_value("bokeh_sampledata_xref_skiplist", [], "html")
    app.connect("config-inited", config_inited_handler)
    app.add_directive("bokeh-gallery", BokehGalleryDirective)

    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
