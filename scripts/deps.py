import os
from os.path import abspath, dirname, join
import platform
import sys

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

specs = []
for name in sys.argv[1:]:
    specs += section[name]

# bare python unpins python version causing upgrade to latest
specs = [ spec for spec in specs if spec.split(" ")[0] != "python" ]

# add double quotes to specs for windows, fixes #9065
if "windows" in platform.platform().lower():
    specs = ['"{}"'.format(spec) for spec in specs]

deps = ""
deps += " ".join(specs)
deps = deps.replace(' >=', '>=')  # conda syntax doesn't allow spaces b/w pkg name and version spec
deps = deps.replace(' <', '<')
deps = deps.replace(' [unix]', ' ')

print(deps)
