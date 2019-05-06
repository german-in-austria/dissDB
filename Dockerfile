# DIOE
FROM ubuntu:14.04

# ADD SOURCES FOR BUILD DEPENDENCIES
RUN echo "deb-src http://in.archive.ubuntu.com/ubuntu/ precise main restricted" >> /etc/apt/sources.list
RUN echo "deb-src http://in.archive.ubuntu.com/ubuntu/ precise-updates main restricted" >> /etc/apt/sources.list

# INSTALL EVERYTHING (”-y” WITHOUT ASKING FOR PERMISSION)
RUN apt-get update
RUN apt-get install -y software-properties-common
RUN add-apt-repository ppa:fkrull/deadsnakes
RUN apt-get update -yq && apt-get install -y curl gnupg && curl -sL https://deb.nodesource.com/setup_8.x | bash && apt-get install -y nodejs
RUN apt-get update
RUN apt-get install -y git
RUN apt-get install -y python3.5
RUN rm /usr/bin/python3
RUN ln -s /usr/bin/python3.5 /usr/bin/python3
RUN apt-get install -y python3-pip
RUN apt-get install -y python3.5-dev
RUN apt-get install -y python3-setuptools
RUN apt-get install -y nginx
RUN apt-get install -y supervisor
RUN apt-get install -y sqlite3
RUN apt-get install -y postgresql-client
RUN apt-get build-dep -y python-psycopg2

# CLEAN UP
RUN rm -rf /var/lib/apt/lists/*

# INSTALL UWSGI
RUN pip3 install uwsgi

# NGINX STANDARD SETUP
RUN echo "daemon off;" >> /etc/nginx/nginx.conf
COPY nginx-app.conf /etc/nginx/sites-available/default
COPY supervisor-app.conf /etc/supervisor/conf.d/

# INSTALL PYTHON MODULES
COPY app/requirements.txt /home/docker/code/app/
RUN pip3 install -r /home/docker/code/app/requirements.txt
RUN pip3 install psycopg2

# Webpacks external
RUN mkdir /home/docker/code/webpack_src/
# Tagsystem VUE Komponente
RUN git clone https://github.com/german-in-austria/tagsystemVUE /home/docker/code/webpack_src/tagsystemVUE --branch v0.01
RUN cd /home/docker/code/webpack_src/tagsystemVUE && npm install && npm run build
# Annotations Tool
RUN git clone https://github.com/german-in-austria/annotationsDB-frontend /home/docker/code/webpack_src/annotationsDB --branch v0.28
RUN cd /home/docker/code/webpack_src/annotationsDB && npm install && npm run build

# ADD (THE REST OF) OUR CODE
COPY . /home/docker/code/

# Webpacks internal
# Anno-sent
RUN cd /home/docker/code/webpack_src/annoSent && npm install && npm run build

# COLLECT ALL STATIC FILES IN /STATIC
ENV DISSDB_STATIC_URL=/static/
ENV DISSDB_STATIC_ROOT=/var/www/example.com/static/
RUN python3 /home/docker/code/app/manage.py collectstatic --noinput

EXPOSE 80
CMD ["supervisord", "-n"]
