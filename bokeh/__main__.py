import sys

from bokeh.command.bootstrap import main as _main

def main(args=None):
    """The main"""
    if args is None:
        args = sys.argv[1:]

    _main(sys.argv)

if __name__ == "__main__":
    main()
