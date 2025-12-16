from django.conf import settings


def set_auth_cookies(response, access_token, refresh_token):
    access_lifetime = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
    refresh_lifetime = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']

    response.set_cookie(
        key='access-token',
        value=access_token,
        max_age=int(access_lifetime.total_seconds()),
        httponly=True,
        samesite='Lax',
        secure=not settings.DEBUG
    )

    response.set_cookie(
        key='refresh-token',
        value=refresh_token,
        max_age=int(refresh_lifetime.total_seconds()),
        httponly=True,
        samesite='Lax',
        secure=not settings.DEBUG,
    )
