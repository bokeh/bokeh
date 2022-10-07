// Simplify the sidebar TOC on the releases page
window.addEventListener('DOMContentLoaded', function () {
  if (window.location.pathname.endsWith("releases.html")) {
    [].forEach.call(document.querySelectorAll('.toc-h3'), function (el) {
      el.parentElement.remove()
    });
  }
})

// Display a version warning banner if necessary
$(document).ready(function () {
  const randid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  $.getJSON('/switcher.json?v=' + randid , function (data) {
    if (BOKEH_CURRENT_VERSION != data[0].version) {
      let msg
      if (data.findIndex((elt) => elt.version == BOKEH_CURRENT_VERSION) < 0 ) {
        msg = "DEVELOPMENT / PRE-RELEASE"
      } else {
        msg = "PREVIOUS RELEASE"
      }
      const content = $('<div class="version-alert">This page is documentation for a ' + msg + ' version. For the latest release, go to <a href="https://docs.bokeh.org/en/latest/">https://docs.bokeh.org/en/latest/</a></div>')
      $('#banner').append(content);
    }
  })
})
