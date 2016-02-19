from __future__ import print_function

import os
import signal
import subprocess
import sys


from os.path import dirname, split

from ..utils import write, warn


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


def run_example(example_path):

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
