import os
import subprocess
import sys
import time

from axe_core_python.sync_playwright import Axe
from playwright.sync_api import sync_playwright

script_dir = os.path.dirname(os.path.abspath(__file__))

docs_dir = os.path.abspath(os.path.join(script_dir, ".."))

def start_docs_server():
  subprocess.Popen(["make", "serve"], cwd=docs_dir)
  time.sleep(5) # server loading time

def stop_docs_server():
  # stop the documentation server
  print("Press ENTER twice to stop the docs server...")
  sys.stdin.read(1)

def save_accessibility_report(report):
  # Create the reports directory if it doesn't exist
  script_dir = os.path.dirname(os.path.abspath(__file__))
  reports_dir = os.path.join(script_dir, 'reports')
  os.makedirs(reports_dir, exist_ok=True)

  # Set the filename
  filename = os.path.join(reports_dir, "report.txt")

  with open(filename, "w") as f:
    for url, results in report.items():
      f.write(f"Accessibility Report for {url}\n")
      f.write("=" * 80 + "\n\n")

      violations = results.get("violations", [])
      if violations:
        for violation in violations:
          f.write(f"- Rule violated: {violation['id']}\n")
          f.write(f"  Help: {violation['help']}\n")
          f.write(f"  Description: {violation['description']}\n")
          f.write(f"  Impact: {violation['impact']}\n")
          f.write("  Nodes affected:\n")
          for node in violation['nodes']:
            f.write(f"    - HTML: {node['html']}\n")
            f.write(f"      Target: {node['target']}\n")
          f.write("\n")
      else:
        f.write(f"No accessibility issues found on {url}\n")

      f.write("\n\n")

    print(f"Detailed accessibility report saved to {filename}")

def print_accessibility_results(url, violations):
  if violations:
    print(f"Accessibility issues found on {url}:")
    for violation in violations:
      print(f"- Rule violated: {violation['id']}")
      print(f"  Help: {violation['help']}")
      print(f"  Description: {violation['description']}")
      print(f"  Impact: {violation['impact']}")
      print("  Nodes affected:")
      for node in violation['nodes']:
        print(f"    - HTML: {node['html']}")
        print(f"      Target: {node['target']}")
      print()
  else:
     print(f"No accessibility issues found on {url}")

def test_docs_accessibility():
  start_docs_server()

  try:
    with sync_playwright() as pw:
      chrome = pw.chromium.launch()
      context = chrome.new_context()
      page = context.new_page()
      axe = Axe()

      # pages to test
      pages_to_test = [
        "http://localhost:5009/en/latest/docs/examples/interaction/tools/range_tool.html",
        "http://localhost:5009/en/latest/docs/examples/interaction/widgets/dropdown.html",
        "http://localhost:5009/en/latest/docs/examples/interaction/linking/linked_brushing.html",
        "http://localhost:5009/en/latest/docs/examples/interaction/linking/linked_crosshair.html",
        "http://localhost:5009/en/latest/docs/examples/interaction/linking/data_table_plot.html",
        "http://localhost:5009/en/latest/docs/examples/interaction/legends/legend_hide.html",
        "http://localhost:5009/en/latest/docs/examples/interaction/legends/legend_mute.html",
        "http://localhost:5009/en/latest/docs/examples/interaction/js_callbacks/slider.html",
        "http://localhost:5009/en/latest/docs/examples/interaction/js_callbacks/color_sliders.html",
        "http://localhost:5009/en/latest/docs/examples/interaction/js_callbacks/customjs_lasso_mean.html",
        "http://localhost:5009/en/latest/docs/examples/interaction/js_callbacks/js_on_event.html",
        "http://localhost:5009/en/latest/docs/examples/interaction/widgets/multiselect.html",
        "http://localhost:5009/en/latest/docs/examples/interaction/widgets/multichoice.html",
        "http://localhost:5009/en/latest/docs/examples/interaction/widgets/date_picker.html",
        "http://localhost:5009/en/latest/docs/examples/interaction/widgets/dropdown.html",
        "http://localhost:5009/en/latest/docs/examples/interaction/widgets/data_table.html",
        "http://localhost:5009/en/latest/docs/examples/interaction/widgets/data_cube.html",
      ]

      accessibility_report = {}
      for url in pages_to_test:
        page.goto(url)
        page.wait_for_load_state("networkidle")

        results = axe.run(page)

        violations = results["violations"]
        print_accessibility_results(url, violations)
        accessibility_report[url] = results

      save_accessibility_report(accessibility_report)

      chrome.close()
  finally:
    stop_docs_server()

if __name__ == "__main__":
  test_docs_accessibility()
