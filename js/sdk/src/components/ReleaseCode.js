import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import axios from 'axios'
import { encodeBase64 } from 'tweetnacl-util'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Fade from '@mui/material/Fade'
import Modal from '@mui/material/Modal'
import Paper from '@mui/material/Paper'
import Backdrop from '@mui/material/Backdrop'
import { styled } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import TextField from '@mui/material/TextField'
import Dots from './Dots'
const ReleaseCode = ({ release, releasePubkey }) => {
  const [codes, setCodes] = useState()
  const [amount, setAmount] = useState()
  const wallet = useWallet()
  const [open, setOpen] = useState(false)
  const [pendingCodes, setPendingCodes] = useState(false)
  const [pendingFetchCodes, setPendingFetchCodes] = useState(false)
  // const [claimedStatus, setClaimedStatus] = useState(false)

  const handleGenerateCodes = async () => {
    setPendingCodes(true)
    const message = new TextEncoder().encode(releasePubkey)
    const messageBase64 = encodeBase64(message)
    const signature = await wallet.signMessage(message)
    const signatureBase64 = encodeBase64(signature)

    const response = await axios.post(
      `${process.env.NINA_IDENTITY_ENDPOINT}/releaseCodes`,
      {
        message: messageBase64,
        signature: signatureBase64,
        publicKey: wallet.publicKey.toBase58(),
        releasePubkey,
        amount,
      }
    )

    if (response.data) {
      setCodes(response.data.codes)
      setPendingCodes(false)
    }
  }

  const handleGetExistingCodes = async () => {
    setPendingFetchCodes(true)
    const message = new TextEncoder().encode(releasePubkey)
    const messageBase64 = encodeBase64(message)
    const signature = await wallet.signMessage(message)
    const signatureBase64 = encodeBase64(signature)

    const response = await axios.get(
      `${process.env.NINA_IDENTITY_ENDPOINT}/releases/${encodeURIComponent(
        releasePubkey
      )}/releaseCodes?message=${encodeURIComponent(
        messageBase64
      )}&signature=${encodeURIComponent(
        signatureBase64
      )}&publicKey=${encodeURIComponent(wallet.publicKey.toBase58())}`
    )

    if (response.data) {
      setCodes(response.data.codes)
    }
    setPendingFetchCodes(false)
  }

  // const handleClaimCode = async (code) => {
  //   const message = new TextEncoder().encode(wallet.publicKey.toBase58())
  //   const messageBase64 = encodeBase64(message)
  //   const signature = await wallet.signMessage(message)
  //   const signatureBase64 = encodeBase64(signature)

  //   const response = await axios.post(`${process.env.NINA_IDENTITY_ENDPOINT}/onboardingCodes/${code}`, {
  //     message: messageBase64,
  //     signature: signatureBase64,
  //     publicKey: wallet.publicKey.toBase58(),
  //   })

  //   if (response.data.success) {
  //     console.log('success')
  //     setClaimedStatus(true)
  //   }
  // }

  return (
    <>
      <Root>
        <Button
          variant="outlined"
          onClick={() => setOpen(true)}
          disabled={release.remainingSupply === 0}
          fullWidth
          sx={{
            mt: 1,
            '&:hover': {
              opacity: '50%',
            },
          }}
        >
          <Typography
            variant="body2"
            align="left"
            closed={release.remainingSupply === 0}
          >
            Manage Release Codes
          </Typography>
        </Button>
        <StyledModal
          aria-labelledby="transition-modal-title"
          aria-describedby="transition-modal-description"
          open={open}
          onClose={() => setOpen(false)}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
          }}
        >
          <Fade in={open}>
            <StyledPaper>
              <StyledCloseIcon onClick={() => setOpen(false)} />

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px 0px',
                }}
              >
                <TextField
                  id="standard-number"
                  label="Number of codes to generate:"
                  type="number"
                  value={amount}
                  inputProps={{
                    onChange: (event) => setAmount(event.target.value),
                    inputMode: 'numeric',
                    min: 1,
                  }}
                  variant="standard"
                />
                <Box></Box>
                <Button
                  variant="outlined"
                  fullWidth
                  disabled={!amount || amount == 0}
                  onClick={() => handleGenerateCodes()}
                  sx={{ marginTop: '8px' }}
                >
                  {pendingCodes ? (
                    <Dots
                      msg={amount > 1 ? 'Generating codes' : 'Generating code'}
                    />
                  ) : amount > 1 || !amount || amount == 0 ? (
                    'Generate Codes'
                  ) : (
                    'Generate Code'
                  )}
                </Button>
                <Box></Box>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleGetExistingCodes()}
                  sx={{ marginTop: '8px' }}
                >
                  {pendingFetchCodes ? (
                    <Dots msg="Getting existing codes" />
                  ) : (
                    'Get Existing Codes'
                  )}
                </Button>
                <ul>
                  {codes &&
                    codes.map((code) => {
                      return (
                        <StyledListItem
                          key={code.code}
                          className={code.claimedBy ? 'claimed' : ''}
                        >
                          {code.code}
                        </StyledListItem>
                      )
                    })}
                </ul>
              </Box>
            </StyledPaper>
          </Fade>
        </StyledModal>
      </Root>
    </>
  )
}

const Root = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
}))

const StyledListItem = styled('li')(() => ({
  '&.claimed': {
    textDecoration: 'line-through',
  },
}))

const StyledModal = styled(Modal)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}))

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: '2px solid #000',
  boxShadow: theme.shadows[5],
  padding: theme.spacing(2, 4, 3),
  width: '40vw',
  maxHeight: '90vh',
  overflowY: 'auto',
  zIndex: '10',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  [theme.breakpoints.down('md')]: {
    width: 'unset',
    margin: '15px',
    padding: theme.spacing(2),
  },
}))

const StyledCloseIcon = styled(CloseIcon)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1),
  top: theme.spacing(1),
  color: theme.palette.black,
  cursor: 'pointer',
}))

export default ReleaseCode
