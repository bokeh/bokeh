# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
from sphinx.util import ensuredir, status_iterator

# Bokeh imports
from . import PARALLEL_SAFE
from .bokeh_directive import BokehDirective
from .templates import GALLERY_DETAIL, GALLERY_PAGE
from .util import TOP_PATH

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

    has_content = False
    required_arguments = 1

    def run(self):
        docdir = dirname(self.env.doc2path(self.env.docname))

        gallery_file = join(docdir, self.arguments[0])

        gallery_dir = join(dirname(dirname(gallery_file)), "gallery")
        if not exists(gallery_dir) and isdir(gallery_dir):
            raise SphinxError(f"gallery dir {gallery_dir!r} missing for gallery file {gallery_file!r}")

        spec = json.load(open(gallery_file))

        opts = []
        for detail in spec["details"]:
            name = detail["path"]
            alt = detail.get("alt", None)
            path = PurePath(name).parts
            name = path[-1].replace('.py', '')
            opts.append({
                "name": name,
                "ref": f"examples/{path[1]}/{name}.html",
                "alt": alt,
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
    ensuredir(join(examples_dir, 'models'))
    ensuredir(join(examples_dir, 'plotting'))

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
            source_path = abspath(join(app.srcdir, "..", "..", detail["path"]))
            f.write(GALLERY_DETAIL.render(filename=detail["name"], source_path=source_path, ref=detail["ref"]))

    for extra_file in extras:
        os.remove(join(gallery_dir, extra_file))


def get_details(app):
    details = []
    for f_path in app.config.bokeh_example_dirs:
        for name in os.listdir(join(TOP_PATH, f_path)):
            subdir = f_path.split('/')[1]
            path = join(f_path, name)
            if not name.startswith('_') and name.endswith('.py') and not path in app.config.bokeh_sampledata_xref_skiplist:
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
    app.add_config_value("bokeh_example_dirs", [], "html")
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
