import yaml
import os

from os.path import join, dirname, abspath, pardir

base_dir = dirname(__file__)
example_dir = abspath(join(base_dir, pardir, pardir, 'examples'))


class Flags(object):
    file = 1 << 1
    server = 1 << 2
    notebook = 1 << 3
    animated = 1 << 4
    skip = 1 << 5


def example_type(flags):
    if flags & Flags.file:
        return "file"
    elif flags & Flags.server:
        return "server"
    elif flags & Flags.notebook:
        return "notebook"


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

        skip_status = example.get("skip")

        list_of_examples = add_examples(list_of_examples, path, example_type=example_type, skip=skip_status)

    return list_of_examples


def get_file_examples():
    all_examples = get_all_examples()
    file_examples = [example for example, flags in all_examples if (flags & Flags.file) and not (flags & Flags.skip)]
    return file_examples


def get_server_examples():
    all_examples = get_all_examples()
    server_examples = [example for example, flags in all_examples if (flags & Flags.server) and not (flags & Flags.skip)]
    return server_examples


def get_notebook_examples():
    all_examples = get_all_examples()
    notebook_examples = [example for example, flags in all_examples if (flags & Flags.notebook) and not (flags & Flags.skip)]
    return notebook_examples
