@ECHO OFF

REM Command file for Sphinx documentation

if "%SPHINXBUILD%" == "" (
	set SPHINXBUILD=sphinx-build
)
set BUILDDIR=build
set ALLSPHINXOPTS=-d %BUILDDIR%/doctrees %SPHINXOPTS% source
set I18NSPHINXOPTS=%SPHINXOPTS% .
if NOT "%PAPER%" == "" (
	set ALLSPHINXOPTS=-D latex_paper_size=%PAPER% %ALLSPHINXOPTS%
	set I18NSPHINXOPTS=-D latex_paper_size=%PAPER% %I18NSPHINXOPTS%
)

if "%1" == "" goto help

if "%1" == "help" (
	:help
	echo.Please use `make ^<target^>` where ^<target^> is one of
	echo.  all               to make standalone HTML files
	echo.  clean             to clear all built documentation files
	echo.  html              to make standalone HTML files
	echo.  serve    	     to serve the generated HTML and open a browser

	goto end
)

if "%1" == "clean" (
	rmdir %BUILDDIR% /s /q
	del /q /s source\docs\gallery\*
	goto end
)

if "%1" == "all" (
    make html
)

if "%1" == "html" (
	%SPHINXBUILD% -b html %ALLSPHINXOPTS% %BUILDDIR%\html
	xcopy ..\bokeh\server\static %BUILDDIR%\html\static\ /s /e /h
	if errorlevel 1 exit /b 1
	echo.
	echo.Build finished. The HTML pages are in %BUILDDIR%/html.
	goto end
)

if "%1" == "serve" (
	python docserver.py
	if errorlevel 1 exit /b 1
	goto end
)


:end
