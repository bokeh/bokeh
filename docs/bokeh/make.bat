@ECHO OFF
setlocal

REM Re-enter once through Pixi unless this checkout's Pixi environment is active.
if defined BOKEH_DOCS_PIXI_ACTIVE goto activated
for %%I in ("%~dp0..\..\.pixi\envs") do set "BOKEH_PIXI_ENVS=%%~fI"
if not defined CONDA_PREFIX goto run_in_pixi
for %%I in ("%CONDA_PREFIX%\..") do set "ACTIVE_ENV_ROOT=%%~fI"
if /I "%ACTIVE_ENV_ROOT%" == "%BOKEH_PIXI_ENVS%" goto activated

:run_in_pixi
set "BOKEH_DOCS_PIXI_ACTIVE=1"
pixi run --manifest-path "%~dp0..\.." --locked "%~f0" %*
exit /b %ERRORLEVEL%

:activated

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
	echo.  reference         to regenerate the bokeh.models API reference
	echo.  reference-check   to check that the generated API reference is current
	echo.  reference-clean   to remove generated API reference sources
	echo.  serve    	     to serve the generated HTML and open a browser

	goto end
)

if "%1" == "clean" (
	call "%~f0" reference-clean
	if errorlevel 1 exit /b 1
	rmdir %BUILDDIR% /s /q
	del /q /s source\docs\gallery\*
	del /q /s source\docs\examples\*
	del /q /s source\_images\icons\*.svg
	goto end
)

if "%1" == "all" (
	call "%~f0" html
	if errorlevel 1 exit /b 1
	goto end
)

if "%1" == "reference" (
	python -m api_reference
	if errorlevel 1 exit /b 1
	goto end
)

if "%1" == "reference-check" (
	python -m api_reference --check
	if errorlevel 1 (
		echo.Try to clean old references.
		python -m api_reference --clean
		if errorlevel 1 exit /b 1
		python -m api_reference
		if errorlevel 1 exit /b 1
		python -m api_reference --check
		if errorlevel 1 exit /b 1
	)
	goto end
)

if "%1" == "reference-clean" (
	python -m api_reference --clean
	if errorlevel 1 exit /b 1
	goto end
)

if "%1" == "html" (
	call "%~f0" reference-check
	if errorlevel 1 exit /b 1
	xcopy ..\..\bokehjs\src\less\icons\* source\_images\icons\ /y
	%SPHINXBUILD% -W -b html %ALLSPHINXOPTS% %BUILDDIR%\html
	xcopy ..\bokeh\server\static %BUILDDIR%\html\static\ /s /e /h /y
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
