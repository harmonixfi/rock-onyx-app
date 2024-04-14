'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';

import * as Sentry from '@sentry/nextjs';
import { ethers } from 'ethers';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { useAccount } from 'wagmi';

import { getUserPortfolio } from '@/api/vault';
import { FLOAT_REGEX } from '@/constants/regex';
import { useVaultDetailContext } from '@/contexts/VaultDetailContext';
import useAppConfig from '@/hooks/useAppConfig';
import useCompleteWithdrawal from '@/hooks/useCompleteWithdrawal';
import useInitiateWithdrawal from '@/hooks/useInitiateWithdrawal';
import useRockOnyxVaultQueries from '@/hooks/useRockOnyxVaultQueries';
import useTransactionStatusDialog from '@/hooks/useTransactionStatusDialog';
import { getDeltaNeutralWithdrawalDate, getOptionsWheelWithdrawalDate } from '@/utils/date';
import { toFixedNumber } from '@/utils/number';

import Tooltip from '../../shared/Tooltip';
import TransactionStatusDialog from '../../shared/TransactionStatusDialog';
import { QuestionIcon, RockOnyxTokenIcon, SpinnerIcon, WarningIcon } from '../../shared/icons';
import WithdrawCoolDown from './WithdrawCoolDown';

const rockOnyxUsdtVaultAddress = process.env.NEXT_PUBLIC_ROCK_ONYX_USDT_VAULT_ADDRESS;

type VaultWithdrawProps = {
  apr: number;
  withdrawalTime: string;
  withdrawalStep2: string;
};

