# This is based on sympy's sympy/utilities/tests/test_code_quality.py

from os import walk, sep, pardir
from os.path import split, join, isabs, abspath, relpath, exists, isfile, basename
from glob import glob

import pytest

TOP_PATH = abspath(join(split(__file__)[0], pardir))

MAX_LINE_LENGTH = 160

message_space     = "File contains trailing whitespace: %s, line %s."
message_tabs      = "File contains tabs instead of spaces: %s, line %s."
message_carriage  = "File contains carriage returns at end of line: %s, line %s"
message_eof       = "File does not end with a newline: %s, line %s"
message_multi_bof = "File starts with more than 1 empty line: %s, line %s"
message_multi_eof = "File ends with more than 1 empty line: %s, line %s"
message_too_long  = "File contains a line with over %(n)s characters: %%s, line %%s" % dict(n=MAX_LINE_LENGTH)

def tab_in_leading(s):
    """ Returns True if there are tabs in the leading whitespace of a line,
        including the whitespace of docstring code samples.
    """
    n = len(s) - len(s.lstrip())
    if not s[n:n + 3] in ['...', '>>>']:
        check = s[:n]
    else:
        smore = s[n + 3:]
        check = s[:n] + smore[:len(smore) - len(smore.lstrip())]
    return check.expandtabs() != check

def collect_errors():
    errors = []

    def test_this_file(fname, test_file):
        line = None

        for idx, line in enumerate(test_file):
            line = line.decode('utf-8')
            line_no = idx + 1

            if idx == 0 and len(line.strip()) == 0:
                errors.append((message_multi_bof, fname, line_no))
            if line.endswith(" \n") or line.endswith("\t\n"):
                errors.append((message_space, fname, line_no))
            if line.endswith("\r\n") or line.endswith("\r"):
                errors.append((message_carriage, fname, line_no))
            if tab_in_leading(line):
                errors.append((message_tabs, fname, line_no))
            #if len(line) > MAX_LINE_LENGTH:
            #    errors.append((message_too_long, fname, line_no))

        if line is not None:
            if idx > 0 and len(line.strip()) == 0:
                errors.append((message_multi_eof, fname, line_no))
            if not line.endswith('\n'):
                errors.append((message_eof, fname, line_no))

    def test(fname):
        with open(fname, "Urb") as test_file:
            test_this_file(fname, test_file)

    def canonicalize(path):
        return path.replace('/', sep)

    def check_tree(base_path, patterns, dir_exclusions=None, file_exclusions=None):
        dir_exclusions = dir_exclusions or []
        file_exclusions = file_exclusions or []
        base_path = join(TOP_PATH, canonicalize(base_path))
        dir_exclusions = set([ join(base_path, canonicalize(path)) for path in dir_exclusions ])

        for root, dirs, _ in walk(base_path):
            if root in dir_exclusions:
                del dirs[:]
                continue

            for pattern in patterns:
                files = glob(join(root, pattern))
                check_files(files, file_exclusions)

    def check_files(files, file_exclusions=None):
        file_exclusions = file_exclusions or []
        for fname in files:
            if not isabs(fname):
                fname = join(TOP_PATH, fname)

            if not exists(fname) or not isfile(fname):
                continue

            if basename(fname) in file_exclusions:
                continue

            test(fname)

    check_files(["setup.py"])
    check_tree('bin',          ['*'])
    check_tree('bokeh',        ['*.py', '*.html', '*.js'], ["server/static"], ["__conda_version__.py"])
    check_tree('bokehjs',      ['*.coffee', '*.js', '*.ts', '*.less', '*.css', '*.json'], ['build', 'node_modules', 'src/vendor', 'typings'])
    check_tree('conda.recipe', ['*.py', '*.sh', '*.yaml'])
    check_tree('examples',     ['*.py', '*.ipynb'])
    check_tree('scripts',      ['*.py', '*.sh'])
    check_tree('sphinx',       ['*.rst', '*.py'], ['_build', 'source/docs/gallery'])
    check_tree('tests',        ['*.py', '*.js'])

    return errors

def bad_files():
    return " ".join(sorted(set([ file for (_, file, _) in collect_errors() ])))

@pytest.mark.quality
def test_files():
    def format_message(msg, fname, line_no):
        return msg % (relpath(fname, TOP_PATH), line_no)

    errors = [ format_message(*args) for args in collect_errors() ]

    assert len(errors) == 0, "Code quality issues:\n%s" % "\n".join(errors)

if __name__ == "__main__":
    test_files()
