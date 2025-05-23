import { ChakraProvider, Box } from '@chakra-ui/react';
import { AppProps } from 'next/app';
import Head from 'next/head';

import theme from '../lib/theme';
import { AppSettingsProvider } from '../utils/AppSettingsContext';
import { SerialProvider } from '../utils/SerialContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <AppSettingsProvider>
        <SerialProvider>
          <Head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=RocknRoll+One&display=swap" rel="stylesheet" />
          </Head>
          <Box bg="gray.900" minH="100vh">
            <Component {...pageProps} />
          </Box>
        </SerialProvider>
      </AppSettingsProvider>
    </ChakraProvider>
  );
}

export default MyApp;
