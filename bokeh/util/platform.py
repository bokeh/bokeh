""" Functions for testing what kind of Python or Python environment is in use.

"""

def is_py3():
    """ Test whether we are running Python 3.

    Returns
        True if we are running Python 3, otherwise False

    """
    import sys
    return sys.version_info[0] == 3
