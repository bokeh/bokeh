set BLD_DIR=%cd%
cd /d %RECIPE_DIR%\..
if errorlevel 1 exit 1

cd bokehjs
call npm install
if errorlevel 1 exit 1
cd /d %RECIPE_DIR%\..

python scripts/get_bump_version.py > __conda_version__.txt
copy /Y __conda_version__.txt %BLD_DIR%
if errorlevel 1 exit 1

python setup.py --quiet install nightly --build_js --single-version-externally-managed --record=record.txt
if errorlevel 1 exit 1

mkdir %PREFIX%\Examples
if errorlevel 1 exit 1

copy /Y examples %PREFIX%\Examples\bokeh
if errorlevel 1 exit 1
