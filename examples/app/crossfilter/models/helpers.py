import os

def load_component(file_path):
    dirname, _ = os.path.split(os.path.realpath(__file__))
    component_path = os.path.join(dirname, file_path)
    with open(component_path) as f:
        return f.read()
