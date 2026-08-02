// Simplify the sidebar TOC on the releases page
window.addEventListener('DOMContentLoaded', function () {
  if (window.location.pathname.endsWith("releases.html")) {
    [].forEach.call(document.querySelectorAll('.toc-h3'), function (el) {
      el.parentElement.remove()
    });
  }
})

// Route anchors from the former module-sized model reference pages to the
// corresponding one-class-per-page reference. URL fragments are not sent to
// the server, so this compatibility behavior has to run in the browser.
window.addEventListener('DOMContentLoaded', function () {
  const marker = "/docs/reference/models/"
  const markerIndex = window.location.pathname.indexOf(marker)

  if (markerIndex == -1) {
    return
  }

  const hash = window.location.hash
  const match = hash.match(/^#bokeh\.models(?:\.[a-z_][a-z0-9_]*)*\.([A-Z][A-Za-z0-9_]*)(\..*)?$/)
  const redirect = document.querySelector("[data-bokeh-model-redirect]")
  const classesRoot = window.location.pathname.slice(0, markerIndex + marker.length) + "classes/"

  if (!window.location.pathname.startsWith(classesRoot) && (redirect != null || match != null)) {
    const className = redirect?.dataset.bokehModelRedirect ?? match[1]
    window.location.replace(classesRoot + className + ".html" + window.location.search + hash)
    return
  }

  // Older links sometimes used the implementation module in the object ID.
  // Model pages use the stable top-level bokeh.models namespace instead.
  if (match != null && document.getElementById(hash.slice(1)) == null) {
    const normalizedHash = "#bokeh.models." + match[1] + (match[2] ?? "")
    const target = document.getElementById(normalizedHash.slice(1))
    if (target != null) {
      window.history.replaceState(null, "", normalizedHash)
      target.scrollIntoView()
    }
  }
})
