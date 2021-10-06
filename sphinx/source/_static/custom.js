// Simplify the sidebar TOC on the releases page
window.addEventListener('DOMContentLoaded', function () {
  if (window.location.pathname.endsWith("releases.html")) {
    [].forEach.call(document.querySelectorAll('.toc-h3'), function (el) {
      el.parentElement.remove()
    });
  }
})

// Add alerts to the top of the page, if any are present
$(document).ready(function () {
  $.get('/alert.html', function (data) {
      if (data.length > 0) {
        const content = $('<div class="news-alert">' + data + '</div>')
        $('#banner').prepend(content);
      }
  })
})

// Install listeners to handle collapsible blocks
$(document).ready(function () {
  const coll = document.getElementsByClassName("bk-collapsible");
  for (let i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
      this.classList.toggle("active");
      const content = this.nextElementSibling;
      if (content.style.display === "block") {
        content.style.display = "none";
      } else {
        content.style.display = "block";
      }
    });
  }
})

// Display a version warning banner if necessary
$(document).ready(function () {
  const randid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  $.getJSON('/versions.json?v=' + randid , function (data) {
    if (BOKEH_CURRENT_VERSION != data.latest) {
      let msg
      if (data.all.indexOf(BOKEH_CURRENT_VERSION) < 0 ) {
        msg = "DEVELOPMENT / PRE-RELEASE"
      } else {
        msg = "PREVIOUS RELEASE"
      }
      const content = $('<div class="version-alert">This page is documentation for a ' + msg + ' version. For the latest release, go to <a href="https://docs.bokeh.org/en/latest/">https://docs.bokeh.org/en/latest/</a></div>')
      $('#banner').append(content);
    }
    for (let i = 0; i < data.menu.length; i++) {
      const link = "https://docs.bokeh.org/en/" + data.menu[i]
      $('#version-menu').append('<a class="dropdown-item" href="' + link + '">' + data.menu[i] + '</a>')
    }
  })
})
