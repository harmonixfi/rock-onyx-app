import { ReactNode, createContext, useContext, useMemo } from 'react';

import { Abi } from 'viem';

import { Address } from '@/@types/common';
import { VaultVariant } from '@/@types/enum';
import useContractMapping from '@/hooks/useContractMapping';

type VaultDetailContextData = {
  vaultVariant?: VaultVariant;
  vaultAbi?: Abi;
  vaultAddress?: Address;
};

const VaultDetailContext = createContext<VaultDetailContextData>({});

type VaultDetailProviderProps = {
  name: string;
  children: ReactNode;
};

export const VaultDetailProvider = (props: VaultDetailProviderProps) => {
  const { name, children } = props;

  const {
    optionsWheelVaultAbi,
    optionsWheelVaultAddress,
    deltaNeutralVaultAbi,
    deltaNeutralVaultAddress,
    deltaNeutralRenzoVaultAbi,
    deltaNeutralRenzoVaultAddress,
  } = useContractMapping();

  const { vaultVariant, vaultAbi, vaultAddress }: VaultDetailContextData = useMemo(() => {
    if (name.toLowerCase().includes('option')) {
      return {
        vaultVariant: VaultVariant.OptionsWheel,
        vaultAbi: optionsWheelVaultAbi,
        vaultAddress: optionsWheelVaultAddress,
      };
    }

    if (name.toLowerCase().includes('restaking')) {
      return {
        vaultVariant: VaultVariant.OptionsWheel,
        vaultAbi: deltaNeutralRenzoVaultAbi,
        vaultAddress: deltaNeutralRenzoVaultAddress,
      };
    }

    return {
      vaultVariant: VaultVariant.DeltaNeutral,
      vaultAbi: deltaNeutralVaultAbi,
      vaultAddress: deltaNeutralVaultAddress,
    };
  }, [
    name,
    optionsWheelVaultAbi,
    optionsWheelVaultAddress,
    deltaNeutralVaultAbi,
    deltaNeutralVaultAddress,
  ]);

  return (
    <VaultDetailContext.Provider
      value={{
        vaultVariant,
        vaultAbi,
        vaultAddress,
      }}
    >
      {children}
    </VaultDetailContext.Provider>
  );
};

export const useVaultDetailContext = () => useContext(VaultDetailContext);

export default VaultDetailContext;
