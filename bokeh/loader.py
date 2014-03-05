from __future__ import print_function
from IPython import get_ipython


def notebook_magic():
    "An alternative way to load the bokeh_magic extension."
    try:
        ip = get_ipython()
        ip.extension_manager.load_extension("bokeh_magic")
    except ImportError:
        print("You need to install the extension first.")

if __name__ == "__main__":
    notebook_magic()