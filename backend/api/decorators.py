from django.views.decorators.csrf import csrf_exempt
from functools import wraps

def csrf_exempt_for_openrosa(view_func):
    """Decorator to exempt CSRF for OpenRosa endpoints"""
    @wraps(view_func)
    @csrf_exempt
    def wrapped_view(*args, **kwargs):
        return view_func(*args, **kwargs)
    return wrapped_view