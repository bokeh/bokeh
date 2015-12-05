

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
            if attr is Subcommand: continue
            if isinstance(attr, type) and issubclass(attr, Subcommand):
                results.append(attr)

    return results

all = _collect()

del _collect
