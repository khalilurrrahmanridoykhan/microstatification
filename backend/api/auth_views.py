import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth import authenticate
from django.http import JsonResponse, HttpResponseRedirect
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view
from urllib.parse import unquote, quote


def generate_auth_token(user):
    payload = {
        'user_id': user.id,
        'username': user.username,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')


def _cookie_options(request):
    secure_cookie = request.is_secure() or settings.FRONTEND_URL.startswith("https://")
    options = {
        'httponly': True,
        'secure': secure_cookie,
        'samesite': 'None' if secure_cookie else 'Lax',
        'max_age': 7 * 24 * 60 * 60,
    }
    if settings.AUTH_COOKIE_DOMAIN:
        options['domain'] = settings.AUTH_COOKIE_DOMAIN
    return options


def _default_redirect_url():
    return f"{settings.ENKETO_URL.rstrip('/')}/"


@csrf_exempt
@require_http_methods(["GET", "POST"])
def enketo_login(request):
    return_url = request.GET.get('return', '') or request.POST.get('return_url', '')

    print(f"Enketo login - return_url: {return_url}")

    if request.method == 'GET':
        # Check if user is already authenticated via session
        if request.user.is_authenticated:
            # Set auth cookie and redirect back to Enketo
            if return_url:
                redirect_url = unquote(return_url)
            else:
                redirect_url = _default_redirect_url()

            response = HttpResponseRedirect(redirect_url)
            auth_token = generate_auth_token(request.user)
            response.set_cookie('commicplan_auth', auth_token, **_cookie_options(request))
            return response

        # Check if this is a browser request
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        accept_header = request.META.get('HTTP_ACCEPT', '')

        # If it's a browser request, redirect to React frontend login
        if 'Mozilla' in user_agent or 'text/html' in accept_header:
            frontend_login_url = f"{settings.FRONTEND_URL}/auth/enketo-login?return={quote(return_url) if return_url else ''}"
            print(f"Redirecting to frontend: {frontend_login_url}")
            return HttpResponseRedirect(frontend_login_url)

        # For API requests or non-browser requests, show Django template
        context = {
            'return_url': return_url,
            'encoded_return_url': quote(return_url) if return_url else ''
        }
        return render(request, 'enketo_login.html', context)

    elif request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        return_url = request.POST.get('return_url', '')

        print(f"Login attempt - username: {username}, return_url: {return_url}")

        user = authenticate(username=username, password=password)

        if user:
            # Set auth cookie and redirect back to Enketo
            if return_url:
                redirect_url = unquote(return_url)
            else:
                redirect_url = _default_redirect_url()

            print(f"Login successful, redirecting to: {redirect_url}")

            response = HttpResponseRedirect(redirect_url)
            auth_token = generate_auth_token(user)
            response.set_cookie('commicplan_auth', auth_token, **_cookie_options(request))
            return response
        else:
            return render(request, 'enketo_login.html', {
                'error': 'Invalid credentials',
                'return_url': return_url
            })

@api_view(['POST'])
def logout_enketo(request):
    response = JsonResponse({'message': 'Logged out successfully'})
    if settings.AUTH_COOKIE_DOMAIN:
        response.delete_cookie('commicplan_auth', domain=settings.AUTH_COOKIE_DOMAIN)
    else:
        response.delete_cookie('commicplan_auth')
    return response
