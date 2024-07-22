
import { Providers } from '@/app/providers';
import { ChakraProvider } from '@chakra-ui/react';
import '@/app/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <Providers>
      <ChakraProvider>
        <Component {...pageProps} />
      </ChakraProvider>
    </Providers>
  );
}

export default MyApp;
