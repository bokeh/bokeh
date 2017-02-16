from __future__ import absolute_import, print_function

import json
import pytest

from tests.plugins.utils import warn, fail

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
