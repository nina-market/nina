import React, { useState, useContext } from 'react'
import Typography from '@mui/material/Typography'
import Modal from '@mui/material/Modal'
import Backdrop from '@mui/material/Backdrop'
import Fade from '@mui/material/Fade'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import CloseIcon from '@mui/icons-material/Close'
import { styled } from '@mui/material/styles'
import Input from '@mui/material/Input'
import { encodeBase64 } from 'tweetnacl-util'
import { useWallet } from '@solana/wallet-adapter-react'
import { useSnackbar } from 'notistack'
import Release from '@nina-protocol/nina-internal-sdk/esm/Release'
import axios from 'axios'

const RedeemReleaseCode = (props) => {
  const { releasePubkey, gates } = props
  const { enqueueSnackbar } = useSnackbar()
  const wallet = useWallet()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState()

  const { getRelease } = useContext(Release.Context)
  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    try {
      if (wallet?.connected) {
        const message = new TextEncoder().encode(releasePubkey)
        const messageBase64 = encodeBase64(message)
        const signature = await wallet.signMessage(message)
        const signatureBase64 = encodeBase64(signature)

        await axios.post(
          `${process.env.NINA_IDENTITY_ENDPOINT}/releaseCodes/${code}/claim`,
          {
            publicKey: wallet?.publicKey?.toBase58(),
            message: messageBase64,
            signature: signatureBase64,
            releasePublicKey: releasePubkey,
          }
        )
        await getRelease(releasePubkey)
        enqueueSnackbar('Code claimed successfully', {
          variant: 'success',
        })
        setCode('')
      }
    } catch (error) {
      enqueueSnackbar('Code is either invalid or already claimed.', {
        variant: 'error',
      })
    }
  }
  return (
    <Root>
      <StyledButton onClick={() => setOpen(true)} gates={gates}>
        Redeem Release Code
      </StyledButton>

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
            <StyledTypography variant="body1" mb={1}>
              Enter your code below:
            </StyledTypography>

            <Input
              type="text"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Box mb={1}></Box>

            <Button
              variant="outlined"
              fullWidth
              onClick={(e) => handleCodeSubmit(e)}
            >
              <Typography variant="body2">Redeem</Typography>
            </Button>
          </StyledPaper>
        </Fade>
      </StyledModal>
    </Root>
  )
}

const Root = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  position: 'relative',
}))

const StyledButton = styled(Button)(({ theme, gates }) => ({
  position: gates ? 'absolute' : '',
  top: gates ? '110%' : '',
  textDecoration: 'underline',
  padding: '0px',
  marginTop: gates ? '8px' : '0px',
  color: theme.palette.grey[500],
  textTransform: 'capitalize',
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
const StyledModal = styled(Modal)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}))

const StyledTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.black,
}))

const StyledCloseIcon = styled(CloseIcon)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1),
  top: theme.spacing(1),
  cursor: 'pointer',
  color: theme.palette.black,
}))

export default RedeemReleaseCode
