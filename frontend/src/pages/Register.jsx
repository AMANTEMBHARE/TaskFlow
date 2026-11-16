import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/FormFields';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage, getFieldErrors } from '../services/api';
import { validateEmail, validateName, validatePassword } from '../utils/validators';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const setField = (name) => (event) => {
    setValues((current) => ({ ...current, [name]: event.target.value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = {
      name: validateName(values.name),
      email: validateEmail(values.email),
      password: validatePassword(values.password),
      confirmPassword: values.confirmPassword === values.password ? '' : 'Passwords do not match',
    };
    setErrors(found);
    setFormError('');
    if (Object.values(found).some(Boolean)) return;

    setSubmitting(true);
    try {
      // confirmPassword is a client-side check only and is never sent to the API.
      await register({ name: values.name.trim(), email: values.email.trim(), password: values.password });
      toast.success('Account created. Welcome to TaskFlow!');
      navigate('/', { replace: true });
    } catch (error) {
      setErrors(getFieldErrors(error));
      setFormError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start organizing your work in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {formError}
          </p>
        )}
        <Input
          id="register-name"
          label="Name"
          autoComplete="name"
          value={values.name}
          onChange={setField('name')}
          error={errors.name}
        />
        <Input
          id="register-email"
          type="email"
          label="Email"
          autoComplete="email"
          value={values.email}
          onChange={setField('email')}
          error={errors.email}
        />
        <Input
          id="register-password"
          type="password"
          label="Password"
          autoComplete="new-password"
          value={values.password}
          onChange={setField('password')}
          error={errors.password}
          hint="At least 8 characters, with a letter and a number."
        />
        <Input
          id="register-confirm"
          type="password"
          label="Confirm password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={setField('confirmPassword')}
          error={errors.confirmPassword}
        />
        <Button type="submit" loading={submitting} className="w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
