`conda install -c anaconda-cluster supervisor`
mkdir -p /Users/quasiben/anaconda/envs/bokeh_dev/var/log/supervisor/
mkdir -p /Users/quasiben/anaconda/envs/bokeh_dev/var/run

supervisord -c etc/supervisor/supervisord.conf
