# authentication.py

from django.conf import settings
from django.utils import translation

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, TokenError
from rest_framework_simplejwt.tokens import RefreshToken


def set_auth_cookies(response, access_token, refresh_token):
    access_lifetime = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
    refresh_lifetime = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']

    # cookie_params = {
    #     "httponly": True,
    #     "secure": True,
    #     "samesite": "None",
    #     "domain": ".lingvoteam.website",
    # }

    response.set_cookie(
        key='access-token',
        value=access_token,
        max_age=int(access_lifetime.total_seconds()),
        # **cookie_params
    )

    response.set_cookie(
        key='refresh-token',
        value=refresh_token,
        max_age=int(refresh_lifetime.total_seconds()),
        # **cookie_params
    )


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        raw_token = request.COOKIES.get('access-token')

        if raw_token is None:
            # Немає access-токена — пробуємо відразу через refresh
            return self._try_refresh_fallback(request)

        try:
            validated_token = self.get_validated_token(raw_token)
        except (AuthenticationFailed, TokenError):
            # Токен є але протух — теж пробуємо refresh
            return self._try_refresh_fallback(request)

        return self._authenticate_with_token(request, validated_token)

    def _try_refresh_fallback(self, request):
        """Спроба автентифікації через refresh-token cookie."""
        raw_refresh = request.COOKIES.get('refresh-token')
        if raw_refresh is None:
            return None

        try:
            refresh = RefreshToken(raw_refresh)
            validated_token = self.get_validated_token(str(refresh.access_token))
            return self._authenticate_with_token(request, validated_token)
        except (AuthenticationFailed, TokenError):
            return None

    def _authenticate_with_token(self, request, validated_token):
        user = self.get_user(validated_token)

        lang = getattr(user, "language_code", None)
        if lang:
            translation.activate(lang)

        return user, validated_token