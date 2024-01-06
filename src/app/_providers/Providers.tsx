'use client';

import { ReactNode } from 'react';

import {
  coinbaseWallet, // import the wallets you want
  metamaskWallet,
  walletConnect,
} from '@thirdweb-dev/react';

import useAppConfig from '@/hooks/useAppConfig';

import { ThirdwebProvider } from './ThirdwebProvider';

type ProviderType = {
  children: ReactNode;
};

const Providers = ({ children }: ProviderType) => {
  const { activeChain, supportedChains } = useAppConfig();
  return (
    <ThirdwebProvider
      supportedWallets={[metamaskWallet(), coinbaseWallet(), walletConnect()]}
      supportedChains={supportedChains}
      activeChain={activeChain}
      clientId={process.env.NEXT_PUBLIC_THIRD_WEB_CLIENT_ID}
    >
      {children}
    </ThirdwebProvider>
  );
};

export default Providers;