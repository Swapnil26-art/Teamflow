import { signIn } from 'next-auth/react';
import * as React from 'react';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';

import { Icons } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { handleError } from '@/lib/util/error';

export type SocialProvider = 'google' | 'github';

export default function SocialsActions({
  providers,
}: {
  providers: SocialProvider[];
}) {
  const [isLoading, setIsLoading] = React.useState<SocialProvider | null>(null);

  if (!providers.length) return null;

  const loginSocial = async (provider: SocialProvider) => {
    setIsLoading(provider);
    try {
      await signIn(provider, {
        callbackUrl: DEFAULT_LOGIN_REDIRECT,
      });
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-4 max-w-sm w-full mx-auto">
      <div className="flex-gap">
        <div className="w-full h-[1px] bg-border" />
        <div className="whitespace-nowrap text-sm px-2">Or continue with</div>
        <div className="w-full h-[1px] bg-border" />
      </div>
      <div className="flex-gap mt-4 gap-4">
        {providers.includes('google') && (
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={isLoading !== null}
            loading={isLoading === 'google'}
            onClick={() => loginSocial('google')}
          >
            <Icons.Google className="w-4 h-4 mr-2" />
            Google
          </Button>
        )}
        {providers.includes('github') && (
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading !== null}
            loading={isLoading === 'github'}
            className="w-full"
            onClick={() => loginSocial('github')}
          >
            <Icons.GitHub className="w-4 h-4 mr-2" />
            GitHub
          </Button>
        )}
      </div>
    </div>
  );
}
