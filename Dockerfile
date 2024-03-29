# DIOE
FROM ubuntu:18.04
ENV TZ=Europe/Berlin
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# ADD SOURCES FOR BUILD DEPENDENCIES
RUN echo "deb-src http://in.archive.ubuntu.com/ubuntu/ bionic main restricted" >> /etc/apt/sources.list
RUN echo "deb-src http://in.archive.ubuntu.com/ubuntu/ bionic-updates main restricted" >> /etc/apt/sources.list

# INSTALL EVERYTHING (”-y” WITHOUT ASKING FOR PERMISSION)
RUN apt-get update
RUN apt-get install -y software-properties-common
RUN add-apt-repository ppa:deadsnakes/ppa
RUN apt-get update -yq && apt-get install -y curl gnupg && curl -sL https://deb.nodesource.com/setup_10.x | bash && apt-get install -y --force-yes nodejs
RUN apt-get update
RUN apt-get install -y git
RUN apt-get install -y --force-yes python3.5
RUN rm /usr/bin/python3
RUN ln -s /usr/bin/python3.5 /usr/bin/python3
RUN apt-get install -y python3-pip
RUN apt-get install -y --force-yes python3.5-dev
RUN apt-get install -y python3-setuptools
RUN apt-get install -y nginx
RUN apt-get install -y supervisor
RUN apt-get install -y sqlite3
RUN apt-get install -y postgresql-client
RUN apt-get build-dep -y python-psycopg2

RUN apt-get update
RUN apt-get install -y libtiff5-dev
RUN apt-get install -y libjpeg8-dev
RUN apt-get install -y zlib1g-dev
RUN apt-get install -y libfreetype6-dev
RUN apt-get install -y liblcms2-dev
RUN apt-get install -y libwebp-dev
RUN apt-get install -y libharfbuzz-dev
RUN apt-get install -y libfribidi-dev
RUN apt-get install -y tcl8.6-dev
RUN apt-get install -y tk8.6-dev
RUN apt-get install -y python-tk

# CLEAN UP
RUN rm -rf /var/lib/apt/lists/*

# INSTALL UWSGI
RUN pip3 install uwsgi

# NGINX STANDARD SETUP
RUN echo "daemon off;" >> /etc/nginx/nginx.conf
COPY nginx-gzip.conf /etc/nginx/conf.d/
COPY nginx-app.conf /etc/nginx/sites-available/default
COPY supervisor-app.conf /etc/supervisor/conf.d/

# INSTALL PYTHON MODULES
COPY app/requirements.txt /home/docker/code/app/
RUN pip3 install -r /home/docker/code/app/requirements.txt
RUN pip3 install psycopg2

# Webpacks
RUN mkdir /home/docker/code/webpack_src/
# Tagsystem VUE Komponente
RUN git clone https://github.com/german-in-austria/tagsystemVUE /home/docker/code/webpack_src/tagsystemVUE --branch v0.05
RUN cd /home/docker/code/webpack_src/tagsystemVUE && npm install && npm run build
# Annotations Tool
RUN git clone https://github.com/german-in-austria/annotationsDB-frontend /home/docker/code/webpack_src/annotationsDB --branch v0.31
RUN cd /home/docker/code/webpack_src/annotationsDB && npm install && npm run build
# Anno-sent
COPY webpack_src/annoSent /home/docker/code/webpack_src/annoSent/
RUN cd /home/docker/code/webpack_src/annoSent && npm install && npm run build
# Anno-check
COPY webpack_src/annoCheck /home/docker/code/webpack_src/annoCheck/
RUN cd /home/docker/code/webpack_src/annoCheck && npm install && npm run build
# Tag Auswertung
COPY webpack_src/annoTagAuswertung /home/docker/code/webpack_src/annoTagAuswertung/
RUN cd /home/docker/code/webpack_src/annoTagAuswertung && npm install && npm run build

# ADD (THE REST OF) OUR CODE
COPY . /home/docker/code/

# COLLECT ALL STATIC FILES IN /STATIC
ENV DISSDB_STATIC_URL=/static/
ENV DISSDB_STATIC_ROOT=/var/www/example.com/static/
RUN python3.5 /home/docker/code/app/manage.py collectstatic --noinput

EXPOSE 80
CMD ["supervisord", "-n"]
