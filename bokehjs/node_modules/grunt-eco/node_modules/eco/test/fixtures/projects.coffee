if @projects.length
  _print _safe '\n  '
  for project in @projects
    _print _safe '\n    <a href="'
    _print project.url
    _print _safe '">'
    _print project.name
    _print _safe '</a>\n    '
    _print _safe project.description
    _print _safe '\n  '
  _print _safe '\n'
else
  _print _safe '\n  No projects\n'
_print _safe '\n'