const VaultWithdraw = (props: VaultWithdrawProps) => {
  const { withdrawalTime, withdrawalStep2 } = props;

  const params = useParams();

  const { vaultAbi, vaultAddress } = useVaultDetailContext();

  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [isCoolingDown, setIsCoolingDown] = useState(false);

  const { transactionBaseUrl } = useAppConfig();
  const { isOpen, type, url, onOpenDialog, onCloseDialog } = useTransactionStatusDialog();

  const { status, address } = useAccount();

  const {
    data: portfolio,
    isLoading: isLoadingPortfolio,
    mutate: refetchPortfolio,
  } = useSWR(address, getUserPortfolio);

  const {
    isInitiatingWithdrawal,
    isConfirmedInitiateWithdrawal,
    isInitiateWithdrawalError,
    initiateWithdrawalError,
    initiateWithdrawal,
  } = useInitiateWithdrawal(vaultAbi, vaultAddress);
  const {
    isCompletingWithdrawal,
    isConfirmedCompleteWithdrawal,
    isCompleteWithdrawalError,
    completeWithdrawalError,
    completeWithdrawalTransactionHash,
    completeWithdrawal,
  } = useCompleteWithdrawal(vaultAbi, vaultAddress);

  const {
    balanceOf,
    pricePerShare,
    availableWithdrawalAmount,
    withdrawPoolAmount,
    refetchBalanceOf,
    refetchAvailableWithdrawalAmount,
    refetchDeltaNeutralAvailableWithdrawalShares,
  } = useRockOnyxVaultQueries(vaultAbi, vaultAddress);

  const isEnableCompleteWithdraw =
    availableWithdrawalAmount > 0 && withdrawPoolAmount >= availableWithdrawalAmount;

  const handleRefetchAvailableWithdrawalAmount = () => {
    if (vaultAddress === rockOnyxUsdtVaultAddress) {
      refetchAvailableWithdrawalAmount();
    } else {
      refetchDeltaNeutralAvailableWithdrawalShares();
    }
  };

  useEffect(() => {
    if (isCoolingDown || isEnableCompleteWithdraw) {
      setInputValue(String(availableWithdrawalAmount));
    }
  }, [isCoolingDown, isEnableCompleteWithdraw, availableWithdrawalAmount]);

  useEffect(() => {
    if (isConfirmedInitiateWithdrawal) {
      refetchPortfolio();
      setInputValue('');
      onOpenDialog('success');
      refetchBalanceOf();
      handleRefetchAvailableWithdrawalAmount();
    }
  }, [isConfirmedInitiateWithdrawal]);

  useEffect(() => {
    if (isConfirmedCompleteWithdrawal) {
      refetchPortfolio();
      setInputValue('');
      onOpenDialog('success', `${transactionBaseUrl}/${completeWithdrawalTransactionHash}`);
      refetchBalanceOf();
      handleRefetchAvailableWithdrawalAmount();
    }
  }, [isConfirmedCompleteWithdrawal]);

  useEffect(() => {
    if (isInitiateWithdrawalError) {
      onOpenDialog('error');
      Sentry.captureException(initiateWithdrawalError);
      console.error(initiateWithdrawalError);
    }
  }, [isInitiateWithdrawalError]);

  useEffect(() => {
    if (isCompleteWithdrawalError) {
      onOpenDialog('error');
      Sentry.captureException(completeWithdrawalError);
      console.error(completeWithdrawalError);
    }
  }, [isCompleteWithdrawalError]);

  const handleInitiateWithdraw = async () => {
    const amount = ethers.utils.parseUnits(inputValue, 6);
    await initiateWithdrawal(amount);
  };

  const handleCompleteWithdraw = async () => {
    const amount = ethers.utils.parseUnits(inputValue, 6);
    await completeWithdrawal(amount);
  };

  const handleWithdraw = async () => {
    if (isEnableCompleteWithdraw) {
      handleCompleteWithdraw();
    } else {
      handleInitiateWithdraw();
    }
  };

  const handleChangeInputValue = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    if (value.match(FLOAT_REGEX)) {
      setInputValue(value);
      if (isEnableCompleteWithdraw) {
        if (Number(value) > availableWithdrawalAmount) {
          setInputError('Insufficient balance');
        } else {
          setInputError('');
        }
      } else {
        if (Number(value) > balanceOf) {
          setInputError('Insufficient balance');
        } else {
          setInputError('');
        }
      }
    }
  };

  const handleClickWithdrawAll = () => {
    setInputValue(balanceOf > 0 ? String(balanceOf) : '');
  };

  const isConnectedWallet = status === 'connected';

  const isWithdrawing = isInitiatingWithdrawal || isCompletingWithdrawal;

  const disabledButton =
    !isConnectedWallet || isWithdrawing || !inputValue || !!inputError || isCoolingDown;

  const withdrawalTargetDate = useMemo(() => {
    const position = portfolio?.positions?.find((x) => x.slug === params.slug);

    if (!position || !position.initiated_withdrawal_at) return null;

    if (vaultAddress === rockOnyxUsdtVaultAddress) {
      /** Options wheel vault: 8am UTC Friday */
      return getOptionsWheelWithdrawalDate().toISOString();
    }

    /** Delta neutral vault: after 4 hours from initiated_withdrawal_at */
    return getDeltaNeutralWithdrawalDate(position.initiated_withdrawal_at).toISOString();
  }, [vaultAddress, portfolio, params.slug]);

  useEffect(() => {
    if (withdrawalTargetDate) {
      setIsCoolingDown(true);
    }
  }, [withdrawalTargetDate]);

  return (
    <div>
      {!isConnectedWallet && (
        <div className="flex items-center gap-2 mt-12">
          <WarningIcon />
          <p className="text-sm font-normal text-rock-yellow">Please connect wallet to deposit</p>
        </div>
      )}

      <div className="mt-6 sm:mt-10">
        <p className="text-lg lg:text-xl font-semibold uppercase text-rock-gray">Rock onyx vault</p>
        <div className="flex flex-col gap-3 lg:gap-6 bg-rock-bg rounded-2xl mt-4 p-4 lg:p-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-rock-gray">Withdrawals</p>
              <Tooltip
                message={
                  <div className="flex flex-col gap-3">
                    <p>
                      If you want to withdraw funds that have been invested in the vault&apos;s
                      weekly options strategy, you need to follow a 2-step process:
                    </p>
                    <p>Step 1: You need to initiate the withdrawal request.</p>
                    <p>{`Step 2: ${withdrawalStep2}`}`</p>
                  </div>
                }
              >
                <QuestionIcon />
              </Tooltip>
            </div>
            <p>{withdrawalTime}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 sm:mt-12">
        <p className="text-lg lg:text-xl text-rock-gray font-semibold">roUSD AMOUNT</p>
        {!isLoadingPortfolio && !isCoolingDown && !isEnableCompleteWithdraw && (
          <button
            type="button"
            className="border border-rock-primary rounded-full px-3 py-1 text-sm font-light hover:ring-2 hover:ring-blue-800"
            onClick={handleClickWithdrawAll}
          >
            Withdraw all
          </button>
        )}
      </div>

      <div className="relative mt-3 sm:mt-6">
        <RockOnyxTokenIcon className="absolute top-1/2 left-3 -translate-y-1/2 w-12 h-12" />
        <input
          className={`w-full h-16 block bg-rock-bg rounded-xl pl-20 pr-3 text-2xl text-white ${
            !!inputError ? 'focus:ring-0 border border-red-600' : 'focus:ring-2'
          } focus:outline-none`}
          type="text"
          placeholder="0.0"
          disabled={!isConnectedWallet || isCoolingDown || isEnableCompleteWithdraw}
          value={inputValue}
          onChange={handleChangeInputValue}
        />
      </div>
      {!!inputError && <p className="text-red-600 text-sm font-light mt-1">{inputError}</p>}

      <div className="text-rock-gray mt-6 text-sm lg:text-base">
        {(!isCoolingDown || !withdrawalTargetDate) && (
          <>
            <div className="flex items-center justify-between">
              <p>Your available amount</p>
              <p>{`${toFixedNumber(balanceOf)} roUSD`}</p>
            </div>

            <div className="w-full h-[1px] my-3 lg:my-6 bg-rock-bg" />
          </>
        )}

        <div className="flex items-center justify-between">
          <p>You will receive</p>
          <p className="text-white">{`${toFixedNumber(
            (Number(inputValue) || 0) * pricePerShare,
          )} USDC`}</p>
        </div>
      </div>

      {isCoolingDown && withdrawalTargetDate && (
        <WithdrawCoolDown
          targetDate={withdrawalTargetDate}
          onCoolDownEnd={() => setIsCoolingDown(false)}
        />
      )}

      <button
        type="button"
        className={`w-full flex items-center justify-center gap-2 bg-rock-primary text-sm lg:text-base text-white font-light rounded-full mt-8 sm:mt-16 py-2.5 ${
          disabledButton ? 'bg-opacity-20 text-opacity-40' : ''
        } ${isWithdrawing ? 'animate-pulse' : ''}`}
        disabled={disabledButton}
        onClick={handleWithdraw}
      >
        {isWithdrawing && <SpinnerIcon className="w-6 h-6 animate-spin" />}
        {isCoolingDown || isEnableCompleteWithdraw ? 'Complete withdrawal' : 'Initiate withdrawal'}
      </button>

      <TransactionStatusDialog isOpen={isOpen} type={type} url={url} onClose={onCloseDialog} />
    </div>
  );
};

export default VaultWithdraw;
