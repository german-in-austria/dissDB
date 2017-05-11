from django import template
from django.conf import settings

register = template.Library()

# settings value
@register.simple_tag
def settings_value(name):
    if name in getattr(settings, 'ALLOWED_SETTINGS_IN_TEMPLATES', ''):
        return getattr(settings, name, '')
    return ''
