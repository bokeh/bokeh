// Simplify the sidebar TOC on the releases page
window.addEventListener('DOMContentLoaded', function () {
  if (window.location.pathname.endsWith("releases.html")) {
    [].forEach.call(document.querySelectorAll('.toc-h3'), function (el) {
      el.parentElement.remove()
    });
  }
})
