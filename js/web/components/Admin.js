import React, { useState, useEffect, useContext } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { encodeBase64 } from 'tweetnacl-util'
import axios from 'axios'
import Typography from '@mui/material/Typography'
import ScrollablePageWrapper from './ScrollablePageWrapper'
import Button from '@mui/material/Button'
import Input from '@mui/material/Input'
import Box from '@mui/material/Box'
import { useRouter } from 'next/router'
import Nina from '@nina-protocol/nina-internal-sdk/esm/Nina'
import onboardingCodeWhitelist from '@nina-protocol/nina-internal-sdk/src/utils/onboardingCodeWhitelist'
const Admin = () => {
  const wallet = useWallet()
  const router = useRouter()
  const walletPubkey = wallet.publicKey?.toBase58()
  const hasAccess = onboardingCodeWhitelist.includes(walletPubkey)
  const [code, setCode] = useState()
  const { getSolBalanceForPublicKey } = useContext(Nina.Context)
  const [verificationBalance, setVerificationBalance] = useState(0)
  const [dispatcherBalance, setDispatcherBalance] = useState(0)

  useEffect(() => {
    fetchWalletBalance(
      'idHukURpSwMbvcRER9pN97tBSsH4pdLSUhnHYwHftd5',
      setVerificationBalance
    )
    fetchWalletBalance(
      'BnhxwsrY5aaeMehsTRoJzX2X4w5sKMhMfBs2MCKUqMC',
      setDispatcherBalance
    )
    console.log('verificationBalance', verificationBalance)
    console.log('dispatcherBalance', dispatcherBalance)
  }, [verificationBalance, dispatcherBalance])

  const fetchWalletBalance = async (publicKey, setBalance) => {
    await getSolBalanceForPublicKey(publicKey).then((balance) => {
      setBalance(balance)
    })
  }

  const handleGenerateCode = async () => {
    const message = new TextEncoder().encode(wallet.publicKey.toBase58())

    const messageBase64 = encodeBase64(message)
    const signature = await wallet.signMessage(message)
    const signatureBase64 = encodeBase64(signature)

    const response = await axios.post(
      `${process.env.NINA_IDENTITY_ENDPOINT}/onboardingCodes`,
      {
        message: messageBase64,
        signature: signatureBase64,
        publicKey: wallet.publicKey.toBase58(),
      }
    )

    if (response.data) {
      setCode(response.data.onboardingCode.code)
    }
  }

  // const handleClaimCode = async (code) => {
  //   const message = new TextEncoder().encode(wallet.publicKey.toBase58())
  //   const messageBase64 = encodeBase64(message)
  //   const signature = await wallet.signMessage(message)
  //   const signatureBase64 = encodeBase64(signature)
  //   try {
  //     const response = await axios.post(
  //       `${process.env.NINA_IDENTITY_ENDPOINT}/onboardingCodes/${code}`,
  //       {
  //         message: messageBase64,
  //         signature: signatureBase64,
  //         publicKey: wallet.publicKey.toBase58(),
  //       }
  //     )
  //     if (response.data.success) {
  //       enqueueSnackbar('Code has been successfully redeemed', {
  //         info: 'success',
  //       })
  //       setClaimedError(false)
  //       setClaimedCodeSuccess(true)
  //     }
  //     return
  //   } catch (error) {
  //     enqueueSnackbar('Code has already been redeemed or is invalid', {
  //       variant: 'error',
  //     })
  //     console.error(error)
  //     setClaimedError(true)
  //   }
  // }
  return (
    <ScrollablePageWrapper>
      {hasAccess && (
        <Box>
          <Box>
            <Typography variant="h4" mb={2}>
              {verificationBalance > 0
                ? `Verification Wallet Balance: ${verificationBalance} SOL`
                : 'Verification Wallet Balance: 0 SOL'}
            </Typography>
            <Typography variant="h4" mb={2}>
              {dispatcherBalance > 0
                ? `Dispatcher Wallet Balance: ${dispatcherBalance} SOL`
                : 'Dispatcher Wallet Balance: 0 SOL'}
            </Typography>
          </Box>
          <Box mb={2}>
            <Button variant="outlined" onClick={() => handleGenerateCode()}>
              Click Here to Generate an Onboarding Code
            </Button>
          </Box>
          <Typography for="code" mb={1}>
            If generated successfully, onboarding Code should print below
          </Typography>
          <Input
            type="text"
            id="code"
            name="code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            sx={{ width: '25vw' }}
          />
        </Box>
      )}
    </ScrollablePageWrapper>
  )
}

export default Admin
