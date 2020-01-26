#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide support modules for testing Bokeh itself.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import io
import os
from base64 import b64decode
from os.path import (
    basename,
    dirname,
    exists,
    isdir,
    isfile,
    join,
    normpath,
    pardir,
    relpath,
    splitext,
)
from subprocess import PIPE, Popen

# External imports
import requests
import yaml

# Bokeh imports
from bokeh._testing.util.git import __version__
from bokeh._testing.util.images import image_diff
from bokeh._testing.util.s3 import S3_URL, upload_file_to_s3
from bokeh.util.terminal import green, trace

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

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Flags(object):
    js       = 1 << 0
    file     = 1 << 1
    server   = 1 << 2
    notebook = 1 << 3
    slow     = 1 << 4  # example needs a lot of time to run (> 30 s) (e.g. choropleth.py)
    skip     = 1 << 5  # don't run example at all (e.g. notebooks are completely broken)
    xfail    = 1 << 6  # test is expected to fail, which doesn't fail the test suite
    no_js    = 1 << 7  # skip bokehjs and thus image diff (e.g. google maps key issue)
    no_diff  = 1 << 8  # skip only image diff (e.g. inherent randomness as in jitter)

class Example(object):

    def __init__(self, path, flags, examples_dir):
        self.path = normpath(path)
        self.flags = flags
        self.examples_dir = examples_dir
        self._diff_ref = None
        self._upload = False
        self.pixels = 0
        self._has_ref = None
        self._has_baseline = None
        self._baseline_ok = True

    def __str__(self):
        flags = [
            "js"       if self.is_js       else "",
            "file"     if self.is_file     else "",
            "server"   if self.is_server   else "",
            "notebook" if self.is_notebook else "",
            "slow"     if self.is_slow     else "",
            "skip"     if self.is_skip     else "",
            "xfail"    if self.xfail       else "",
            "no_js"    if self.no_js       else "",
            "no_diff"  if self.no_diff     else "",
        ]

        return "Example(%r, %s)" % (self.relpath, "|".join(f for f in flags if f))

    __repr__ = __str__

    @property
    def name(self):
        return basename(self.path_no_ext)

    @property
    def base_dir(self):
        return dirname(self.path)

    @property
    def imgs_dir(self):
        return join(dirname(self.path), ".tests")

    @property
    def relpath(self):
        return relpath(self.path, self.examples_dir)

    @property
    def path_no_ext(self):
        return splitext(self.path)[0]

    @property
    def relpath_no_ext(self):
        return splitext(self.relpath)[0]

    @property
    def is_js(self):
        return self.flags & Flags.js

    @property
    def is_file(self):
        return self.flags & Flags.file

    @property
    def is_server(self):
        return self.flags & Flags.server

    @property
    def is_notebook(self):
        return self.flags & Flags.notebook

    @property
    def is_slow(self):
        return self.flags & Flags.slow

    @property
    def is_skip(self):
        return self.flags & Flags.skip

    @property
    def is_xfail(self):
        return self.flags & Flags.xfail

    @property
    def no_js(self):
        return self.flags & Flags.no_js

    @property
    def no_diff(self):
        return self.flags & Flags.no_diff

    @property
    def baseline_ok(self):
        return self.has_baseline and self._baseline_ok

    @property
    def baseline_path(self):
        return join("tests", "baselines", relpath(self.path_no_ext, ""))

    @property
    def has_baseline(self):
        if self._has_baseline is None:
            cmd = ["git", "show", ":%s" % self.baseline_path]
            proc = Popen(cmd, stdout=PIPE, stderr=PIPE)
            proc.communicate()

            self._has_baseline = proc.returncode == 0

        return self._has_baseline

    def store_baseline(self, baseline):
        path = self.baseline_path
        if not exists(dirname(path)):
            os.makedirs(dirname(path))
        with io.open(path, "w", newline="\n") as f:
            f.write(baseline)

    def diff_baseline(self):
        cmd = ["git", "diff", "--color", "--exit-code", "%s" % self.baseline_path]
        proc = Popen(cmd, stdout=PIPE, stderr=PIPE)
        (diff, _) = proc.communicate()

        if proc.returncode == 0:
            return None

        cmd = ["perl", "/usr/share/doc/git/contrib/diff-highlight/diff-highlight"]
        proc = Popen(cmd, stdout=PIPE, stderr=PIPE, stdin=PIPE)
        (hl_diff, _) = proc.communicate(diff)

        if proc.returncode == 0:
            diff = hl_diff

        self._baseline_ok = False
        return diff.decode("utf-8").strip()

    @property
    def img_path_or_url(self):
        return self.img_path if not self._upload else self.img_url

    @property
    def ref_path_or_url(self):
        return self.ref_path if not self._upload else self.ref_url

    @property
    def diff_path_or_url(self):
        return self.diff_path if not self._upload else self.diff_url

    @property
    def img_path(self):
        return join(self.imgs_dir, "%s-%s-%s.png" % (self.name, __version__, JOB_ID))

    @property
    def ref_path(self):
        return join(self.imgs_dir, "%s-%s-%s.png" % (self.name, self._diff_ref, JOB_ID))

    @property
    def diff_path(self):
        return join(self.imgs_dir, "%s-%s-%s-diff-%s.png" % (self.name, __version__, self._diff_ref, JOB_ID))

    @property
    def img_url(self):
        return join(S3_URL, self.img_url_path)

    @property
    def ref_url(self):
        return join(S3_URL, self.ref_url_path)

    @property
    def diff_url(self):
        return join(S3_URL, self.diff_url_path)

    @property
    def img_url_path(self):
        return join("github-ci", "image_refs", __version__, self.relpath_no_ext) + '.png'

    @property
    def ref_url_path(self):
        return join("github-ci", "image_refs", self._diff_ref, self.relpath_no_ext) + '.png'

    @property
    def diff_url_path(self):
        return join("github-ci", "image_refs", __version__, self.relpath_no_ext) + self._diff_ref + '-diff.png'

    @property
    def has_ref(self):
        return self._has_ref

    def fetch_ref(self):
        if self._has_ref is None:
            response = requests.get(self.ref_url)
            self._has_ref = response.ok

            if response.ok:
                _store_binary(self.ref_path, response.content)

        return self._has_ref

    def store_img(self, img_data):
        _store_binary(self.img_path, b64decode(img_data))

    def upload_imgs(self):
        if isfile(self.img_path):
            trace("%s Uploading image to S3 to %s" % (green(">>>"), self.img_path))
            upload_file_to_s3(self.img_path, self.img_url_path, "image/png")
        if isfile(self.diff_path):
            trace("%s Uploading image to S3 to %s" % (green(">>>"), self.diff_path))
            upload_file_to_s3(self.diff_path, self.diff_url_path, "image/png")


    @property
    def images_differ(self):
        return self.pixels != 0

    def image_diff(self):
        self.pixels = image_diff(self.diff_path, self.img_path, self.ref_path)
        return self.pixels

