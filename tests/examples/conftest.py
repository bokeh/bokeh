from .collect_examples import (
    get_file_examples,
    get_server_examples,
    get_notebook_examples,
)


def pytest_generate_tests(metafunc):
    if 'file_example' in metafunc.fixturenames:
        examples = get_file_examples()
        metafunc.parametrize('file_example', examples)
    if 'server_example' in metafunc.fixturenames:
        examples = get_server_examples()
        metafunc.parametrize('server_example', examples)
    if 'notebook_example' in metafunc.fixturenames:
        examples = get_notebook_examples()
        metafunc.parametrize('notebook_example', examples)


def pytest_addoption(parser):
    parser.addoption(
        "--all-notebooks", action="store_true", default=False, help="test all the notebooks inside examples/plotting/notebook folder."
    )
    parser.addoption(
        "--output-cells", type=str, choices=['complain', 'remove', 'ignore'], default='complain', help="what to do with notebooks' output cells"
    )
