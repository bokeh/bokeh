""" Functions for testing what kind of Python or Python environment is in use.

"""

def is_py3():
    """ Test whether we are running Python 3.

    Returns
        True if we are running Python 3, otherwise False

    """
    import sys
    return sys.version_info[0] == 3

def is_pypy():
    """ Test whether we are running PyPy.

    Returns
        True if we are inside PyPy, otherwise False

    """
    import platform
    return platform.python_implementation() == "PyPy"

def is_notebook():
    """ Test whether we are inside an IPython notebook.

    Returns
        True if we are inside a notebook, otherwise False

    """
    try:
        get_ipython()
        return True
    except NameError:
        return False
