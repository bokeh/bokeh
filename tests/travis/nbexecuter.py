"""
Script for running notebooks and output nbconverted html files
"""
import os
import sys
from traitlets import Unicode
from traitlets.config import get_config

from nbconvert import HTMLExporter
from nbformat import read

from nbconvert.preprocessors import ExecutePreprocessor


class BokehExecutePreprocessor(ExecutePreprocessor):
    """
    Executes all the cells in a notebook, with kernel_name trailet available.
    """

    kernel_name = Unicode("python", config=True,
        help="The kernel to execute the cells with."
    )

    def preprocess(self, nb, resources):
        path = resources.get('metadata', {}).get('path', '')
        if path == '':
            path = None

        from jupyter_client.manager import start_new_kernel
        if not self.kernel_name:
            kernel_name = nb.metadata.get('kernelspec', {}).get('name', 'python')
        else:
            kernel_name = self.kernel_name
        self.log.info("Executing notebook with kernel: %s" % kernel_name)
        self.km, self.kc = start_new_kernel(
            kernel_name=kernel_name,
            extra_arguments=self.extra_arguments,
            stderr=open(os.devnull, 'w'),
            cwd=path)
        self.kc.allow_stdin = False

        try:
            nb, resources = super(ExecutePreprocessor, self).preprocess(nb, resources)
        finally:
            self.kc.stop_channels()
            self.km.shutdown_kernel(now=True)

        return nb, resources


def main(ipynb, kernel_name):
    print("running %s" % ipynb)
    nb = read(ipynb, as_version=4)

    config = get_config()
    config.BokehExecutePreprocessor.kernel_name = kernel_name
    config.BokehExecutePreprocessor.allow_errors = True
    print(config)
    ep = BokehExecutePreprocessor(config=config)
    ep.preprocess(nb, {'metadata': {'path': './'}})

    exportHtml = HTMLExporter()
    (body, resources) = exportHtml.from_notebook_node(nb)

    outfile = ipynb + ".html"
    open(outfile, 'w').write(body)
    print("wrote %s" % outfile)

if __name__ == '__main__':
    params = sys.argv[1:]
    if len(params) > 2:
        print("Provide the ipynb as the first param and the kernel_name as the \
              seconda one")
    else:
        main(params[0], params[1])
