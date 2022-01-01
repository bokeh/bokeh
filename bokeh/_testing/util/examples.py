#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide support modules for testing Bokeh itself.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import os
from base64 import b64decode
from os.path import (
    basename,
    dirname,
    exists,
    isdir,
    join,
    normpath,
    pardir,
    relpath,
    splitext,
)
from typing import List, Union

# External imports
import yaml
from typing_extensions import Literal

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'add_examples',
    'collect_examples',
    'Example',
    'Flags',
)

JOB_ID = os.environ.get("GITHUB_ACTION", "local")

PathLike = Union[str, bytes, "os.PathLike[str]", "os.PathLike[bytes]"]

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Flags:
    file     = 1 << 1
    server   = 1 << 2
    notebook = 1 << 3
    slow     = 1 << 4  # example needs a lot of time to run (> 30 s) (e.g. choropleth.py)
    skip     = 1 << 5  # don't run example at all (e.g. notebooks are completely broken)
    xfail    = 1 << 6  # test is expected to fail, which doesn't fail the test suite
    no_js    = 1 << 7  # skip bokehjs and thus image diff (e.g. google maps key issue)


class Example:
    def __init__(self, path: str, flags: int, examples_dir: str, extensions: List[str] = []) -> None:
        self.path = normpath(path)
        self.flags = flags
        self.examples_dir = examples_dir
        self.extensions = extensions
        self._diff_ref = None
        self.pixels = 0
        self._has_ref = None

    def __str__(self) -> str:
        flags = [
            "file"     if self.is_file     else "",
            "server"   if self.is_server   else "",
            "notebook" if self.is_notebook else "",
            "slow"     if self.is_slow     else "",
            "skip"     if self.is_skip     else "",
            "xfail"    if self.is_xfail    else "",
            "no_js"    if self.no_js       else "",
        ]

        return "Example(%r, %s)" % (self.relpath, "|".join(f for f in flags if f))

    __repr__ = __str__

    @property
    def name(self) -> str:
        return basename(self.path_no_ext)

    @property
    def base_dir(self) -> str:
        return dirname(self.path)

    @property
    def relpath(self) -> str:
        return relpath(self.path, self.examples_dir)

    @property
    def path_no_ext(self) -> str:
        return splitext(self.path)[0]

    @property
    def img_path(self) -> str:
        return self.path_no_ext + ".png"

    @property
    def is_file(self) -> bool:
        return bool(self.flags & Flags.file)

    @property
    def is_server(self) -> bool:
        return bool(self.flags & Flags.server)

    @property
    def is_notebook(self) -> bool:
        return bool(self.flags & Flags.notebook)

    @property
    def is_slow(self) -> bool:
        return bool(self.flags & Flags.slow)

    @property
    def is_skip(self) -> bool:
        return bool(self.flags & Flags.skip)

    @property
    def is_xfail(self) -> bool:
        return bool(self.flags & Flags.xfail)

    @property
    def no_js(self) -> bool:
        return bool(self.flags & Flags.no_js)

    def store_img(self, img_data: str) -> None:
        _store_binary(self.img_path, b64decode(img_data))

All = Literal["all"]

def add_examples(list_of_examples: List[Example], path: str, examples_dir: str, example_type: int | None = None,
        slow: List[str] | All | None = None, skip: List[str] | All | None = None,
        xfail: List[str] | All | None = None, no_js: List[str] | All | None = None) -> None:
    if path.endswith("*"):
        star_path = join(examples_dir, path[:-1])

        for name in sorted(os.listdir(star_path)):
            if isdir(join(star_path, name)):
                add_examples(list_of_examples, join(path[:-1], name), examples_dir, example_type, slow, skip, xfail, no_js)

        return

    example_path = normpath(join(examples_dir, path))

    for name in sorted(os.listdir(example_path)):
        flags = 0
        extensions: List[str] = []
        orig_name = name

        if name.startswith(('_', '.')):
            continue
        elif name.endswith(".py"):
            flags |= example_type if example_type else Flags.file
        elif name.endswith(".ipynb"):
            flags |= Flags.notebook
        elif isdir(join(example_path, name)):
            if exists(join(example_path, name, name + ".py")):
                name = join(name, name + ".py")
                flags |= example_type if example_type else Flags.file
            elif exists(join(example_path, name, "main.py")):
                # name is unchanged and passed as the example name
                flags |= example_type if example_type else Flags.server
            else:
                continue

            ext_file = "bokeh.ext.json"
            if exists(join(example_path, orig_name, ext_file)):
                extensions.append(join(example_path, orig_name))
            else:
                for dir_name in os.listdir(join(example_path, orig_name)):
                    dir_path = join(example_path, orig_name, dir_name)
                    if exists(join(dir_path, ext_file)):
                        extensions.append(dir_path)
        else:
            continue

        if slow is not None and orig_name in slow:
            flags |= Flags.slow

        if skip is not None and (skip == 'all' or orig_name in skip):
            flags |= Flags.skip

        if xfail is not None and (xfail == 'all' or orig_name in xfail):
            flags |= Flags.xfail

        if no_js is not None and (no_js == 'all' or orig_name in no_js):
            flags |= Flags.no_js

        list_of_examples.append(Example(join(example_path, name), flags, examples_dir, extensions))


def collect_examples(config_path: str) -> List[Example]:
    examples_dir = join(dirname(config_path), pardir)
    list_of_examples: List[Example] = []

    with open(config_path, "r") as f:
        examples = yaml.safe_load(f.read())

    for example in examples:
        path = example["path"]
        if example.get("type") is not None:
            example_type = getattr(Flags, example["type"])
        else:
            example_type = None

        slow_status = example.get("slow")
        skip_status = example.get("skip")
        xfail_status = example.get("xfail")
        no_js_status = example.get("no_js")

        add_examples(list_of_examples, path, examples_dir,
            example_type=example_type, slow=slow_status, skip=skip_status, xfail=xfail_status, no_js=no_js_status)

    return list_of_examples

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _store_binary(path: PathLike, data: bytes) -> None:
    directory = dirname(path)
    if not exists(directory):
        os.makedirs(directory)

    with open(path, "wb") as f:
        f.write(data)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
