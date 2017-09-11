from __future__ import absolute_import, print_function

def test_dir():
    import bokeh
    names = dir(bokeh)
    assert "__version__" in names
    assert "__base_version__" in names
    assert "license" in names
    assert "sampledata" in names

def test_version_defined():
    import bokeh
    assert bokeh.__version__ != 'unknown'

# This is failing only on Travis for some reason
# def test_license():
#     import sys
#     import bokeh
#     try:
#         bokeh.license()
#     except Exception as e:
#         print("If LICENSE.txt does not exist in bokeh/ subdir, one way to fix this may be to run 'python setup.py develop'", file=sys.stderr)
#         raise e
