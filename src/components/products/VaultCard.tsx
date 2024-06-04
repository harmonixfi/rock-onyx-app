'use client';

import { useMemo } from 'react';

import { Card } from '@nextui-org/react';
import Link from 'next/link';

import { Address } from '@/@types/common';
import { Strategy, SupportedChain } from '@/@types/enum';
import { Point } from '@/@types/vault';
import { useChainContext } from '@/app/_providers/ChainProvider';
import { NA_STRING } from '@/constants/common';
import useContractMapping from '@/hooks/useContractMapping';
import useVaultQueries from '@/hooks/useVaultQueries';
import { vaultCardMapping } from '@/services/vaultMapping';
import { toCompactNumber, toFixedNumber, withCommas } from '@/utils/number';

import Tooltip from '../shared/Tooltip';
import {
  ArbitrumIcon,
  EigenLayerIcon,
  EthereumIcon, // EthereumVaultIcon,
  InformationIcon,
  RenzoIcon,
  UsdcAssetIcon,
  ZircuitIcon,
} from '../shared/icons';
import PointCard from '../vault/point/PointCard';

type VaultCardProps = {
  slug: string;
  name: string;
  link?: string;
  apy?: number;
  maxCapacity?: number;
  available?: boolean;
  points?: Point[];
  strategy: Strategy;
  contractAddress: Address;
};

const VaultCard = (props: VaultCardProps) => {
  const {
    name,
    link = '#',
    apy = 0,
    maxCapacity,
    available = true,
    points,
    strategy,
    contractAddress,
  } = props;

  const { selectedChain } = useChainContext();

  const contracts = useContractMapping();

  const { color, vaultAbi } = vaultCardMapping(name, contracts);

  const { isLoadingTotalValueLocked, totalValueLocked } = useVaultQueries(
    vaultAbi,
    contractAddress,
  );

  const displayedStrategy = useMemo(() => {
    if (strategy === Strategy.OptionsWheel) {
      return 'Options Wheel';
    }

    return 'Delta Neutral';
  }, [strategy]);

  const badgeBg = color === 'default' ? 'bg-[#0E8484] bg-opacity-40' : 'bg-[#313C69] bg-opacity-60';

  return (
    <Card>
      <Link href={link} className="flex flex-col gap-6 p-8 text-primary">
        <div className="flex items-center justify-between bg-rock-grey01 px-6 py-4 rounded-2xl">
          <div>
            <p className="text-xl font-bold capitalize">{name}</p>
            {displayedStrategy.toLowerCase() !== name.toLowerCase() && (
              <p className="text-sm capitalize">{displayedStrategy}</p>
            )}
          </div>
          <UsdcAssetIcon className="w-10 h-10" />
        </div>

        <p className="text-sm font-light">
          At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium
          voluptatum deleniti atque corrupti quos dolores.
        </p>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-2 items-center bg-rock-grey01 p-4 rounded-2xl">
            <p className="text-sm opacity-60">APY</p>
            <p className="text-lg font-semibold">{`${withCommas(toFixedNumber(apy))}%`}</p>
          </div>

          <div className="flex flex-col gap-2 items-center bg-rock-grey01 p-4 rounded-2xl">
            <p className="text-sm opacity-60">TVL</p>
            <p className="text-lg font-semibold">
              {totalValueLocked.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-rock-grey01 p-4 rounded-2xl">
          {points && points.length > 0 && (
            <div className="grid grid-cols-2 gap-6">
              {points.map((x) => (
                <div key={x.name} className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1">
                    <RenzoIcon className="w-6 h-6" />
                    <span className="text-xs opacity-60">Renzo pts</span>
                  </div>
                  <p className="font-semibold">Variable</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-caption">
            <p>Max Capacity</p>
            <p>{maxCapacity ? toCompactNumber(maxCapacity) : NA_STRING}</p>
          </div>
          <div className="w-full h-1 bg-gray-300 rounded-full">
            <div
              className="h-1 bg-primary rounded-full"
              style={{ width: `${maxCapacity ? (totalValueLocked * 100) / maxCapacity : 0}%` }}
            ></div>
          </div>
        </div>
      </Link>
    </Card>
  );

  return (
    <Card>
      <Link href={link} className="flex flex-col">
        <div className="relative rounded-tl-2xl rounded-tr-2xl p-6 pb-10 xl:pb-14">
          <div
            className="absolute inset-0 rounded-tl-2xl rounded-tr-2xl"
            style={{
              opacity: 0.4,
              background:
                color === 'default'
                  ? 'linear-gradient(180deg, #0E8484 -60%, rgba(5, 41, 41) 70%)'
                  : 'linear-gradient(180deg, #313C69 -10%, rgba(31, 38, 66) 80%)',
            }}
          />
          <div className="relative flex items-center gap-2">
            <p
              className={`w-fit ${badgeBg} rounded-lg px-4 py-2 uppercase text-xs xl:text-sm font-semibold`}
            >
              {displayedStrategy}
            </p>
            <span className={`${badgeBg} rounded-lg px-1.5 py-1.5 xl:px-2.5 xl:py-2`}>
              {selectedChain === SupportedChain.Arbitrum ? (
                <ArbitrumIcon className="w-5 h-5" />
              ) : (
                <EthereumIcon className="w-5 h-5" />
              )}
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between gap-6 px-6 pt-10 xl:pt-16 pb-6">
          <div className="flex flex-col gap-6">
            <p className="text-lg xl:text-xl 2xl:text-2xl font-semibold uppercase">{name}</p>

            {points && points.length > 0 && (
              <div className="grid grid-cols-2 gap-6">
                {points.map((x) => (
                  <PointCard key={x.name} type={x.name} point={x.point} />
                ))}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-rock-sub-body">APY</p>

                <Tooltip
                  message={
                    <div>
                      <div className="flex justify-between text-sm text-rock-sub-body">
                        <p className="text-rock-light-blue">APY</p>
                        <p className="text-rock-light-blue justify-self-end">{`${withCommas(
                          toFixedNumber(apy),
                        )}%`}</p>
                      </div>
                      <p className="text-sm font-normal break-words mt-2">
                        Vault yield is calculated by annualizing monthly yield generated by the
                        vault. The monthly yield does not include any losses incurred by the vault
                      </p>
                    </div>
                  }
                >
                  <InformationIcon />
                </Tooltip>
              </div>
              <p className="text-lg xl:text-2xl font-semibold">{`${withCommas(
                toFixedNumber(apy),
              )}%`}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-rock-sub-body">Total value locked TVL</p>
              {!available ? (
                <p className="text-sm text-rock-yellow leading-8">Coming soon</p>
              ) : isLoadingTotalValueLocked ? (
                <p className="text-lg animate-pulse">Loading...</p>
              ) : (
                <p className="text-lg xl:text-2xl font-semibold">
                  {totalValueLocked.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0,
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="w-full h-1 bg-rock-gray bg-opacity-20 rounded-full">
              <div
                className="h-1 bg-white rounded-full"
                style={{ width: `${maxCapacity ? (totalValueLocked * 100) / maxCapacity : 0}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-sm text-caption">
              <p className="text-rock-sub-body">Max Capacity</p>
              <p>{maxCapacity ? toCompactNumber(maxCapacity) : NA_STRING}</p>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
};

export default VaultCard;
