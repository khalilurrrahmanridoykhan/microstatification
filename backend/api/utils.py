from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    # Print exception details for debugging
    print(f"Exception occurred: {exc}")
    if hasattr(exc, 'detail'):
        print(f"Exception detail: {exc.detail}")

    if response is None:
        return response

    # For authentication failures, return a more friendly message
    if response.status_code == 401:
        response.data = {
            'detail': 'Authentication credentials were not provided or are invalid.',
            'code': 'authentication_failed'
        }

    # For CSRF failures
    elif response.status_code == 403 and hasattr(exc, 'detail') and 'CSRF' in str(exc.detail):
        # Add CORS headers to the response
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Credentials"] = "true"

        response.data = {
            'detail': 'CSRF verification failed. Try refreshing the page.',
            'code': 'csrf_failed',
            'message': str(exc.detail)
        }

    # Add debug info in development
    if hasattr(context, 'view'):
        view_name = context['view'].__class__.__name__
        if hasattr(context['view'], 'action'):
            action = context['view'].action
        else:
            action = context['request'].method

        response.data['debug'] = {
            'view': view_name,
            'action': action
        }

    return response
