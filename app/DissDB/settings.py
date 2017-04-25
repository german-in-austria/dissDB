"""
Django settings for DissDB project.

Generated by 'django-admin startproject' using Django 1.8.

For more information on this file, see
https://docs.djangoproject.com/en/1.8/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.8/ref/settings/
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

#################################################################################################################
# Umgebungsvariablen:																							#
#################################################################################################################
# DISSDB_DEBUG = "False"									(Default: "True")									#
# DISSDB_STATIC_ROOT = "/var/www/example.com/static/"		(Default: None)										#
# DISSDB_STATIC_URL = "/static/"							(Default: "/static/")								#
# Datenbank:																									#
# DISSDB_DB="django.db.backends.postgresql"					(Default: "django.db.backends.sqlite3")				#
# DISSDB_DB_NAME="PersonenDB"								(Default: os.path.join(BASE_DIR, 'db.sqlite3'))		#
# DISSDB_DB_USER="user"										(Default: None)										#
# DISSDB_DB_PASSWORD="passwort"								(Default: None)										#
# DISSDB_DB_HOST="postgresql://localhost"					(Default: None)										#
# DISSDB_DB_PORT="5433"										(Default: None)										#
#################################################################################################################

LOGIN_URL = 'dissdb_login'
LOGOUT_URL = 'dissdb_logout'
LOGIN_REDIRECT_URL = 'startseite:start'
CRISPY_TEMPLATE_PACK = 'bootstrap3'

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.8/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'ggm0_dycvizp#h$ap@czcy2t!al(0@j(%j@)*v00%w+of_whul'

# SECURITY WARNING: don't run with debug turned on in production!
if 'DISSDB_DEBUG' in os.environ and (os.environ['DISSDB_DEBUG'] == 'False' or os.environ['DISSDB_DEBUG'] == False):
	DEBUG = False
else:
	DEBUG = True

ALLOWED_HOSTS = []


# Application definition

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'sortedm2m',
	'Datenbank',
	'startseite',
	'bearbeiten',
	'crispy_forms',
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.security.SecurityMiddleware',
)

ROOT_URLCONF = 'DissDB.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'DissDB', 'templates'),os.path.join(BASE_DIR, 'startseite', 'templates'),os.path.join(BASE_DIR, 'bearbeiten', 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'DissDB.wsgi.application'


# Database
# https://docs.djangoproject.com/en/1.8/ref/settings/#databases

DATABASES = {
	'default': {
		'ENGINE': 'django.db.backends.sqlite3',
		'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
	}
}

# Umgebungsvariablen:
if 'DISSDB_DB' in os.environ and os.environ['DISSDB_DB']:
	DATABASES['default']['ENGINE'] = os.environ['DISSDB_DB']
	if 'DISSDB_DB_NAME' in os.environ:
		DATABASES['default']['DBNAME'] = os.environ['DISSDB_DB_NAME']
		DATABASES['default']['NAME'] = os.environ['DISSDB_DB_NAME']
	if 'DISSDB_DB_USER' in os.environ:
		DATABASES['default']['USER'] = os.environ['DISSDB_DB_USER']
	if 'DISSDB_DB_PASSWORD' in os.environ:
		DATABASES['default']['PASSWORD'] = os.environ['DISSDB_DB_PASSWORD']
	if 'DISSDB_DB_HOST' in os.environ:
		DATABASES['default']['HOST'] = os.environ['DISSDB_DB_HOST']
	if 'DISSDB_DB_PORT' in os.environ:
		DATABASES['default']['PORT'] = os.environ['DISSDB_DB_PORT']

print(DATABASES)


# Internationalization
# https://docs.djangoproject.com/en/1.8/topics/i18n/

LANGUAGE_CODE = 'de-DE'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = False
USE_THOUSAND_SEPARATOR = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.8/howto/static-files/

if 'DISSDB_STATIC_ROOT' in os.environ and os.environ['DISSDB_STATIC_ROOT']:
	STATIC_ROOT = os.environ['DISSDB_STATIC_ROOT']
if 'DISSDB_STATIC_URL' in os.environ and os.environ['DISSDB_STATIC_URL']:
	STATIC_URL = os.environ['DISSDB_STATIC_URL']
else:
	STATIC_URL = '/static/'

STATICFILES_DIRS = (
	os.path.join(BASE_DIR, 'DissDB', 'static'),
	os.path.join(BASE_DIR, 'Dateien'),
)
