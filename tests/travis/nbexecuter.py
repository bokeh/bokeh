"""
Script for running notebooks and output nbconverted html files from the
command line, by @damianavila
To be replaced by IPython.nbconvert execute preprocessor in the future:
https://github.com/ipython/ipython/pull/5639
"""
from __future__ import print_function

import io
import os
import sys

from six import iteritems

try:
    from queue import Empty
except ImportError:
    from Queue import Empty

from IPython.kernel import KernelManager
from IPython.nbformat.current import read, NotebookNode
from IPython.nbconvert.exporters import HTMLExporter

from bokeh.utils import encode_utf8


def run_cell(shell, iopub, cell):
    shell.execute(cell.input)
    shell.get_msg(timeout=20)
    outs = []

    while True:
        try:
            msg = iopub.get_msg(timeout=0.2)
        except Empty:
            break

        msg_type = msg['msg_type']

        if msg_type in ('status', 'pyin'):
            continue
        elif msg_type == 'clear_output':
            outs = []
            continue

        content = msg['content']
        out = NotebookNode(output_type=msg_type)

        if msg_type == 'stream':
            out.stream = content['name']
            out.text = content['data']
        elif msg_type in ('display_data', 'pyout'):
            for mime, data in iteritems(content['data']):
                attr = mime.split('/')[-1].lower()
                # this gets most right, but fix svg+html, plain
                attr = attr.replace('+xml', '').replace('plain', 'text')
                setattr(out, attr, data)
            if msg_type == 'pyout':
                out.prompt_number = content['execution_count']
        elif msg_type == 'pyerr':
            out.ename = content['ename']
            out.evalue = content['evalue']
            out.traceback = content['traceback']
        else:
            print("unhandled iopub msg:", msg_type)

        outs.append(out)
    return outs


def test_notebook(nb):
    km = KernelManager()
    km.start_kernel(extra_arguments=[], stderr=open(os.devnull, 'w'))
    kc = km.client()
    kc.start_channels()
    iopub = kc.iopub_channel
    shell = kc.shell_channel
    shell.kernel_info()

    while True:
        try:
            kc.iopub_channel.get_msg(timeout=1)
        except Empty:
            break

    errors = 0
    cells = 0
    for ws in nb.worksheets:
        for cell in ws.cells:
            if cell.cell_type != 'code':
                continue
            cells += 1
            try:
                outs = run_cell(shell, iopub, cell)
            except Exception as e:
                print("failed to run cell:", repr(e))
                print(cell.input)
                errors += 1
                continue
            cell.outputs = outs

    if errors:
        print("    %3i cells failed to complete" % errors)
    if cells:
        print("%i code cells from notebook %s" % (cells, nb.metadata.name))

    kc.stop_channels()
    km.shutdown_kernel()
    del km


def main(ipynb):
    print("running %s" % ipynb)
    with io.open(ipynb, encoding='utf8') as f:
        nb = read(f, 'json')
    test_notebook(nb)
    base, ext = os.path.splitext(ipynb)

    outfile = base + ".html"

    exportHtml = HTMLExporter()
    (body, resources) = exportHtml.from_notebook_node(nb)

    open(outfile, 'w').write(encode_utf8(body))
    print("wrote %s" % outfile)

if __name__ == '__main__':
    for ipynb in sys.argv[1:]:
        main(ipynb)