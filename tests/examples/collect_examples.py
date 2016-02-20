import yaml
import os
import pytest

from os.path import join, dirname
from ..constants import Flags, example_dir


def add_examples(list_of_examples, path, example_type=None, skip=None):
    example_path = join(example_dir, path)

    if skip is not None:
        skip = set(skip)

    for f in os.listdir(example_path):
        flags = 0

        if f.startswith(('_', '.')):
            continue
        elif f.endswith(".py"):
            if example_type is not None:
                flags |= example_type
            elif "server" in f or "animate" in f:
                flags |= Flags.server
            else:
                flags |= Flags.file
        elif f.endswith(".ipynb"):
            flags |= Flags.notebook
        else:
            continue

        if "animate" in f:
            flags |= Flags.animated

            if flags & Flags.file:
                raise ValueError("file examples can't be animated")

        if skip and f in skip:
            flags |= Flags.skip

        list_of_examples.append((join(example_path, f), flags))

    return list_of_examples


def get_all_examples():
    # Make a list of all the examples
    list_of_examples = []
    with open(join(dirname(__file__), "examples.yaml"), "r") as f:
        examples = yaml.load(f.read())
    for example in examples:
        path = example["path"]
        try:
            example_type = getattr(Flags, example["type"])
        except KeyError:
            example_type = None

        if not pytest.config.option.all_notebooks:
            skip_status = example.get("skip") or example.get("skip_travis")
        else:
            skip_status = example.get("skip")

        list_of_examples = add_examples(list_of_examples, path, example_type=example_type, skip=skip_status)

    return list_of_examples


def get_file_examples():
    all_examples = get_all_examples()
    file_examples = [example for example, flags in all_examples if flags & Flags.file]
    return file_examples


def get_server_examples():
    all_examples = get_all_examples()
    server_examples = [example for example, flags in all_examples if flags & Flags.server]
    return server_examples


def get_notebook_examples():
    all_examples = get_all_examples()
    notebook_examples = [example for example, flags in all_examples if flags & Flags.notebook]
    return notebook_examples
