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
