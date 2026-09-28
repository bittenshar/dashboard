import { useEffect, useRef } from 'react';
import { GOOGLE_CLIENT_ID } from '@/constants/api/config';

// Just the parts of Google Identity Services this component uses.
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            ux_mode?: 'popup' | 'redirect';
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

let gisScript: Promise<void> | null = null;

const loadGoogleScript = () => {
  gisScript ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gisScript = null; // let a later render retry
      reject(new Error('Could not load Google Sign-In. Check your connection and reload.'));
    };
    document.head.appendChild(script);
  });
  return gisScript;
};

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
}

const GoogleSignInButton = ({ onCredential, onError }: GoogleSignInButtonProps) => {
  const container = useRef<HTMLDivElement>(null);

  // Google keeps the callback it was initialised with; route it through refs
  // so it always reaches the latest props.
  const handlers = useRef({ onCredential, onError });
  handlers.current = { onCredential, onError };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !container.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: ({ credential }) => handlers.current.onCredential(credential),
          ux_mode: 'popup',
        });
        window.google.accounts.id.renderButton(container.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'center',
          // Google accepts 200–400px.
          width: Math.min(400, Math.max(200, container.current.offsetWidth)),
        });
      })
      .catch((err: Error) => handlers.current.onError(err.message));

    return () => {
      cancelled = true;
    };
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  return <div ref={container} className="flex min-h-[44px] w-full justify-center" />;
};

export default GoogleSignInButton;
