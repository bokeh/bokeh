import json
import os
import pytest
import requests
import subprocess
import sys
import signal

from os.path import dirname, abspath, join, splitext, relpath, exists, basename

from .utils import (
    deal_with_output_cells,
    get_path_parts,
    make_env,
    no_ext,
    Timeout,
)

from ..utils import (
    fail,
    info,
    ok,
    red,
    warn,
    write,
    yellow,
)

from ..constants import base_dir, example_dir, __version__, s3


@pytest.mark.examples_new
def test_server_examples(server_example, bokeh_server, bokeh_port, timeout, verbose, diff, phantomjs):
    server_url = 'http://localhost:%d/?bokeh-session-id=%s'
    url = server_url % (bokeh_port, basename(no_ext(server_example)))
    if _run_example(server_example) == 0:
        assert _test_example(server_example, url, 'server', timeout, verbose, diff, phantomjs)
    else:
        assert False


@pytest.mark.examples_new
def test_notebook_examples(notebook_example, jupyter_notebook, output_cells, notebook_port, timeout, verbose, diff, phantomjs):
    url_path = join(*get_path_parts(abspath(notebook_example)))
    url = 'http://localhost:%d/notebooks/%s' % (notebook_port, url_path)
    assert deal_with_output_cells(notebook_example, output_cells)
    assert _test_example(notebook_example, url, 'notebook', timeout, verbose, diff, phantomjs)


@pytest.mark.examples_new
def test_file_examples(file_example, timeout, verbose, diff, phantomjs):
    html_file = "%s.html" % no_ext(file_example)
    url = 'file://' + html_file
    if _run_example(file_example) == 0:
        assert _test_example(file_example, url, 'file', timeout, verbose, diff, phantomjs)
    else:
        assert False


def _test_example(example, url, example_type, timeout, verbose, diff, phantomjs):
    png_file = "%s-%s.png" % (no_ext(example), __version__)
    cmd = [phantomjs, join(base_dir, "examples", "test.js"), example_type, url, png_file, str(timeout)]
    write("Running command: %s" % " ".join(cmd))

    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
        code = proc.wait()
    except OSError:
        write("Failed to run: %s" % " ".join(cmd))
        sys.exit(1)

    result = json.loads(proc.stdout.read().decode("utf-8"))

    status = result['status']
    errors = result['errors']
    messages = result['messages']
    resources = result['resources']

    if status == 'fail':
        fail("failed to load %s" % url)
    else:
        if verbose:
            for message in messages:
                msg = message['msg']
                line = message.get('line')
                source = message.get('source')

                if source is None:
                    write(msg)
                elif line is None:
                    write("%s: %s" % (source, msg))
                else:
                    write("%s:%s: %s" % (source, line, msg))

        resource_errors = False

        for resource in resources:
            url = resource['url']

            if url.endswith(".png"):
                fn, color = warn, yellow
            else:
                fn, color, resource_errors = fail, red, True

            fn("%s: %s (%s)" % (url, color(resource['status']), resource['statusText']))

        for error in errors:
            write(error['msg'])

            for item in error['trace']:
                write("    %s: %d" % (item['file'], item['line']))

        if resource_errors or errors:
            fail(example)
        else:
            if diff:
                example_path = relpath(splitext(example)[0], example_dir)
                ref_loc = join(diff, example_path + ".png")
                ref_url = join(s3, ref_loc)
                response = requests.get(ref_url)

                if not response.ok:
                    info("referece image %s doesn't exist" % ref_url)
                else:
                    ref_png_file = abspath(join(dirname(__file__), "refs", ref_loc))
                    diff_png_file = splitext(png_file)[0] + "-diff.png"

                    ref_png_path = dirname(ref_png_file)
                    if not exists(ref_png_path):
                        os.makedirs(ref_png_path)

                    with open(ref_png_file, "wb") as f:
                        f.write(response.content)

                    cmd = ["perceptualdiff", "-output", diff_png_file, png_file, ref_png_file]

                    try:
                        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                        code = proc.wait()
                    except OSError:
                        write("Failed to run: %s" % " ".join(cmd))
                        sys.exit(1)

                    if code != 0:
                        warn("generated and reference images differ")
                        warn("generated: " + png_file)
                        warn("reference: " + ref_png_file)
                        warn("diff: " + diff_png_file)

            ok(example)
            return True

    return False


def _run_example(example):
    example_path = join(example_dir, example)

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
