import yaml
import os

from os.path import join, dirname
from ..constants import Flags, example_dir
from ..utils import write, yellow


def add_examples(list_of_examples, path, example_type=None, skip=None):
    example_path = join(example_dir, path)

    if skip is not None:
        skip = set(skip)

    for file in os.listdir(example_path):
        flags = 0

        if file.startswith(('_', '.')):
            continue
        elif file.endswith(".py"):
            if example_type is not None:
                flags |= example_type
            elif "server" in file or "animate" in file:
                flags |= Flags.server
            else:
                flags |= Flags.file
        elif file.endswith(".ipynb"):
            flags |= Flags.notebook
        else:
            continue

        if "animate" in file:
            flags |= Flags.animated

            if flags & Flags.file:
                raise ValueError("file examples can't be animated")

        if skip and file in skip:
            flags |= Flags.skip

        list_of_examples.append((join(example_path, file), flags))

    return list_of_examples


def skip(example, reason):
    write("%s Skipping %s" % (yellow(">>>"), example))
    write("%s because %s" % (yellow("---"), reason))


def get_all_examples(all_notebooks):
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

        if not all_notebooks:
            skip_status = example.get("skip") or example.get("skip_travis")
        else:
            skip_status = example.get("skip")

        list_of_examples = add_examples(list_of_examples, path, example_type=example_type, skip=skip_status)

    return list_of_examples


def get_file_examples(all_notebooks):
    all_examples = get_all_examples(all_notebooks)

    # Remove examples for skipping
    file_examples = []
    for example, flags in all_examples:
        if flags & Flags.server:
            skip(example, "skip server example")
        elif flags & Flags.notebook:
            skip(example, "skip notebook example")
        elif flags & Flags.skip:
            skip(example, "manual skip")
        else:
            file_examples.append(example)

    return file_examples


def get_server_examples(all_notebooks):
    all_examples = get_all_examples(all_notebooks)

    # Remove examples for skipping
    server_examples = []
    for example, flags in all_examples:
        if flags & Flags.file:
            skip(example, "skip file example")
        elif flags & Flags.notebook:
            skip(example, "skip notebook example")
        elif flags & Flags.skip:
            skip(example, "manual skip")
        else:
            server_examples.append(example)

    return server_examples


def get_notebook_examples(all_notebooks):
    all_examples = get_all_examples(all_notebooks)

    # Remove examples for skipping
    notebook_examples = []
    for example, flags in all_examples:
        if flags & Flags.file:
            skip(example, "skip file example")
        elif flags & Flags.server:
            skip(example, "skip server example")
        elif flags & Flags.skip:
            skip(example, "manual skip")
        else:
            notebook_examples.append(example)

    return notebook_examples
