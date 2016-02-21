import boto
import json
import os
import pytest

from boto.s3.key import Key as S3Key
from boto.exception import NoAuthHandlerFound
from os.path import split, splitext, abspath, isfile, join, relpath

from ..utils import warn, fail, write, green
from ..constants import __version__, s3, s3_bucket, example_dir

from .collect_examples import get_all_examples


def no_ext(path):
    return splitext(abspath(path))[0]


def get_example_pngs(example_file):
    diff = pytest.config.option.diff
    example_path = no_ext(example_file)
    test_png = "%s-%s.png" % (example_path, __version__)
    if diff:
        ref_png = "%s-%s.png" % (example_path, diff)
        diff_png = "%s-%s-%s-diff.png" % (example_path, __version__, diff)
    else:
        ref_png = None
        diff_png = None
    return (test_png, ref_png, diff_png)


def upload_example_pngs_to_s3():
    # Test connection
    try:
        conn = boto.connect_s3()
        bucket = conn.get_bucket(s3_bucket)
        upload = True
    except NoAuthHandlerFound:
        fail("Upload was requested but could not connect to S3.")
        upload = False

    if upload is True:
        all_examples = get_all_examples()
        for example, _ in all_examples:
            test_png, _, diff_png = get_example_pngs(example)
            uploads = [
                {'path': test_png, 'diff': False},
                {'path': diff_png, 'diff': True},
            ]
            for image in uploads:
                path = image['path']
                is_diff = image['diff']
                if path:
                    if isfile(path):
                        example_path = relpath(no_ext(example), example_dir)
                        s3_path = join(__version__, example_path)
                        if is_diff:
                            s3_png_file = s3_path + "-diff.png"
                        else:
                            s3_png_file = s3_path + ".png"

                        write("%s Uploading image to S3 to %s/%s" % (green(">>>"), s3, s3_png_file))
                        key = S3Key(bucket, s3_png_file)
                        key.set_metadata("Content-Type", "image/png")
                        with open(path, 'r') as f:
                            png = f.read()
                        key.set_contents_from_string(png, policy="public-read")


def deal_with_output_cells(example):
    output_cells = pytest.config.option.output_cells

    def load_nb(example):
        with open(example, "r") as f:
            return json.load(f)

    def save_nb(example, nb):
        with open(example, "w") as f:
            json.dump(nb, f, ident=2, sort_keys=True)

    def bad_code_cells(nb):
        for worksheet in nb.get("worksheets", []):
            for cell in worksheet.get("cells", []):
                if cell.get("cell_type") == "code":
                    outputs = cell.get("outputs")

                    if isinstance(outputs, list) and len(outputs) > 0:
                        yield cell, outputs

    def complain(fn):
        fn("%s notebook contains output cells" % example)

    if output_cells == 'complain':
        nb = load_nb(example)

        for _, _ in bad_code_cells(nb):
            complain(fail)
            return False
    elif output_cells == 'remove':
        nb = load_nb(example)
        changes = False

        for cell, _ in bad_code_cells(nb):
            cell["outputs"] = []
            changes = True

        if changes:
            complain(warn)
            save_nb(example, nb)

    return True


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


def human_bytes(n):
    """
    Return the number of bytes n in more human readable form.
    """
    if n < 1024:
        return '%d B' % n
    k = n / 1024
    if k < 1024:
        return '%d KB' % round(k)
    m = k / 1024
    if m < 1024:
        return '%.1f MB' % m
    g = m / 1024
    return '%.2f GB' % g
