#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import json

# External imports
from jinja2 import Template

# Bokeh imports
from bokeh.embed import json_item
from bokeh.models import Plot
from bokeh.resources import INLINE

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
    "bokeh._testing.plugins.selenium",
)

PAGE = Template("""
<!DOCTYPE html>
<html lang="en">
<head>
  {{ resources }}
</head>

<body>
  <div id="_target"></div>
  <script>
    Bokeh.embed.embed_item({{ item }}, "_target");
  </script>
</body>
""")


@pytest.mark.selenium
class Test_json_item:
    def test_bkroot_added_to_target(self, driver, test_file_path_and_url) -> None:
        p = Plot()
        html = PAGE.render(item=json.dumps(json_item(p)), resources=INLINE.render())

        path, url = test_file_path_and_url
        with open(path, "w") as f:
            f.write(html)

        driver.get(url)

        div = driver.find_elements_by_class_name("bk-root")
        assert len(div) == 1
