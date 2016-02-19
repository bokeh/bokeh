from __future__ import print_function

import os
import signal
import subprocess
import sys
import yaml


from os.path import dirname, split, join, abspath, pardir

from ..utils import write, warn

base_dir = dirname(__file__)
example_dir = abspath(join(base_dir, pardir, pardir, 'examples'))


def get_version_from_git(ref=None):
    cmd = ["git", "describe", "--tags", "--always"]

    if ref is not None:
        cmd.append(ref)

    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
        code = proc.wait()
    except OSError:
        write("Failed to run: %s" % " ".join(cmd))
        sys.exit(1)

    if code != 0:
        write("Failed to get version for %s" % ref)
        sys.exit(1)

    version = proc.stdout.read().decode('utf-8').strip()

    try:
        tag, _, sha1 = version.split("-")
    except ValueError:
        return version
    else:
        return "%s-%s" % (tag, sha1[1:])


def get_path_parts(path):
    parts = []
    while True:
        newpath, tail = split(path)
        parts.append(tail)
        path = newpath
        if tail == 'examples':
            break
    parts.reverse()
    return parts


class Timeout(Exception):
    pass


def make_env():
    env = os.environ.copy()
    env['BOKEH_RESOURCES'] = 'relative'
    env['BOKEH_BROWSER'] = 'none'
    return env


def run_example(example_tuple, example_dir):
    example_path = join(example_dir, example_tuple[0])
    example_type = example_tuple[1]

    code = """\
filename = '%s'

import random
random.seed(1)

import numpy as np
np.random.seed(1)

with open(filename, 'rb') as example:
    exec(compile(example.read(), filename, 'exec'))
""" % example_path

    cmd = ["python", "-c", code]
    cwd = dirname(example_path)
    env = make_env()

    def alarm_handler(sig, frame):
        raise Timeout

    signal.signal(signal.SIGALRM, alarm_handler)
    signal.alarm(10)

    try:
        proc = subprocess.Popen(cmd, cwd=cwd, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        try:
            def dump(f):
                for line in iter(f.readline, b""):
                    write(line.decode("utf-8"), end="")

            dump(proc.stdout)
            dump(proc.stderr)

            return proc.wait()
        except KeyboardInterrupt:
            proc.kill()
            raise
    except Timeout:
        warn("Timeout")
        proc.kill()
        return 0
    finally:
        signal.alarm(0)


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


def add_examples(list_of_examples, example_dir, examples_dir, example_type=None, skip=None):
    examples_path = join(example_dir, examples_dir)

    if skip is not None:
        skip = set(skip)

    for file in os.listdir(examples_path):
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

        list_of_examples.append((join(examples_path, file), flags))

    return list_of_examples


def detect_examples(example_dir, all_notebooks):
    with open(join(dirname(__file__), "test.yaml"), "r") as f:
        examples = yaml.load(f.read())

    list_of_examples = []
    for example in examples:
        path = example["path"]

        try:
            example_type = getattr(Flags, example["type"])
        except KeyError:
            example_type = None

        if not all_notebooks:
            skip = example.get("skip") or example.get("skip_travis")
        else:
            skip = example.get("skip")

        list_of_examples = add_examples(list_of_examples, example_dir, path, example_type=example_type, skip=skip)

    return list_of_examples
