import { ChakraProvider } from '@chakra-ui/react';
import { AppProps } from 'next/app';

import theme from '../lib/theme';
import { AppSettingsProvider } from '../utils/AppSettingsContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <AppSettingsProvider>
        <Component {...pageProps} />
      </AppSettingsProvider>
    </ChakraProvider>
  );
}

export default MyApp;