def add_examples(list_of_examples, path, examples_dir, example_type=None, slow=None, skip=None, xfail=None, no_js=None, no_diff=None):
    if path.endswith("*"):
        star_path = join(examples_dir, path[:-1])

        for name in sorted(os.listdir(star_path)):
            if isdir(join(star_path, name)):
                add_examples(list_of_examples, join(path[:-1], name), examples_dir, example_type, slow, skip, xfail, no_js, no_diff)

        return

    example_path = join(examples_dir, path)

    for name in sorted(os.listdir(example_path)):
        flags = 0
        orig_name = name

        if name.startswith(('_', '.')):
            continue
        elif name.endswith(".py"):
            flags |= example_type if example_type else Flags.file
        elif name.endswith(".ipynb"):
            flags |= Flags.notebook
        elif isdir(join(example_path, name)):
            if exists(join(example_path, name, name + ".html")):
                name = join(name, name + ".html")
                flags |= example_type if example_type else Flags.js
            elif exists(join(example_path, name, name + ".py")):
                name = join(name, name + ".py")
                flags |= example_type if example_type else Flags.file
            elif exists(join(example_path, name, "main.py")):
                # name is unchanged and passed as the example name
                flags |= example_type if example_type else Flags.server
            else:
                continue
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

        if no_diff is not None and (no_diff == 'all' or orig_name in no_diff):
            flags |= Flags.no_diff

        list_of_examples.append(Example(join(example_path, name), flags, examples_dir))


def collect_examples(config_path):
    examples_dir = join(dirname(config_path), pardir)
    list_of_examples = []

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
        no_diff_status = example.get("no_diff")

        add_examples(list_of_examples, path, examples_dir,
            example_type=example_type, slow=slow_status, skip=skip_status, xfail=xfail_status, no_js=no_js_status, no_diff=no_diff_status)

    return list_of_examples

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _store_binary(path, data):
    directory = dirname(path)
    if not exists(directory):
        os.makedirs(directory)

    with open(path, "wb") as f:
        f.write(data)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
