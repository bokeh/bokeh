<picture>
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/bokeh/pm/main/assets/logos/SVG/bokeh-logo-white-text-no-padding.svg">
  <img src="https://raw.githubusercontent.com/bokeh/pm/main/assets/logos/SVG/bokeh-logo-black-text-no-padding.svg" alt="Bokeh logo -- text is white in dark theme and black in light theme" height=60/>
</picture>

----

[Bokeh](https://bokeh.org) is an interactive visualization library for modern web browsers. It provides elegant, concise construction of versatile graphics and affords high-performance interactivity across large or streaming datasets. Bokeh can help anyone who wants to create interactive plots, dashboards, and data applications quickly and easily.

---

<table>

<tr>

  <td>Package</td>

  <td>
    <img src="https://img.shields.io/pypi/v/bokeh?label=Version&color=ECD078&style=for-the-badge"
         alt="Latest package version" />
  </td>

  <td>
    <a href="https://docs.bokeh.org/en/latest/docs/first_steps/installation.html">
    <img src="https://img.shields.io/pypi/pyversions/bokeh?color=ECD078&style=for-the-badge"
         alt="Supported Python versions" />
    </a>
  </td>

  <td>
    <a href="https://github.com/bokeh/bokeh/blob/-/LICENSE.txt">
    <img src="https://img.shields.io/github/license/bokeh/bokeh.svg?color=ECD078&style=for-the-badge"
         alt="Bokeh license (BSD 3-clause)" />
    </a>
  </td>

</tr>

<tr>

  <td>Project</td>

  <td>
    <img src="https://img.shields.io/github/contributors-anon/bokeh/bokeh?color=ECD078&style=for-the-badge"
         alt="Github contributors" />
  </td>

  <td>
    <a href="https://numfocus.org">
    <img src="https://img.shields.io/badge/sponsor-numfocus-ECD078?style=for-the-badge"
         alt="Link to NumFOCUS" />
    </a>
  </td>

  <td>
    <a href="https://docs.bokeh.org/en/latest/">
    <img src="https://img.shields.io/badge/documentation-latest-ECD078?style=for-the-badge"
         alt="Link to documentation" />
    </a>
  </td>

</tr>

<tr>

  <td>Downloads</td>

  <td>
    <a href="https://docs.bokeh.org/en/latest/docs/first_steps/installation.html">
    <img src="https://img.shields.io/pypi/dm/bokeh?color=D98B43&label=pypi&logo=python&logoColor=yellow&style=for-the-badge"
         alt="PyPI downloads per month" />
    </a>
  </td>

  <td>
    <a href="https://docs.bokeh.org/en/latest/docs/first_steps/installation.html">
    <img src="https://img.shields.io/conda/d/conda-forge/bokeh?style=for-the-badge&logo=python&color=D98B43&logoColor=yellow"
         alt="Conda downloads per month" />
    </a>
  </td>

  <td>
    <a href="https://www.npmjs.com/package/@bokeh/bokehjs">
    <img src="https://img.shields.io/npm/dm/%40bokeh/bokehjs?style=for-the-badge&logo=npm&label=NPM&color=D98B43"
         alt="NPM downloads per month" />
    </a>
  </td>

</tr>

<tr>

  <td>Build</td>

  <td>
    <a href="https://github.com/bokeh/bokeh/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/bokeh/bokeh/bokeh-ci.yml?label=Bokeh-CI&logo=github&style=for-the-badge"
         alt="Current Bokeh-CI github actions build status" />
    </a>
  </td>

  <td>
    <a href="https://github.com/bokeh/bokeh/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/bokeh/bokeh/bokehjs-ci.yml?label=BokehJS-CI&logo=github&style=for-the-badge"
         alt="Current BokehJS-CI github actions build status" />
    </a>
  </td>

  <td>
    <a href="https://codecov.io/gh/bokeh/bokeh" >
    <img src="https://img.shields.io/codecov/c/github/bokeh/bokeh?logo=codecov&style=for-the-badge&token=bhEzGkDUaw"
         alt="Codecov coverage percentage" />
    </a>
  </td>

</tr>

<tr>

  <td>Community</td>

  <td>
    <a href="https://discourse.bokeh.org">
    <img src="https://img.shields.io/discourse/https/discourse.bokeh.org/posts.svg?color=blue&logo=discourse&style=for-the-badge"
         alt="Community support on discourse.bokeh.org" />
    </a>
  </td>

  <td>
    <a href="https://stackoverflow.com/questions/tagged/bokeh">
    <img src="https://img.shields.io/stackexchange/stackoverflow/t/%5Bbokeh%5D?style=for-the-badge&logo=stackoverflow&label=stackoverflow&color=blue"
         alt="Bokeh-tagged questions on Stack Overflow" />
     </a>
  </td>

</tr>

</table>

*Consider [making a donation](https://opencollective.com/bokeh) if you enjoy using Bokeh and want to support its development.*

![4x9 image grid of Bokeh plots](https://user-images.githubusercontent.com/1078448/190840954-dc243c99-9295-44de-88e9-fafd0f4f7f8a.jpg)

---

## 🚀 Getting Started (New Section)

Here’s a quick guide for developers who want to set up Bokeh locally and explore its features.

### 🧩 Clone the Repository
```bash
git clone https://github.com/bokeh/bokeh.git
cd bokeh
🛠️ Create a Virtual Environment
bash
Copy code
python -m venv venv
source venv/bin/activate   # Mac/Linux
venv\Scripts\activate      # Windows
📦 Install Dependencies
bash
Copy code
pip install -r requirements.txt
✅ Verify Installation
bash
Copy code
pytest tests
▶️ Run Example Application
bash
Copy code
bokeh serve --show examples/app/sliders
💡 Example Usage (New Section)
Here’s a quick example of how to create an interactive line chart with Bokeh.

python
Copy code
from bokeh.plotting import figure, show

# Create a figure
p = figure(title="Simple Line Example", x_axis_label='X-Axis', y_axis_label='Y-Axis')

# Add a line renderer
p.line([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], legend_label="Temp.", line_width=2, color="navy")

# Show the result
show(p)
This will open a new browser tab displaying your first interactive plot 🎉.

📦 Installation
To install Bokeh and its required dependencies using pip, enter the following command:

bash
Copy code
pip install bokeh
To install using conda:

bash
Copy code
conda install bokeh
Refer to the installation documentation
for more details.

📚 Resources
Once Bokeh is installed, check out the First Steps Guide.

Visit the full documentation site
to view the User’s Guide or check out the Bokeh tutorial repository
to learn in live Jupyter Notebooks.

Community support is available on Project Discourse.

If you would like to contribute to Bokeh, please review the Contributor Guide
and request an invitation to the Bokeh Dev Slack workspace.


