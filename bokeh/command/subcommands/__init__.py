''' Subcommands for the Bokeh command class

'''

def _collect():
    from importlib import import_module
    from os import listdir
    from os.path import dirname
    from ..subcommand import Subcommand

    results = []

    for file in listdir(dirname(__file__)):

        if not file.endswith(".py") or file in ("__init__.py", "__main__.py"):
            continue

        modname = file.rstrip(".py")
        mod = import_module("." + modname, __package__)

        for name in dir(mod):
            attr = getattr(mod, name)
            if isinstance(attr, type) and issubclass(attr, Subcommand):
                if not hasattr(attr, 'name'): continue # excludes abstract bases
                results.append(attr)

    results = sorted(results, key=lambda attr: attr.name)

    return results

all = _collect()

del _collect
