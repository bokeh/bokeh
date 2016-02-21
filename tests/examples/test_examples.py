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
    get_example_pngs,
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

from ..constants import base_dir, example_dir, s3


@pytest.mark.examples
def test_server_examples(server_example, bokeh_server, diff):
    # Note this is currently broken - server uses random sessions but we're
    # calling for "default" here - this has been broken for a while.
    # https://github.com/bokeh/bokeh/issues/3897
    url = '%s/?bokeh-session-id=%s' % (bokeh_server, basename(no_ext(server_example)))
    assert _run_example(server_example) == 0, 'Example did not run'
    assert _get_snapshot(server_example, url, 'server', diff), 'Snapshot from phantomjs failed'
    if diff:
        _get_pdiff(server_example, diff)


@pytest.mark.examples
def test_notebook_examples(notebook_example, jupyter_notebook, diff):
    notebook_port = pytest.config.option.notebook_port
    url_path = join(*get_path_parts(abspath(notebook_example)))
    url = 'http://localhost:%d/notebooks/%s' % (notebook_port, url_path)
    assert deal_with_output_cells(notebook_example), 'Notebook failed'
    assert _get_snapshot(notebook_example, url, 'notebook', diff), 'Snapshot from phantomjs failed'
    if diff:
        _get_pdiff(notebook_example, diff)


@pytest.mark.examples
def test_file_examples(file_example, diff):
    html_file = "%s.html" % no_ext(file_example)
    url = 'file://' + html_file
    assert _run_example(file_example) == 0, 'Example did not run'
    assert _get_snapshot(file_example, url, 'file', diff), 'Snapshot from phantomjs failed'
    if diff:
        _get_pdiff(file_example, diff)


def _get_reference_image_from_s3(example, diff):
    example_path = relpath(splitext(example)[0], example_dir)
    ref_loc = join(diff, example_path + ".png")
    ref_url = join(s3, ref_loc)
    response = requests.get(ref_url)

    if not response.ok:
        info("reference image %s doesn't exist" % ref_url)
        return None
    return response.content


def _get_pdiff(example, diff):
    test_png, ref_png, diff_png = get_example_pngs(example, diff)
    retrieved_reference_image = _get_reference_image_from_s3(example, diff)
    if retrieved_reference_image:
        ref_png_path = dirname(ref_png)
        if not exists(ref_png_path):
            os.makedirs(ref_png_path)

        with open(ref_png, "wb") as f:
            f.write(retrieved_reference_image)

        cmd = ["perceptualdiff", "-output", diff_png, test_png, ref_png]
        try:
            proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            code = proc.wait()
        except OSError:
            write("Failed to run: %s" % " ".join(cmd))
            sys.exit(1)

        info("generated: " + test_png)
        info("reference: " + ref_png)

        if code != 0:
            warn("generated and reference images differ")
            warn("diff: " + diff_png)
        else:
            ok("generated and reference images match")


def _get_result_from_phantomjs(example, url, example_type, diff):
    test_png, _, _ = get_example_pngs(example, diff)
    timeout = pytest.config.option.timeout
    phantomjs = pytest.config.option.phantomjs

    cmd = [phantomjs, join(base_dir, "examples", "test.js"), example_type, url, test_png, str(timeout)]
    write("Running command: %s" % " ".join(cmd))

    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
        proc.wait()
    except OSError:
        write("Failed to run: %s" % " ".join(cmd))
        sys.exit(1)

    return json.loads(proc.stdout.read().decode("utf-8"))


def _print_phantomjs_errors(messages):
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


def _get_snapshot(example, url, example_type, diff):
    # Get setup datapoints
    verbose = pytest.config.option.verbose

    result = _get_result_from_phantomjs(example, url, example_type, diff)
    status = result['status']
    errors = result['errors']
    messages = result['messages']
    resources = result['resources']

    if status == 'fail':
        fail("failed to load %s" % url)
        return False
    else:
        if verbose:
            _print_phantomjs_errors(messages)

        # Process resources
        resource_errors = False
        for resource in resources:
            url = resource['url']
            if url.endswith(".png"):
                warn("%s: %s (%s)" % (url, yellow(resource['status']), resource['statusText']))
            else:
                fail("%s: %s (%s)" % (url, red(resource['status']), resource['statusText']))
                resource_errors = True

        # Process errors
        for error in errors:
            write(error['msg'])
            for item in error['trace']:
                write("    %s: %d" % (item['file'], item['line']))

        if resource_errors or errors:
            fail(example)
            return False

    return True


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
        warn("Timeout - Example timed out when attempting to run")
        proc.kill()
        return 0
    finally:
        signal.alarm(0)
