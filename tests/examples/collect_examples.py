from __future__ import absolute_import, print_function

import os

import yaml
import requests

from os.path import join, dirname, basename, abspath, relpath, pardir, splitext, isfile

from ..plugins.constants import __version__, job_id
from ..plugins.upload_to_s3 import S3_URL, upload_file_to_s3

from ..plugins.utils import trace, green

import logging
logging.getLogger('requests.packages.urllib3.connectionpool').setLevel(logging.INFO)

base_dir = dirname(__file__)
example_dir = abspath(join(base_dir, pardir, pardir, 'examples'))

class Flags(object):
    file     = 1 << 0
    server   = 1 << 1
    notebook = 1 << 2
    slow     = 1 << 3  # example needs a lot of time to run (> 30 s) (e.g. choropleth.py)
    skip     = 1 << 4  # don't run example at all (e.g. notebooks are completely broken)
    no_js    = 1 << 5  # skip bokehjs and thus image diff (e.g. google maps key issue)
    no_diff  = 1 << 6  # skip only image diff (e.g. inherent randomness as in jitter)


class Example(object):

    def __init__(self, path, flags):
        self.path = path
        self.flags = flags
        self._diff_ref = None
        self._upload = False
        self.pixels = 0
        self._has_ref = False

    def __str__(self):
        flags = ["file"     if self.is_file     else "",
                 "server"   if self.is_server   else "",
                 "notebook" if self.is_notebook else "",
                 "slow"     if self.is_slow     else "",
                 "skip"     if self.is_skip     else "",
                 "no_js"    if self.no_js       else "",
                 "no_diff"  if self.no_diff     else ""]
        return "Example(%r, %s)" % (self.relpath, "|".join([ f for f in flags if f ]))

    __repr__ = __str__

    @property
    def name(self):
        return basename(self.path._no_ext)

    @property
    def relpath(self):
        return relpath(self.path, example_dir)

    @property
    def path_no_ext(self):
        return splitext(self.path)[0]

    @property
    def relpath_no_ext(self):
        return splitext(self.relpath)[0]

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
    def no_js(self):
        return self.flags & Flags.no_js

    @property
    def no_diff(self):
        return self.flags & Flags.no_diff

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
        return "%s-%s-%s.png" % (self.path_no_ext, __version__, job_id)

    @property
    def ref_path(self):
        return "%s-%s-%s.png" % (self.path_no_ext, self._diff_ref, job_id)

    @property
    def diff_path(self):
        return "%s-%s-%s-diff-%s.png" % (self.path_no_ext, __version__, self._diff_ref, job_id)

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
        return join(__version__, self.relpath_no_ext) + '.png'

    @property
    def ref_url_path(self):
        return join(self._diff_ref, self.relpath_no_ext) + '.png'

    @property
    def diff_url_path(self):
        return join(__version__, self.relpath_no_ext) + self._diff_ref + '-diff.png'

    @property
    def has_ref(self):
        return self._has_ref

    def fetch_ref(self):
        response = requests.get(self.ref_url)

        if response.ok:
            self._has_ref = True
            return response.content
        else:
            return None

    def upload_imgs(self):
        if isfile(self.img_path):
            trace("%s Uploading image to S3 to %s" % (green(">>>"), self.img_url_path))
            upload_file_to_s3(self.img_path, self.img_url_path, "image/png")
        if isfile(self.diff_path):
            trace("%s Uploading image to S3 to %s" % (green(">>>"), self.diff_url_path))
            upload_file_to_s3(self.diff_path, self.diff_url_path, "image/png")

    @property
    def images_differ(self):
        return self.pixels != 0

    @property
    def dimensions_differ(self):
        return self.pixels == -1

def add_examples(list_of_examples, path, example_type=None, slow=None, skip=None, no_js=None, no_diff=None):
    example_path = join(example_dir, path)

    def get_flags(f):
        if example_type is not None:
            return example_type
        else:
            return Flags.file

    for f in sorted(os.listdir(example_path)):
        flags = 0

        if f.startswith(('_', '.')):
            continue
        elif f.endswith(".py"):
            flags |= get_flags(f)
        elif f.endswith(".ipynb"):
            flags |= Flags.notebook
        elif os.path.isdir(os.path.join(example_path, f)):
            f = os.path.join(f, f + ".py")
            if not os.path.exists(f):
                continue
            flags |= get_flags(f)
        else:
            continue

        if slow is not None and f in slow:
            flags |= Flags.slow

        if skip is not None and (skip == 'all' or f in skip):
            flags |= Flags.skip

        if no_js is not None and (no_js == 'all' or f in no_js):
            flags |= Flags.no_js

        if no_diff is not None and (no_diff == 'all' or f in no_diff):
            flags |= Flags.no_diff

        list_of_examples.append(Example(join(example_path, f), flags))

    return list_of_examples


def collect_examples():
    list_of_examples = []

    with open(join(dirname(__file__), "examples.yaml"), "r") as f:
        examples = yaml.load(f.read())

    for example in examples:
        path = example["path"]
        if example.get("type") is not None:
            example_type = getattr(Flags, example["type"])
        else:
            example_type = None

        slow_status = example.get("slow")
        skip_status = example.get("skip")
        no_js_status = example.get("no_js")
        no_diff_status = example.get("no_diff")

        list_of_examples = add_examples(list_of_examples, path, example_type=example_type,
            slow=slow_status, skip=skip_status, no_js=no_js_status, no_diff=no_diff_status)


    return list_of_examples
