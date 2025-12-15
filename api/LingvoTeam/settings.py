from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'Вставте_тут_ваш_секретний_ключ'

DEBUG = True

ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'apps.users',
]


MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # СЕСІЇ (обов'язково для адмін-панелі та авторизації)
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    # АВТОРИЗАЦІЯ
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    # ПОВІДОМЛЕННЯ
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

STATIC_URL = 'static/'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'Lingvo',
        'USER': 'postgres',
        'PASSWORD': 'Dd12451245',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

MIGRATION_MODULES = {}


ROOT_URLCONF = 'LingvoTeam.urls'