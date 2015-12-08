`conda create -n bokeh_sliders python=2.7 bokeh`

sudo apt-get install -y supervisor
#sudo yum install -y supervisor

cp ./bokeh/prod_deploy/etc/supervisor/conf.d/slider.conf /etc/supervisor/conf.d/slider.conf
supervisorctl reread
supervisorctl update


sudo apt-get install nginx
sudo service nginx start
cp nginx.conf /etc/nginx/sites-available/my_bokeh_app.com
sudo service nginx reload


#Basic Auth
sudo apt-get install apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd bokeh
