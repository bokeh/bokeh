import json
import pytest

from os.path import splitext, abspath, isfile, join, relpath

from tests.plugins.utils import warn, fail, write, green
from tests.plugins.upload_to_s3 import upload_file_to_s3
from tests.plugins.constants import __version__, job_id

from .collect_examples import get_all_examples, example_dir


def no_ext(path):
    return splitext(abspath(path))[0]


def get_example_pngs(example_file, diff):
    example_path = no_ext(example_file)
    test_png = "%s-%s-%s.png" % (example_path, __version__, job_id)
    if diff:
        ref_png = "%s-%s-%s.png" % (example_path, diff, job_id)
        diff_png = "%s-%s-%s-diff-%s.png" % (example_path, __version__, diff, job_id)
    else:
        ref_png = None
        diff_png = None
    return (test_png, ref_png, diff_png)


def upload_example_pngs_to_s3(diff):

    all_examples = get_all_examples()
    for example, _ in all_examples:
        example_path = relpath(no_ext(example), example_dir)
        s3_path = join(__version__, example_path)
        test_png, _, diff_png = get_example_pngs(example, diff)
        if test_png:
            if isfile(test_png):
                s3_png_file = s3_path + ".png"
                write("%s Uploading image to S3 to %s" % (green(">>>"), s3_png_file))
                upload_file_to_s3(test_png, s3_png_file, "image/png")
        if diff_png:
            if isfile(diff_png):
                s3_png_file = s3_path + diff + "-diff.png"
                write("%s Uploading image to S3 to %s" % (green(">>>"), s3_png_file))
                upload_file_to_s3(diff_png, s3_png_file, "image/png")


def deal_with_output_cells(example):
    output_cells = pytest.config.option.output_cells
    assert output_cells is not None

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
