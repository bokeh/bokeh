# from wakariserver.. but copy pasted becuase we dont wnat
# wakariserver dependency here.
import shutil
import os
script_paths = [
    'js/application.js'
    ]
notebookscript_paths = [
    'js/bokehnotebook.js'
    ]

css_paths = [
    'vendor/bokehjs/css/bokeh.css',
    'vendor/bokehjs/css/continuum.css',
    'vendor/bokehjs/vendor/bootstrap/css/bootstrap.css',    
    ]

def static_join(*dirs):
    root = os.path.dirname(__file__)
    return os.path.join(root, "server", "static", *dirs)

def concat_scripts(paths):
    output_str = ""
    for script in paths:
        f_name = static_join(script)
        output_str += """
          // BEGIN %s
          """ % f_name

        output_str += open(f_name).read()
        output_str += """
          // END %s
         """ % f_name
    return output_str

def concat_css(paths):
    output_str = ""
    for css_path in paths:
        f_name = static_join(css_path)
        output_str += """
          /* BEGIN %s */
         """ % f_name

        output_str += open(f_name).read().decode("utf-8")
        output_str += """
          /* END %s */
         """ % f_name
    return output_str

def inline_scripts(script_paths):
    js = concat_scripts(script_paths)
    return js

def inline_css(css_paths):
    css = concat_css(css_paths)
    return css
