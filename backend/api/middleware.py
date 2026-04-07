import re
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
from django.http import JsonResponse
from django.middleware.csrf import REASON_NO_CSRF_COOKIE

# Django 5.1 removed REASON_BAD_TOKEN, so define it locally
REASON_BAD_TOKEN = "CSRF token missing or incorrect."

class CustomCSRFMiddleware(MiddlewareMixin):
    """
    Middleware to validate the __csrf cookie for POST/PUT/PATCH/DELETE requests.
    This is for Enketo or other clients using a custom CSRF cookie name.
    """
    def _reject(self, request, reason):
        return JsonResponse({'detail': 'CSRF Failed: %s' % reason}, status=403)


    def process_view(self, request, callback, callback_args, callback_kwargs):
        # Always skip CSRF for login, set-enketo-cookie, and csrf-token endpoints
        if request.path in ['/api/auth/login/', '/api/auth/set-enketo-cookie/', '/api/csrf-token/']:
            request.csrf_processing_done = True
            return None

        # Only check for unsafe methods
        if request.method not in ('POST', 'PUT', 'PATCH', 'DELETE'):
            return None

        # For OpenRosa submission endpoint, check if anonymous submissions are allowed
        if request.path.startswith('/api/openrosa/submission'):
            # Check if this form allows anonymous submissions
            if self._check_anonymous_submission_allowed(request):
                print("✅ CSRF check skipped - anonymous submission allowed")
                request.csrf_processing_done = True
                return None

        # Use custom CSRF logic only for Enketo submission endpoints
        if '/submission' in request.path or '/openrosa/submission' in request.path:
            # (leave the rest of the function unchanged for Enketo logic)
            pass
        else:
            # For all other /api/ endpoints, skip CSRF
            if request.path.startswith('/api/'):
                return None

        # Allow exempt views (like @csrf_exempt)
        if getattr(request, 'csrf_processing_done', False):
            return None

        # Get token from __csrf cookie
        csrf_cookie = request.COOKIES.get('__csrf')
        if not csrf_cookie:
            return self._reject(request, REASON_NO_CSRF_COOKIE)


        # Accept token from header or POST data, or fallback to __csrf cookie for Enketo submissions
        csrf_token = request.META.get('HTTP_X_CSRFTOKEN') or request.POST.get('csrfmiddlewaretoken')

        # If this is an Enketo submission (path contains '/submission' or '/openrosa/submission'), allow cookie-only
        is_enketo_submission = '/submission' in request.path
        if not csrf_token and is_enketo_submission:
            csrf_token = csrf_cookie

        if not csrf_token:
            return self._reject(request, REASON_BAD_TOKEN)

        # Constant-time compare
        if not self._compare_safely(csrf_cookie, csrf_token):
            return self._reject(request, REASON_BAD_TOKEN)

        # Mark as processed so Django's default middleware doesn't run
        request.csrf_processing_done = True
        return None

    def _check_anonymous_submission_allowed(self, request):
        """Check if the form being submitted allows anonymous submissions"""
        try:
            import xml.etree.ElementTree as ET
            from .models import Form

            xml_file = request.FILES.get('xml_submission_file')
            if not xml_file:
                return False

            xml_file.seek(0)
            xml_content = xml_file.read().decode('utf-8')
            xml_file.seek(0)  # Reset for later processing

            # Extract form ID from XML
            root = ET.fromstring(xml_content)
            form_id = root.attrib.get('id', '')

            if form_id.startswith('form_'):
                form_id_num = form_id.replace('form_', '')
                try:
                    form = Form.objects.get(id=form_id_num)
                    return form.allow_anonymous_submissions
                except Form.DoesNotExist:
                    return False
        except Exception as e:
            print(f"❌ Error checking anonymous submission in CSRF middleware: {e}")
            return False

        return False

    def _compare_safely(self, val1, val2):
        if len(val1) != len(val2):
            return False
        result = 0
        for x, y in zip(val1, val2):
            result |= ord(x) ^ ord(y)
        return result == 0
import jwt
from django.conf import settings
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.utils.deprecation import MiddlewareMixin
from .models import Form
import xml.etree.ElementTree as ET
from urllib.parse import quote

User = get_user_model()

class EnketoAuthMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # Skip authentication for certain paths
        skip_paths = [
            '/api/auth/',
            '/admin/',
            '/static/',
            '/media/',
            '/api/debug/',
            '/api/test-cookie/'
        ]
        if any(request.path.startswith(path) for path in skip_paths):
            return None

        # Enforce restricted API access for the BRAC download account.
        if hasattr(request, 'user') and getattr(request.user, 'is_authenticated', False):
            restriction_response = self._enforce_brac_download_user_restrictions(request, request.user)
            if restriction_response is not None:
                return restriction_response

        print(f"🔍 Processing request: {request.path}")
        print(f"🍪 Cookies received: {list(request.COOKIES.keys())}")

        # Check for CommicPlan auth cookie first
        auth_cookie = request.COOKIES.get('commicplan_auth')

        if auth_cookie:
            try:
                print(f"🔑 Found auth cookie: {auth_cookie[:20]}...")

                # Decode the JWT token
                decoded_token = jwt.decode(
                    auth_cookie,
                    settings.SECRET_KEY,
                    algorithms=['HS256']
                )

                user_id = decoded_token.get('user_id')
                username = decoded_token.get('username')

                print(f"📝 Decoded token - user_id: {user_id}, username: {username}")

                if user_id:
                    try:
                        user = User.objects.get(id=user_id)
                        request.user = user
                        restriction_response = self._enforce_brac_download_user_restrictions(request, user)
                        if restriction_response is not None:
                            return restriction_response
                        print(f"✅ User authenticated via cookie: {user.username}")
                        return None
                    except User.DoesNotExist:
                        print(f"❌ User not found: {user_id}")

            except jwt.ExpiredSignatureError:
                print("❌ JWT token expired")
            except jwt.InvalidTokenError as e:
                print(f"❌ Invalid JWT token: {e}")
            except Exception as e:
                print(f"❌ Cookie auth error: {e}")

        # Check for standard authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if auth_header.startswith('Token '):
            token = auth_header.split(' ')[1]
            try:
                from rest_framework.authtoken.models import Token
                token_obj = Token.objects.get(key=token)
                request.user = token_obj.user
                restriction_response = self._enforce_brac_download_user_restrictions(request, token_obj.user)
                if restriction_response is not None:
                    return restriction_response
                print(f"✅ User authenticated via token: {token_obj.user.username}")
                return None
            except Token.DoesNotExist:
                print(f"❌ Token not found: {token}")

        # Check for Basic Authentication (for Enketo client)
        if auth_header.startswith('Basic '):
            try:
                import base64
                encoded_credentials = auth_header.split(' ')[1]
                decoded_credentials = base64.b64decode(encoded_credentials).decode('utf-8')
                username, password = decoded_credentials.split(':', 1)

                from django.contrib.auth import authenticate
                user = authenticate(username=username, password=password)
                if user:
                    request.user = user
                    restriction_response = self._enforce_brac_download_user_restrictions(request, user)
                    if restriction_response is not None:
                        return restriction_response
                    print(f"✅ User authenticated via Basic auth: {user.username}")
                    return None
            except Exception as e:
                print(f"❌ Basic auth failed: {e}")

        # Handle OpenRosa endpoints specifically
        if request.path.startswith('/api/openrosa/'):
            return self.handle_openrosa_auth(request)

        # For other endpoints, let Django's default authentication handle it
        return None

    def _enforce_brac_download_user_restrictions(self, request, user):
        restricted_username = getattr(settings, "BRAC_DOWNLOAD_USERNAME", "").strip()
        restricted_project_id = int(getattr(settings, "BRAC_DOWNLOAD_PROJECT_ID", 55))
        if not restricted_username or not user or user.username != restricted_username:
            return None

        if request.method == 'OPTIONS':
            return None

        allowed_exact_paths = {
            '/api/auth/login/',
            '/api/csrf-token/',
            '/api/auth/set-enketo-cookie/',
        }
        if request.path in allowed_exact_paths:
            return None

        full_download_pattern = rf'^/api/get-project-templates-full/{restricted_project_id}/?$'
        full_download_xlsx_pattern = rf'^/api/get-project-templates-full-xlsx/{restricted_project_id}/?$'
        if re.match(full_download_pattern, request.path) or re.match(full_download_xlsx_pattern, request.path):
            return None

        return JsonResponse(
            {
                'detail': (
                    f'This account is restricted to BRAC data download for project '
                    f'{restricted_project_id}.'
                )
            },
            status=403,
        )

    def handle_openrosa_auth(self, request):
        """Handle authentication specifically for OpenRosa endpoints"""
        print(f"🔒 Handling OpenRosa auth for: {request.path}")

        # Allow HEAD/OPTIONS for OpenRosa endpoints without authentication
        if request.method in ['HEAD', 'OPTIONS']:
            return None

        # Check if this is a submission that might allow anonymous access
        if request.path.startswith('/api/openrosa/submission') and request.method == 'POST':
            # Check if form allows anonymous submissions
            if self.check_anonymous_submission_allowed(request):
                print("✅ Anonymous submission allowed")
                # Create an anonymous user for the request if not authenticated
                if not hasattr(request, 'user') or not request.user.is_authenticated:
                    from django.contrib.auth.models import AnonymousUser
                    request.user = AnonymousUser()
                return None

        # Check if this is a form list or form download request
        if request.path.startswith('/api/openrosa/formList') or request.path.startswith('/api/openrosa/forms/'):
            # These might need authentication but could also be public
            # Let's check if there's a specific form being requested
            if self.check_form_anonymous_access(request):
                print("✅ Anonymous form access allowed")
                # Create an anonymous user for the request if not authenticated
                if not hasattr(request, 'user') or not request.user.is_authenticated:
                    from django.contrib.auth.models import AnonymousUser
                    request.user = AnonymousUser()
                return None

        # If we reach here and no user is authenticated, require authentication
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            print(f"❌ Authentication required for: {request.path}")
            return self.unauthorized_response(request)

        return None

    def check_anonymous_submission_allowed(self, request):
        """Check if anonymous submissions are allowed for the form being submitted"""
        try:
            print(f"🔍 Checking anonymous submission permission")
            print(f"🔍 Request FILES: {list(request.FILES.keys())}")

            xml_file = request.FILES.get('xml_submission_file')
            if not xml_file:
                print(f"❌ No xml_submission_file found in request")
                return False

            xml_file.seek(0)
            xml_content = xml_file.read().decode('utf-8')
            xml_file.seek(0)  # Reset for later processing

            print(f"📄 XML content (first 200 chars): {xml_content[:200]}")

            # Extract form ID from XML
            root = ET.fromstring(xml_content)
            form_id = root.attrib.get('id', '')
            print(f"🆔 Extracted form_id: {form_id}")

            if form_id.startswith('form_'):
                form_id_num = form_id.replace('form_', '')
                try:
                    form = Form.objects.get(id=form_id_num)
                    print(f"📋 Form {form_id_num} found - allows anonymous: {form.allow_anonymous_submissions}")
                    return form.allow_anonymous_submissions
                except Form.DoesNotExist:
                    print(f"❌ Form {form_id_num} not found in database")
                    return False
            else:
                print(f"❌ Form ID doesn't start with 'form_': {form_id}")
                return False
        except Exception as e:
            import traceback
            print(f"❌ Error checking anonymous submission: {e}")
            print(f"❌ Traceback: {traceback.format_exc()}")

        return False

    def check_form_anonymous_access(self, request):
        """Check if anonymous access is allowed for form endpoints"""
        try:
            # Always allow GET access so Enketo can download form definitions
            if request.method == 'GET':
                print("ℹ️ Allowing GET access to OpenRosa form endpoint")
                return True

            # Extract form ID from URL path
            path_parts = request.path.split('/')

            # Handle different URL patterns
            if 'forms' in path_parts:
                form_id_index = path_parts.index('forms') + 1
                if form_id_index < len(path_parts):
                    form_id = path_parts[form_id_index]
                    try:
                        form = Form.objects.get(id=form_id)
                        print(f"📋 Form {form_id} allows anonymous: {form.allow_anonymous_submissions}")
                        return form.allow_anonymous_submissions
                    except (Form.DoesNotExist, ValueError):
                        print(f"❌ Form {form_id} not found or invalid")

            # For formList requests, check if any forms allow anonymous access
            if 'formList' in request.path:
                # Generally allow formList access for discovery
                return True

        except Exception as e:
            print(f"❌ Error checking form access: {e}")

        return False

    def unauthorized_response(self, request):
        """Return proper 401 response for Enketo with authentication URL"""
        current_url = request.build_absolute_uri()
        login_base = getattr(settings, "FRONTEND_URL", "").rstrip("/")
        login_url = f"{login_base}/auth/enketo-login?return={quote(current_url)}"

        print(f"🚫 Unauthorized access to: {current_url}")
        print(f"🔗 Redirecting to login: {login_url}")

        # For Enketo submissions, return 401 with WWW-Authenticate header
        response = JsonResponse({
            'error': 'Authentication required',
            'message': f'Please authenticate here in a different browser tab and try again.',
            'auth_url': login_url
        }, status=401)

        # Set the WWW-Authenticate header that Enketo expects
        response['WWW-Authenticate'] = f'Bearer realm="CommicPlan", auth_url="{login_url}"'

        return response
