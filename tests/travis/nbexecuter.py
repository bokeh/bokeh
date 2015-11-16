"""
Script for running notebooks and output nbconverted html files
"""
import sys

from nbconvert import HTMLExporter
from nbformat import read

from nbconvert.preprocessors import ExecutePreprocessor

def main(ipynb):
    print("running %s" % ipynb)
    nb = read(ipynb, as_version=4)
    ep = ExecutePreprocessor()
    ep.preprocess(nb, {'metadata': {'path': './'}})

    exportHtml = HTMLExporter()
    (body, resources) = exportHtml.from_notebook_node(nb)

    outfile = ipynb + ".html"
    open(outfile, 'w').write(body)
    print("wrote %s" % outfile)

if __name__ == '__main__':
    for ipynb in sys.argv[1:]:
        main(ipynb)
