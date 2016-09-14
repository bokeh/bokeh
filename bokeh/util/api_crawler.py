from __future__ import print_function
import ast, os, copy, sys

__all__ = ["api_crawler", "differ"]


if sys.version_info > (3, 0):
    arg_name = "arg"
else:
    arg_name = "id"


class APICrawler(object):
    """
    Api Crawler: Given a directory, it will use AST to crawl through each of the
    File and produce AST nodes, which can then be parsed into a representation
    of the structure of that file. The execution...
    """

    # Exclude these folders from search.
    exclude = ("tests", "static", "sampledata", "mplexplorer")


    # Point the crawler at this directory.
    def __init__(self, directory):
        self.directory = directory

    def is_public(self, name):
        # Determines whether a given function or class is public or private. Names
        # with underscores are not allowed unless the name is "__init__"
        return not name.startswith("_", 0, 1) or (name.startswith("__") and
                name.endswith("__"))

    def is_toplevel_function(self, ast_node):
        # Checks whether a node is a top level function. Checks whether it is an AST
        # function instance. Also uses column offset, i.e. whether the function has
        # any tabs or spaces before it.
        return isinstance(ast_node, ast.FunctionDef) and ast_node.col_offset == 0

    def is_class(self, ast_node):
        # Checks whether a node is an instance of an ast Class
        return isinstance(ast_node, ast.ClassDef)

    def get_classes(self, source):
        # For a given source, walk through the file looking for classes, and assign
        # the associated methods. Pass them as a dictionary containing each class
        # and its methods.
        parsed = ast.parse(source)
        classes = [node for node in ast.walk(parsed) if self.is_class(node) and self.is_public(node.name)]
        class_defs = {}
        for x in classes:
            class_defs[x.name] = {}
            methods = [node for node in x.body if isinstance(node, ast.FunctionDef) and self.is_public(node.name)]
            methods = self.get_full_signature(methods)
            class_defs[x.name]["methods"] = methods
        return class_defs

    def get_functions(self, source):
        # For a given source, look for functions and return those functions as a list.
        parsed = ast.parse(source)
        functions = [node for node in ast.walk(parsed) if self.is_toplevel_function(node) and self.is_public(node.name)]
        functions = self.get_full_signature(functions)
        return functions

    def get_full_signature(self, functions):
        full_signature = {}
        for x in functions:
            full_signature.update(self.get_signature(x))
        return full_signature

    def get_signature(self, function):
        return {
            function.name: self.get_arguments(function)
        }

    def get_arguments(self, function):
        arguments = function.args.args
        defaults = function.args.defaults
        if defaults:
            argument_names = [getattr(x, arg_name) for x in arguments[:len(arguments) - len(defaults)]]
            default_names = [getattr(x, arg_name) for x in arguments[len(arguments) - len(defaults):]]
            for x in range(len(default_names)):
                try:
                    argument_names.append({default_names[x]: ast.literal_eval(defaults[x])})
                except ValueError:
                    if isinstance(defaults[x], ast.Lambda):
                        argument_names.append({default_names[x]: "type: Lambda"})
                    elif isinstance(defaults[x], ast.Call):
                        argument_names.append({default_names[x]: "type: Call"})
                    elif isinstance(defaults[x], ast.BinOp):
                        argument_names.append({default_names[x]: "type: BinOp"})
                    else:
                        argument_names.append({default_names[x]: defaults[x].id})
            return argument_names
        else:
            return [getattr(x, arg_name) for x in arguments]

    def get_filenames(self, directory):
        # Go through the file tree and grab the filnames for each file found.
        # Assign these to an array and return that array.
        files = []
        tree = os.walk(directory, topdown=True, followlinks=False)
        for dirpath, dirnames, filenames in tree:
            for folder in self.exclude:
                if folder in dirpath:
                    break
            else:
                for name in filenames:
                    if name.endswith(".py") and not name.startswith("_"):
                        files.append(os.path.join(dirpath, name))
        return files

    def get_files_dict(self, filenames):
        # Using a list of filenames, open each file and parse functions and classes
        # out of the source file.
        files_dict = {}
        for x in filenames:
            with open(x, "r") as f:
                source = f.read()
                files_dict[x] = {"classes": {}, "functions": {}}
                files_dict[x]["classes"] = self.get_classes(source)
                files_dict[x]["functions"] = self.get_functions(source)
        return files_dict

    def get_crawl_dict(self):
        # Generate the crawl information using get_filenames as an argument to
        # get_dict_files
        files = self.get_filenames(self.directory)
        files_dict = self.get_files_dict(files)
        return files_dict


