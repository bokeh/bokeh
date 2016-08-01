import ast
import yaml


def output_classes(file_path, module_name):
    with open(file_path, "r") as f:
        source = f.read()
        p = ast.parse(source)
        classes = [node for node in ast.walk(p) if isinstance(node, ast.ClassDef)]
        class_defs = {module_name: []}
        for x in classes:
            methods = {x.name: {"methods": []}}
            functions = []
            for y in x.body:
                # if type(y) == ast.FunctionDef and not y.name.startswith("_", 0, 1):
                if type(y) == ast.FunctionDef:
                    functions.append(y.name)
            methods[x.name]["methods"] = functions
            class_defs[module_name].append(methods)
    with open("classes.yaml", "w") as stream:
        yaml.dump(class_defs, stream, default_flow_style=False)

output_classes("../bokeh/charts/glyphs.py", "glyphs")
