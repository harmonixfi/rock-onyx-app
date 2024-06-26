'use client';

import { ReactNode } from 'react';

import { RainbowKitProvider, darkTheme, getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  bitgetWallet,
  coinbaseWallet,
  gateWallet,
  metaMaskWallet,
  okxWallet,
  rabbyWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { arbitrum, base, mainnet, sepolia } from 'wagmi/chains';

const projectId = process.env.NEXT_PUBLIC_W3C_PROJECT_ID ?? '';

const config = getDefaultConfig({
  appName: 'Harmonix',
  projectId,
  wallets: [
    {
      groupName: 'Popular',
      wallets: [
        walletConnectWallet,
        metaMaskWallet,
        coinbaseWallet,
        gateWallet,
        okxWallet,
        bitgetWallet,
        rabbyWallet,
      ],
    },
  ],
  chains:
    process.env.NEXT_PUBLIC_APP_ENV === 'production'
      ? [arbitrum, mainnet, base]
      : [arbitrum, mainnet, base, sepolia],
  ssr: true,
});

const queryClient = new QueryClient();

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
