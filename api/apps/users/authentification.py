from django.conf import settings
from django.utils import translation

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed


def set_auth_cookies(response, access_token, refresh_token):
    access_lifetime = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
    refresh_lifetime = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']

    cookie_params = {
        "httponly": True,
        "secure": True,
        "samesite": "None",
        "domain": ".lingvoteam.website",
    }

    response.set_cookie(
        key='access-token',
        value=access_token,
        max_age=int(access_lifetime.total_seconds()),
        **cookie_params
    )

    response.set_cookie(
        key='refresh-token',
        value=refresh_token,
        max_age=int(refresh_lifetime.total_seconds()),
        **cookie_params
    )

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        raw_token = request.COOKIES.get('access-token')

        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
        except AuthenticationFailed:
            return None

        user = self.get_user(validated_token)

        lang = getattr(user, "language_code", None)
        if lang:
            translation.activate(lang)

        return user, validated_token
