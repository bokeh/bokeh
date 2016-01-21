import tempfile
import shutil
import os

class WorkingDir(object):
    def __init__(self, pwd):
        self._new = pwd
        self._old = os.getcwd()

    def __exit__(self, type, value, traceback):
        os.chdir(self._old)

    def __enter__(self):
        os.chdir(self._new)
        return self._new

class TmpDir(object):
    def __init__(self, prefix):
        self._dir = tempfile.mkdtemp(prefix=prefix)

    def __exit__(self, type, value, traceback):
        shutil.rmtree(path=self._dir)

    def __enter__(self):
        return self._dir

def with_directory_contents(contents, func):
    with (TmpDir(prefix="bokeh-subcommand-tests")) as dirname:
        for filename, file_content in contents.items():
            f = open(os.path.join(dirname, filename), 'w')
            f.write(file_content)
            f.flush()
        func(dirname)


basic_scatter_script = """
import numpy as np
from bokeh.plotting import figure
N = 5
x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)
p1 = figure()
p1.scatter(x,y, color="#FF00FF")
"""
