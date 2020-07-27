# Standard library imports
import os
import platform
import sys
from os.path import abspath, dirname, join

# External imports
import jinja2
import setuptools
import yaml

data = {}
setup_src = open("setup.py").read()
os.environ['CONDA_BUILD_STATE'] = 'RENDER'
def _setup(**kw): data.update(kw)
setuptools.setup = _setup
sys.path.append(abspath(join(dirname(__file__), "..")))
exec(setup_src)

def load_setup_py_data():
    return data

meta_src = jinja2.Template(open("conda.recipe/meta.yaml").read())
meta_src = yaml.load(meta_src.render(load_setup_py_data=load_setup_py_data), Loader=yaml.FullLoader)

section = {
    "build"  : meta_src["requirements"]["build"],
    "deploy" : meta_src["extra"]["deploy"],
    "run"    : meta_src["requirements"]["run"],
    "test"   : meta_src["test"]["requires"],
}

args = sys.argv[1:] or ["build", "deploy", "run", "test"]
spec = []
for name in args:
    spec += section[name]

# bare python unpins python version causing upgrade to latest
if 'python' in spec: spec.remove('python')

# add double quotes to specs for windows, fixes #9065
if "windows" in platform.platform().lower():
    spec = [f'"{s}"' for s in spec]

deps = ""
deps += " ".join(s for s in spec)
deps = deps.replace(' >=', '>=')  # conda syntax doesn't allow spaces b/w pkg name and version spec
deps = deps.replace(' <', '<')
deps = deps.replace(' [unix]', ' ')

print(deps)
