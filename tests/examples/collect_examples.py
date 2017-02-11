from __future__ import absolute_import, print_function

import yaml
import os

from os.path import join, dirname, abspath, relpath, pardir

base_dir = dirname(__file__)
example_dir = abspath(join(base_dir, pardir, pardir, 'examples'))

class Flags(object):
    file     = 1 << 0
    server   = 1 << 1
    notebook = 1 << 2
    skip     = 1 << 3
    no_diff  = 1 << 4


class Example(object):

    def __init__(self, path, flags):
        self.path = path
        self.flags = flags

    def __str__(self):
        flags = ["file"     if self.is_file     else "",
                 "server"   if self.is_server   else "",
                 "notebook" if self.is_notebook else "",
                 "skip"     if self.is_skip     else "",
                 "no_diff"  if self.no_diff     else ""]
        return "Example(%r, %s)" % (self.relpath, "|".join([ f for f in flags if f ]))


    __repr__ = __str__

    @property
    def relpath(self):
        return relpath(self.path, example_dir)

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
    def is_skip(self):
        return self.flags & Flags.skip

    @property
    def no_diff(self):
        return self.flags & Flags.no_diff


def add_examples(list_of_examples, path, example_type=None, skip=None, no_diff=None):
    example_path = join(example_dir, path)

    def get_flags(f):
        if example_type is not None:
            return example_type
        else:
            return Flags.file

    for f in os.listdir(example_path):
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

        if skip is not None and (skip == 'all' or f in skip):
            flags |= Flags.skip

        if no_diff is not None and (no_diff == 'all' or f in no_diff):
            flags |= Flags.no_diff

        list_of_examples.append(Example(join(example_path, f), flags))

    return list_of_examples


def get_all_examples():
    # Make a list of all the examples
    list_of_examples = []
    with open(join(dirname(__file__), "examples.yaml"), "r") as f:
        examples = yaml.load(f.read())
    for example in examples:
        path = example["path"]
        if example.get("type") is not None:
            example_type = getattr(Flags, example["type"])
        else:
            example_type = None

        skip_status = example.get("skip")
        no_diff_status = example.get("no_diff")

        list_of_examples = add_examples(list_of_examples, path, example_type=example_type, skip=skip_status, no_diff=no_diff_status)

    return list_of_examples


def get_file_examples():
    all_examples = get_all_examples()
    return [ example for example in all_examples if example.is_file and not example.is_skip ]


def get_server_examples():
    all_examples = get_all_examples()
    return [ example for example in all_examples if example.is_server and not example.is_skip ]


def get_notebook_examples():
    all_examples = get_all_examples()
    return [ example for example in all_examples if example.is_notebook and not example.is_skip ]