class Differ(object):

    def __init__(self, former, latter):
        self.former = former
        self.latter = latter
        self._additions = False
        self._operation = self.diff_operation

    @property
    def additions(self):
        return self._additions

    @additions.setter
    def additions(self, value):
        # If measuring additions instead of deletions, automatically change operator.
        self._additions = value
        if value:
            self._operation = self.combinaton_diff_operation
        else:
            self._operation = self.diff_operation


    def diff_operation(self, a, b):
        # Use this function to find the difference between two sets of dictionary
        # keys. Uses the set difference operation. Called by the diff_modules
        # function.
        return list(a - b)

    def combinaton_diff_operation(self, a, b):
        # Use a combination of symmetric_difference and difference to return a list
        # of items additions through the crawl. Allows you to get additions items instead of
        # removed items. Would produce the same result if you switched the
        # positions of the former and latter versions. Much more natural and
        # easy control using the different set operators.
        return list((a ^ b) - a)

    def diff_files(self):
        diff = {}
        intersection = {}

        intersection.update(self.latter)
        intersection.update(self.former)
        files_diff = self._operation(set(self.former), set(self.latter))

        # Diff files
        for x in intersection.keys():
            if x in files_diff:
                diff[x] = {}
        return intersection, diff

    def diff_functions_classes(self, diff, intersection):
        for x in intersection.keys():
            former_items = self.former.get(x)
            latter_items = self.latter.get(x)
            if former_items and latter_items:
                class_diff = self._operation(
                    set(list(former_items["classes"].keys())),
                    set(list(latter_items["classes"].keys()))
                )

                function_diff = self.diff_signatures(
                    former_items["functions"],
                    latter_items["functions"]
                )

                diff[x] = {"classes": {}, "functions": {}}
                if list(class_diff):
                    diff_dict = {y: {} for y in class_diff}
                    diff[x]["classes"] = diff_dict
                else:
                    diff[x]["classes"] = {}

                if function_diff:
                    diff[x]["functions"] = function_diff
                else:
                    diff[x]["functions"] = {}
        return diff

    def diff_methods(self, diff, intersection):
        for x in intersection.keys():
            former_classes = self.former[x].get("classes") if self.former.get(x) else {}
            latter_classes = self.latter[x].get("classes") if self.latter.get(x) else {}
            if former_classes and latter_classes:
                for y in intersection[x]["classes"]:
                    # Prevent NoneType errors by returning empty dict.
                    former_methods = self.former[x]["classes"].get(y, {})
                    latter_methods = self.latter[x]["classes"].get(y, {})
                    if former_methods.get("methods") and latter_methods.get("methods"):
                        methods_diff = self.diff_signatures(former_methods["methods"], latter_methods["methods"])
                        if methods_diff:
                            if not diff.get(x):
                                diff[x] = {"classes": {}}
                            diff[x]["classes"][y] = {"methods": methods_diff}
        return diff

    def diff_single_signature(self, old, new):
        arguments_diff = []
        for x in old:
            if x not in new:
                arguments_diff.append(x)
        return arguments_diff

    def diff_signatures(self, old_signature, new_signature):
        arguments = {}
        intersection = list(set(old_signature) & set(new_signature))
        difference = self._operation(set(old_signature), set(new_signature))
        arguments.update({x: [] for x in difference})
        for x in intersection:
            if self.additions:
                arguments_diff = self.diff_single_signature(
                    new_signature[x],
                    old_signature[x]
                )
            else:
                arguments_diff = self.diff_single_signature(
                    old_signature[x],
                    new_signature[x]
                )
            if arguments_diff:
                arguments.update({x: arguments_diff})
        return arguments

    def diff_modules(self):
        intersection, diff = self.diff_files()
        diff = self.diff_functions_classes(diff, intersection)
        diff = self.diff_methods(diff, intersection)
        return diff

    def pretty_function_signatures(self, arg_list):
        arg_string = []
        for x in arg_list:
            if isinstance(x, dict):
                arg_string.append("%s=%s" % (str(list(x.keys())[0]), str(list(x.values())[0])))
            elif isinstance(x, list):
                arg_string.append("%s=%s" % (str(x), str(list(x.values())[0])))
            else:
                arg_string.append("%s" % x)
        if arg_string:
            return "(" + ", ".join(arg_string) + ")"
        else:
            return "()"

    def pretty_function_changes(self, title, old_func, new_func):
        tags = []
        intersection = old_func[:]
        for x in new_func:
            if x not in intersection:
                intersection.append(x)
        old = "\n\told_signature: %s" % self.pretty_function_signatures(old_func)
        new = "\n\tnew_signature: %s" % self.pretty_function_signatures(new_func)
        old_kwarg_keys = [list(x.keys())[0] for x in old_func if isinstance(x, dict)]
        new_kwarg_keys = [list(x.keys())[0] for x in new_func if isinstance(x, dict)]
        for x in intersection:
            if isinstance(x, str):
                if x not in old_func and x in new_func:
                    if "args_added" not in tags:
                        tags.append("args_added")
                elif x not in new_func and x in old_func:
                    if "args_removed" not in tags:
                        tags.append("args_removed")
            elif isinstance(x, dict):
                current_key = list(x.keys())[0]
                if current_key in old_kwarg_keys and current_key in new_kwarg_keys:
                    old_kwarg = next(x for x in old_func if isinstance(x, dict) and list(x.keys())[0] == current_key)
                    new_kwarg = next(x for x in new_func if isinstance(x, dict) and list(x.keys())[0] == current_key)
                    if old_kwarg != new_kwarg and "kwargs_changed" not in tags:
                        tags.append("kwargs_changed")
                elif x not in old_func and x in new_func:
                    if "kwargs_added" not in tags:
                        tags.append("kwargs_added")
                elif x not in new_func and x in old_func:
                    if "kwargs_removed" not in tags:
                        tags.append("kwargs_removed")
        if tags:
            tags = "\n\ttags: %s" % ", ".join(tags)
        else:
            tags = "\n\ttags: None"

        signature_string = "%s%s%s%s" % (
            title,
            old,
            new,
            tags,
        )
        return signature_string

    def pretty_diff(self, diff):
        parsed_diff = []
        if self.additions:
            method = "ADDED:"
        else:
            method = "DELETED:"
        for x in diff.keys():
            module_string = os.path.splitext(x.replace("/", "."))[0]
            formatted_string = "%s %s" % (method, module_string)
            changed_string = "%s %s" % (
                "CHANGED:",
                module_string
            )
            if diff[x].values():
                for y in diff[x].values():
                    if diff[x]["classes"] == y:
                        for z in y.keys():
                            if not y[z].values():
                                parsed_diff.append("%s.%s" % (formatted_string, z))
                            else:
                                for i in y[z]["methods"]:
                                    if y[z]["methods"][i]:
                                        title = "%s.%s.%s" % (changed_string, z, i)
                                        self.parsed_signature_diff.append(self.pretty_function_changes(
                                            title,
                                            self.former[x]["classes"][z]["methods"][i],
                                            self.latter[x]["classes"][z]["methods"][i],
                                        ))
                                    else:
                                        parsed_diff.append("%s.%s.%s" % (formatted_string, z, i))
                    if diff[x]["functions"] == y:
                        for z in y:
                            if y[z]:
                                title = "%s.%s" % (changed_string, z)
                                self.parsed_signature_diff.append(self.pretty_function_changes(
                                    title,
                                    self.former[x]["functions"][z],
                                    self.latter[x]["functions"][z],
                                ))
                            else:
                                function_string = "%s" % (z)
                                parsed_diff.append("%s.%s" % (formatted_string, function_string))
            else:
                parsed_diff.insert(0, formatted_string)

        return parsed_diff

    def dedupelicate_signatures(self, signatures):
        deduped = []
        for x in range(len(signatures)):
            if signatures[x] not in deduped:
                deduped.append(signatures[x])
        return deduped

    def get_diff(self):
        self.parsed_signature_diff = []
        self.additions = False
        removed = self.pretty_diff(self.diff_modules())
        self.additions = True
        added = self.pretty_diff(self.diff_modules())
        return removed + added + self.dedupelicate_signatures(self.parsed_signature_diff)


api_crawler = APICrawler
differ = Differ
