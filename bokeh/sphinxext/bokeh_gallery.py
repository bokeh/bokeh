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
from typing import TypedDict

# External imports
from sphinx.errors import SphinxError
from sphinx.util import ensuredir, status_iterator

# Bokeh imports
from . import PARALLEL_SAFE
from .bokeh_directive import BokehDirective
from .templates import EXAMPLE_INDEX, GALLERY_DETAIL, GALLERY_PAGE
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
    path: str
    name: str
    detail_file_name: str

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
        names = [detail["name"] for detail in spec["details"]]

        rst_text = GALLERY_PAGE.render(names=names)

        return self.parse(rst_text, "<bokeh-gallery>")


def config_inited_handler(app, config):
    gallery_dir = join(app.srcdir, config.bokeh_gallery_dir)
    gallery_file = f"{gallery_dir}.json"

    if not exists(gallery_file) and isfile(gallery_file):
        raise SphinxError(f"could not find gallery file {gallery_file!r} for configured gallery dir {gallery_dir!r}")

    gallery_file_mtime = getmtime(gallery_file)

    ensuredir(gallery_dir)

    # we will remove each file we process from this set and see if anything is
    # left at the end (and remove it in that case)
    extras = set(os.listdir(gallery_dir))

    details = get_details(app)
    details_iter = status_iterator(details, "creating gallery file entries... ", "brown", len(details), app.verbosity, stringify_func=lambda x: x["name"] + ".rst")

    for detail in details_iter:
        detail_file_path = join(gallery_dir, detail["detail_file_name"])

        if detail_file_path in extras:
            extras.remove(detail_file_path)

        # if the gallery detail file is newer than the gallery file, assume it is up to date
        if exists(detail_file_path) and getmtime(detail_file_path) > gallery_file_mtime:
            continue

        with open(detail_file_path, "w") as f:
            source_path = abspath(join(app.srcdir, "..", "..", detail["path"]))
            f.write(GALLERY_DETAIL.render(filename=detail["name"], source_path=source_path))

    for extra_file in extras:
        os.remove(join(gallery_dir, extra_file))

    with open(join(gallery_dir, "example_index.rst"), "w") as f:
        f.write(EXAMPLE_INDEX.render())

def get_details(app):
    details = []
    detail_names = []
    for f_path in app.config.bokeh_example_dirs:
        for name in os.listdir(join(TOP_PATH, f_path)):
            path = join(f_path, name)
            if path in app.config.bokeh_example_blacklist:
                print(path)
            if not name.startswith('_') and name.endswith('.py') and not path in app.config.bokeh_example_blacklist:
                name = name.replace('.py', '')
                detail_name = name + '.rst'
                if detail_name in detail_names:
                    f = f_path.split('/')[1]
                    detail_name = detail_name.replace('.rst', f'_{f}.rst')
                detail: GalleryDetail = {"path": path, "name": name, "detail_file_name": detail_name}
                details.append(detail)
                detail_names.append(detail_name)
    return details

def setup(app):
    """ Required Sphinx extension setup function. """
    app.add_config_value("bokeh_gallery_dir", join("docs", "gallery"), "html")
    app.add_config_value("bokeh_example_dirs", [], "html")
    app.add_config_value("bokeh_example_blacklist", [], "html")
    app.connect("config-inited", config_inited_handler)
    app.add_directive("bokeh-gallery", BokehGalleryDirective)

    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
