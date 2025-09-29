import React from 'react';
import '../styles/globals.css';
import { AppProps } from 'next/app';
import UserSwitcher from '@/components/UserSwitcher';
import { LearningProvider } from '@/src/context/LearningContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <LearningProvider>
      <Component {...pageProps} />
      <UserSwitcher />
    </LearningProvider>
  );
}

export default MyApp;
