import React from 'react';
import '../styles/globals.css';
import { AppProps } from 'next/app';
import UserSwitcher from '@/components/UserSwitcher';
import { LearningProvider } from '@/src/context/LearningContext';
import { LearningSessionProvider } from '@/src/context/LearningSessionContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <LearningProvider>
      <LearningSessionProvider>
        <Component {...pageProps} />
        <UserSwitcher />
      </LearningSessionProvider>
    </LearningProvider>
  );
}

export default MyApp;
