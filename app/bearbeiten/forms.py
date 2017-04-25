from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Div, Submit, HTML, Button, Row, Field
from crispy_forms.bootstrap import AppendedText, PrependedText, FormActions
import Datenbank.models as dbmodels










class InfErhebungForm(forms.ModelForm):
	def __init__(self, *args, **kwargs):
		self.helper = FormHelper()
		self.helper.form_class = 'form-horizontal'
		self.helper.label_class = 'col-sm-3'
		self.helper.field_class = 'col-sm-9'
		self.helper.form_method = 'post'
		self.helper.form_action = ''
		self.helper.add_input(Submit('submit', 'Speichern'))
		super(InfErhebungForm, self).__init__(*args, **kwargs)
	class Meta:
		model = dbmodels.InfErhebung
		fields = '__all__'

