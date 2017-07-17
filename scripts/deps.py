import sys
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
meta_src = yaml.load(meta_src.render(load_setup_py_data=load_setup_py_data))

section = {
    "build": meta_src["requirements"]["build"],
    "run":   meta_src["requirements"]["run"],
    "test":  meta_src["test"]["requires"],
}

spec = []
for name in sys.argv[1:]:
    spec += section[name]

deps = ""
deps += " ".join(s for s in spec)
deps = deps.replace(' >=', '>=')  # conda syntax doesn't allow spaces b/w pkg name and version spec
deps = deps.replace(' <', '<')
deps = deps.replace(' [unix]', ' ')

print(deps)
