
import { Providers } from '@/app/providers';
import { ChakraProvider } from '@chakra-ui/react';
import '@/app/globals.css';
import { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Providers>
      <ChakraProvider>
        <Component {...pageProps} />
      </ChakraProvider>
    </Providers>
  );
}

export default MyApp;
