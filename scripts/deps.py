import sys
import platform
import jinja2
import yaml


def load_setup_py_data():
    import os
    import setuptools
    os.environ['CONDA_BUILD_STATE'] = 'RENDER'
    data = {}

    def _setup(**kw): data.update(kw)
    setuptools.setup = _setup
    return data

meta_src = jinja2.Template(open("conda.recipe/meta.yaml").read())
try:
    meta_src = yaml.load(meta_src.render(load_setup_py_data=load_setup_py_data),
                         Loader=yaml.FullLoader)
except AttributeError as e:
    # Loader=yaml.FullLoader added in pyyaml 5.1 because of:
    # https://github.com/yaml/pyyaml/wiki/PyYAML-yaml.load(input)-Deprecation
    # isn't available on conda for python=3.5
    # fall back to calling without loader if it isn't available
    if 'FullLoader' in repr(e):
        meta_src = yaml.load(meta_src.render(load_setup_py_data=load_setup_py_data))
    else:
        raise

section = {
    "build"  : meta_src["requirements"]["build"],
    "deploy" : meta_src["extra"]["deploy"],
    "run"    : meta_src["requirements"]["run"],
    "test"   : meta_src["test"]["requires"],
}

spec = []
for name in sys.argv[1:]:
    spec += section[name]

# bare python unpins python version causing upgrade to latest
if 'python' in spec: spec.remove('python')

# add double quotes to specs for windows, fixes #9065
if "windows" in platform.platform().lower():
    spec = ['"{}"'.format(s) for s in spec]

deps = ""
deps += " ".join(s for s in spec)
deps = deps.replace(' >=', '>=')  # conda syntax doesn't allow spaces b/w pkg name and version spec
deps = deps.replace(' <', '<')
deps = deps.replace(' [unix]', ' ')

print(deps)
