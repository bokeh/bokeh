import os
import platform
import sys
import jinja2
import setuptools
import yaml
from unittest import mock
from functools import reduce
from operator import add
from pathlib import Path


def load_setup_py_data():
    """Retrieve all keyword arguments of setup function from setup.py to access
    `install_requires` and others which are mandatory to evaluate necessary
    dependencies.

    """

    os.environ['CONDA_BUILD_STATE'] = 'RENDER'

    # make setup.py available for import
    import_path = Path(__file__).parent.parent.absolute()
    sys.path.append(str(import_path))

    # import setup.py and get keyword args
    with mock.patch.object(setuptools, 'setup') as mock_setup:
        import setup

    return mock_setup.call_args[1]


def get_meta_src():
    """Read conda meta.yaml to access all available dependency information.

    """

    meta_src = jinja2.Template(open("conda.recipe/meta.yaml").read())
    rendered = meta_src.render(load_setup_py_data=load_setup_py_data)

    try:
        meta_src = yaml.load(rendered, Loader=yaml.FullLoader)

    except AttributeError as e:
        # Loader=yaml.FullLoader added in pyyaml 5.1 because of:
        # https://github.com/yaml/pyyaml/wiki/PyYAML-yaml.load(input)-Deprecation
        # isn't available on conda for python=3.5
        # fall back to calling without loader if it isn't available
        if 'FullLoader' in repr(e):
            meta_src = yaml.load(rendered)
        else:
            raise

    finally:
        return meta_src


def get_dependency_sections():
    """Collect and compose dependency information into different sections
    regarding their intended use case (build, deploy, run, test, all).

    """

    meta_src = get_meta_src()

    section = {
        "build"  : meta_src["requirements"]["build"],
        "deploy" : meta_src["extra"]["deploy"],
        "run"    : meta_src["requirements"]["run"],
        "test"   : meta_src["test"]["requires"],
    }

    section["all"] = reduce(add, section.values())

    return section


def get_package_list(sections=None):
    """Retrieve all dependencies from given section identifiers.

    """

    section = get_dependency_sections()
    sections = sections or sys.argv[1:]

    spec = []
    for name in sections:
        spec += section[name]

    # bare python unpins python version causing upgrade to latest
    if 'python' in spec: spec.remove('python')

    # add double quotes to specs for windows, fixes #9065
    if "windows" in platform.platform().lower():
        spec = ['"{}"'.format(s) for s in spec]

    def sanitize(dep):
        return dep.replace(' >=', '>=')\
                  .replace(' <', '<')\
                  .replace(' [unix]', ' ')

    return [sanitize(dep) for dep in spec]


if __name__ == "__main__":
    print(" ".join(get_package_list()))
