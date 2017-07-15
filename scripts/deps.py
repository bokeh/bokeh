import jinja2
import yaml

# section = {
#     'build': '["requirements"]["build"]',
#     'run':   '["requirements"]["run"]',
#     'test':  '["test"]["requires"]',
# }


def load_setup_py_data():
    import os
    import setuptools
    os.environ['CONDA_BUILD_STATE'] = 'RENDER'
    data = {}

    def _setup(**kw): data.update(kw)
    setuptools.setup = _setup
    return data

meta = jinja2.Template(open("conda.recipe/meta.yaml").read())
out = meta.render(load_setup_py_data=load_setup_py_data)
yam = yaml.load(out)

deps = ""
_list = yam["requirements"]["build"] + yam["requirements"]["run"] + yam["test"]["requires"]
deps += " ".join(s for s in _list)
print(deps)
