pytest_plugins = (
    "bokeh._testing.plugins.implicit_mark",
    "bokeh._testing.plugins.pandas",
)

from bokeh._testing.util.git import version_from_git

# Unfortunately these seem to all need to be centrally defined at the top level
def pytest_addoption(parser):
    parser.addoption(
        "--upload", dest="upload", action="store_true", default=False, help="upload test artefacts to S3"
    )
    parser.addoption(
        "--examples-log-file", dest="log_file", metavar="path", action="store", default='examples.log', help="where to write the complete log"
    )



    parser.addoption(
        "--bokeh-port", dest="bokeh_port", type=int, default=5006, help="port on which Bokeh server resides"
    )



    parser.addoption(
        "--output-cells", type=str, choices=['complain', 'remove', 'ignore'], default='complain',
        help="what to do with notebooks' output cells")
    parser.addoption(
        "--report-path", action='store', dest='report_path', metavar='path', default='report.html',
        help='create examples html report file at given path.')
    parser.addoption(
        "--diff-ref", type=version_from_git, default="master@{upstream}",
        help="compare generated images against this ref")
    parser.addoption(
        "--incremental", action="store_true", default=False,
        help="write report after each example")
    parser.addoption(
        "--no-js", action="store_true", default=False,
        help="only run python code and skip js and image diff")



    parser.addoption(
        "--notebook-port", type=int, default=6007, help="port on which Jupyter Notebook server resides"
    )



    parser.addoption(
        "--set-new-base-screenshot", dest="set_new_base_screenshot", action="store_true", default=False,
        help="Use to set a new screenshot for imagediff testing. Be sure to only set for the tests you want by usign the -k pytest option to select your test.")
