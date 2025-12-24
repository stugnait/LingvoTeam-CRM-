import os
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv
from apps import users

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(BASE_DIR, '.env'))

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8080",
    "https://9b34dedeca46.ngrok-free.app",
    "https://secure.wayforpay.com"
]
# Email
EMAIL_HOST = os.getenv("MAIL_HOST")
EMAIL_PORT = os.getenv("MAIL_PORT")
EMAIL_HOST_USER = os.getenv("MAIL_USERNAME")
EMAIL_HOST_PASSWORD = os.getenv("MAIL_PASSWORD")
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

INSTALLED_APPS = [
    "corsheaders",
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_filters',
    'apps.users',
    'apps.clients',
    'apps.core',
    'apps.orders',
    'apps.translators'
]


MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
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

FRONTEND_URL = "http://localhost:3000"
EMAIL_HOST_USER = os.getenv("MAIL_USERNAME")
EMAIL_HOST_PASSWORD = os.getenv("MAIL_PASSWORD")
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = os.getenv("MAIL_HOST")
EMAIL_PORT = os.getenv("MAIL_PORT")
EMAIL_USE_TLS = True
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
SERVER_EMAIL = EMAIL_HOST_USER



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
SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = os.getenv('DEBUG')


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}
MIGRATION_MODULES = {}


REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "apps.users.utils.StandardResultsPagination",
    "PAGE_SIZE": 10,
    'DEFAULT_AUTHENTICATION_CLASSES': (
        # Шлях базується на структурі: папка.папка.файл.Клас
        'apps.users.authentification.CookieJWTAuthentication',

        # Також залиште стандартну аутентифікацію для тестів через Headers
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'apps.users.permissions.HasPermission',
    ),

}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),  # 1 година
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),  # 7 днів
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'TOKEN_OBTAIN_SERIALIZER': 'apps.users.serializers.CustomTokenObtainPairSerializer',
}

AUTH_USER_MODEL = 'users.User'
APPEND_SLASH = False
ROOT_URLCONF = 'LingvoTeam.urls'