import { ChakraProvider, Box } from '@chakra-ui/react';
import { AppProps } from 'next/app';

import theme from '../lib/theme';
import { AppSettingsProvider } from '../utils/AppSettingsContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <AppSettingsProvider>
        <Box bg="gray.900" minH="100vh">
          <Component {...pageProps} />
        </Box>
      </AppSettingsProvider>
    </ChakraProvider>
  );
}

export default MyApp;
