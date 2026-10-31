'use client';

import React, { Suspense } from 'react';
import toast from 'react-hot-toast';

import { signIn } from 'next-auth/react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import {
  LoginFormValues,
  loginFormSchema,
  RegisterFormValues,
  registerFormSchema,
} from '@/lib/validations/auth-schema';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthError } from './auth-error';
import SocialsActions, { SocialProvider } from './socials-actions';
import { registerUser } from './register-user';

interface AuthFormProps {
  variant: 'register' | 'login';
  socialProviders?: SocialProvider[];
}

type AuthSchemaType = {
  login: LoginFormValues;
  register: RegisterFormValues;
}[AuthFormProps['variant']];

function AuthFormInner({ variant, socialProviders = [] }: AuthFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlError = searchParams.get('error');
  let errorMessage = '';

  if (urlError === 'OAuthAccountNotLinked') {
    errorMessage = 'Email already in use with a different provider!';
  } else if (urlError === 'CredentialsSignin') {
    errorMessage = 'Wrong credentials.';
  } else if (urlError === 'OAuthCallbackError') {
    errorMessage = 'An unexpected error occurred.';
  }
  const authSchema = variant === 'login' ? loginFormSchema : registerFormSchema;
  const form = useForm<AuthSchemaType>({ resolver: zodResolver(authSchema) });

  const onSubmit: SubmitHandler<AuthSchemaType> = async (
    data: AuthSchemaType,
  ) => {
    try {
      setIsLoading(true);

      if (variant === 'login') {
        const { email, password } = data as LoginFormValues;
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          toast.error('Wrong email or password.');
          return;
        }

        toast.success('Welcome back!');
        router.push(DEFAULT_LOGIN_REDIRECT);
        router.refresh();
      } else if (variant === 'register') {
        const { email, name, password } = data as RegisterFormValues;
        const res = await registerUser({ email, name, password });
        if (res?.success) {
          toast.success('Successfully registered. You can now log in.');
          router.push('/auth/login');
        }
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data ?? 'Something went wrong.');
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Oops. Something went wrong.');
      }
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-sm w-full mx-auto">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="example@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {variant === 'register' && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="********" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {variant === 'register' && (
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input placeholder="********" type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <AuthError message={errorMessage} />
        <Button
          type="submit"
          className="w-full"
          loading={isLoading}
          disabled={isLoading}
          variant="default"
        >
          {variant === 'login' ? 'Login' : 'Register'}
        </Button>
      </form>
      {variant === 'login' && !!socialProviders.length && (
        <SocialsActions providers={socialProviders} />
      )}
    </Form>
  );
}

/**
 * `useSearchParams` needs a Suspense boundary during static generation,
 * otherwise `next build` fails for /auth/login and /auth/register.
 */
export default function AuthForm(props: AuthFormProps) {
  return (
    <Suspense fallback={null}>
      <AuthFormInner {...props} />
    </Suspense>
  );
}
