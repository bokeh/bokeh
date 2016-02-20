from .collect_examples import get_file_examples, get_server_examples, get_notebook_examples


def pytest_generate_tests(metafunc):
    all_notebooks = metafunc.config.option.all_notebooks
    if 'file_example' in metafunc.fixturenames:
        examples = get_file_examples(all_notebooks)
        metafunc.parametrize('file_example', examples)
    if 'server_example' in metafunc.fixturenames:
        examples = get_server_examples(all_notebooks)
        metafunc.parametrize('server_example', examples)
    if 'notebook_example' in metafunc.fixturenames:
        examples = get_notebook_examples(all_notebooks)
        metafunc.parametrize('notebook_example', examples)
