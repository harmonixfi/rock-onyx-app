import { ReactNode } from 'react';

import { Abi } from 'viem';

import { Address } from '@/@types/common';
import { VaultVariant } from '@/@types/enum';
import DeltaNeutralDescription from '@/components/vault/delta-neutral/DeltaNeutralDescription';
import DeltaNeutralOverview from '@/components/vault/delta-neutral/DeltaNeutralOverview';
import DeltaNeutralParameter from '@/components/vault/delta-neutral/DeltaNeutralParameter';
import DeltaNeutralSafetyAssurance from '@/components/vault/delta-neutral/DeltaNeutralSafetyAssurance';
import DeltaNeutralWithdrawal from '@/components/vault/delta-neutral/DeltaNeutralWithdrawal';
import StableCoinDescription from '@/components/vault/stable-coin/StableCoinDescription';
import StableCoinOverview from '@/components/vault/stable-coin/StableCoinOverview';
import StableCoinParameter from '@/components/vault/stable-coin/StableCoinParameter';
import StableCoinSafetyAssurance from '@/components/vault/stable-coin/StableCoinSafetyAssurance';
import StableCoinWithdrawal from '@/components/vault/stable-coin/StableCoinWithdrawal';
import { ContractMapping } from '@/hooks/useContractMapping';

type VaultCardMapping = {
  color?: 'default' | 'secondary';
  vaultAbi: Abi;
  vaultAddress: Address;
};

export type VaultDetailMapping = {
  description: ReactNode;
  parameter: ReactNode;
  overview: ReactNode;
  safetyAssurance: ReactNode;
  withdrawal: {
    description: ReactNode;
    time: string;
    step2: string;
  };
};

export const vaultCardMapping = (name: string, contracts: ContractMapping): VaultCardMapping => {
  if (name.toLowerCase().includes('option')) {
    return {
      color: 'default',
      vaultAbi: contracts.optionsWheelVaultAbi,
      vaultAddress: contracts.optionsWheelVaultAddress,
    };
  }

  if (name.toLowerCase().includes('restaking')) {
    return {
      color: 'default',
      vaultAbi: contracts.deltaNeutralRenzoVaultAbi,
      vaultAddress: contracts.deltaNeutralRenzoVaultAddress,
    };
  }

  return {
    color: 'secondary',
    vaultAbi: contracts.deltaNeutralVaultAbi,
    vaultAddress: contracts.deltaNeutralVaultAddress,
  };
};

export const vaultDetailMapping = (vaultName: string): VaultDetailMapping => {
  if (vaultName.toLowerCase().includes('option')) {
    return {
      description: <StableCoinDescription />,
      parameter: <StableCoinParameter />,
      overview: <StableCoinOverview />,
      safetyAssurance: <StableCoinSafetyAssurance />,
      withdrawal: {
        description: <StableCoinWithdrawal />,
        time: '8am UTC Friday',
        step2:
          'You can claim your withdrawal every Friday at 8am UTC after our options positions have expired.',
      },
    };
  }

  return {
    description: <DeltaNeutralDescription />,
    parameter: <DeltaNeutralParameter />,
    overview: <DeltaNeutralOverview />,
    safetyAssurance: <DeltaNeutralSafetyAssurance />,
    withdrawal: {
      description: <DeltaNeutralWithdrawal />,
      time: '1 - 4 hours',
      step2: 'You can claim your withdrawal after 1-4 hours.',
    },
  };
};

export const vaultWhitelistWalletsMapping = (vaultVariant?: VaultVariant) => {
  if (!vaultVariant) return '';

  if (vaultVariant === VaultVariant.OptionsWheel) {
    return process.env.NEXT_PUBLIC_OPTIONS_WHEEL_WHITELIST_WALLETS ?? '';
  }

  return process.env.NEXT_PUBLIC_DELTA_NEUTRAL_WHITELIST_WALLETS ?? '';
};

export const vaultDisableDepositMapping = (vaultVariant?: VaultVariant) => {
  if (!vaultVariant) return false;

  if (vaultVariant === VaultVariant.OptionsWheel) {
    return process.env.NEXT_PUBLIC_DISABLE_DEPOSIT_OPTIONS_VAULT === 'true';
  }

  return process.env.NEXT_PUBLIC_DISABLE_DEPOSIT_DELTA_NEUTRAL_VAULT === 'true';
};
