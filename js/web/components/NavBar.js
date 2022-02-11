import React, { useContext, useMemo, useState, useEffect } from 'react'
import { styled } from '@mui/material/styles'
import { Typography, Box } from '@mui/material'
import Tooltip from '@mui/material/Tooltip'
import nina from "@nina-protocol/nina-sdk";
import NavDrawer from './NavDrawer'
import { withFormik } from 'formik'
import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  WalletDialogProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-material-ui'
import Breadcrumbs from './Breadcrumbs'
const { NinaContext } = nina.contexts

const NavBar = () => {
  const { healthOk, usdcBalance } = useContext(NinaContext)
  const wallet = useWallet()
  const base58 = useMemo(
    () => wallet?.publicKey?.toBase58(),
    [wallet?.publicKey]
  )
  const walletDisplay = useMemo(() => {
    if (!wallet || !base58) return null
    return base58.slice(0, 4) + '..' + base58.slice(-4)
  }, [wallet, base58])
  const [connectedString, setConnectedString] = useState()

  useEffect(() => {
    setConnectedString(healthOk ? 'connected-healthy' : 'connected-unhealthy')
  }, [healthOk])

  return (
    <Root>
      <NavLeft>
        <NavDrawer />
        <Breadcrumbs />
      </NavLeft>

      <Logo>
        <Link href="/" passHref>
          <Typography variant="h4">NINA</Typography>
        </Link>
      </Logo>

      <NavRight>
        <DesktopWalletWrapper>
          <NavBalance variant="subtitle1">
            {wallet?.connected ? `Balance: $${usdcBalance}` : null}
          </NavBalance>
          <NavCtas>
            {wallet.wallets &&
              <StyledWalletDialogProvider featuredWallets={4}>
                <StyledWalletButton>
                  <Typography variant="subtitle1" sx={{ textTransform: 'none' }}>
                    {wallet?.connected
                      ? `${wallet.wallet.adapter.name} – ${walletDisplay}`
                      : 'Connect Wallet'}
                  </Typography>
                </StyledWalletButton>
                <Tooltip
                  title={
                    healthOk
                      ? 'Network Status: Good'
                      : 'Network Status: Degraded - Transactions may fail.'
                  }
                  placement="bottom-end"
                >
                  <ConnectionDot
                    className={`${classes.connectionDot} ${
                      wallet?.connected ? connectedString : ''
                    }`}
                  ></ConnectionDot>
              </Tooltip>
            </StyledWalletDialogProvider>
            }
          </NavCtas>
        </DesktopWalletWrapper>
      </NavRight>
    </Root>
  )
}

const PREFIX = 'NavBar'

const classes = {
  nav: `${PREFIX}-nav`,
  walletDialogProvider: `${PREFIX}-walletDialogProvider`,
  walletButtonWrapper: `${PREFIX}-walletButtonWrapper`,
  connectionDot: `${PREFIX}-connectionDot`,
}

const Root = styled('nav')(({ theme }) => ({
  background: `${theme.palette.transparent}`,
  height: '30px',
  width: '100vw',
  zIndex: '12',
  padding: theme.spacing(1, 0),
  marginBottom: '0.5rem',
  position: 'fixed',
  top: '0',
  left: '0',
}))

const NavLeft = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  paddingLeft: theme.spacing(1),
}))

const NavRight = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  position: 'absolute',
  right: theme.spacing(1),
  top: '12px',
  [theme.breakpoints.down('md')]: {
    position: 'absolute',
    right: 0,
    top: '10px',
  },
}))

const NavCtas = styled('div')(() => ({
  display: 'flex',
  alignItems: 'flex-start',
}))

const NavBalance = styled(Typography)(({ theme }) => ({
  color: theme.palette.blue,
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}))

const Logo = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'min-content',
  cursor: 'pointer',
  '&:hover': {
    color: theme.palette.blue,
  },
  '& .MuiTypography-h4': {
    fontWeight: 'bold',
  },
}))

const DesktopWalletWrapper = styled(Box)(() => ({
  display: 'flex',
}))

const StyledWalletDialogProvider = styled(WalletDialogProvider)(
  ({ theme }) => ({
    '& .MuiButton-root': {
      backgroundColor: `${theme.palette.white}`,
    },
    '& .MuiButton-startIcon': {
      display: 'none',
    },
    '& .MuiPaper-root': {
      width: '400px',
      height: 'auto',
      ...theme.helpers.gradient,
      '& .MuiDialogTitle-root': {
        color: `${theme.palette.white}`,
        textAlign: 'center',
        padding: `${theme.spacing(6, 0, 0)}`,
        textTransform: 'uppercase',
        '& h2': {
          fontSize: '16px !important',
          fontWeight: '700',
        },
        '& .MuiButtonBase-root': {
          display: 'none',
        },
      },
      '& .MuiListItem-gutters': {
        padding: `${theme.spacing(0.5, 0)}`,
        '& .MuiButton-root': {
          width: '241px',
          margin: 'auto',
          backgroundColor: `${theme.palette.white}`,
          borderRadius: '50px',
          color: `${theme.palette.blue}`,
          fontSize: '10px',
          fontWeight: '700',
          '&:hover': {
            backgroundColor: `${theme.palette.blue}`,
            color: `${theme.palette.white}`,
          },
          '& .MuiButton-endIcon': {
            display: 'none',
          },
        },
      },
    },
  })
)

const StyledWalletButton = styled(WalletMultiButton)(({ theme }) => ({
  textTransform: 'capitalize',
  paddingRight: '20px',
  paddingLeft: '20px',
  backgroundColor: `${theme.palette.transparent} !important`,
  boxShadow: 'none !important',
  paddingTop: '0 !important',

  '& img': {
    display: 'none',
  },
  '& .MuiButton-label': {
    color: theme.palette.black,
  },
  '& .MuiButton-label:hover': {
    color: theme.palette.blue,
  },
}))

const ConnectionDot = styled('span')(({ theme }) => ({
  height: '11px',
  width: '14px',
  backgroundColor: theme.palette.red,
  borderRadius: '50%',
  display: 'inline-block',
  marginTop: '2px',
  '&.connected-healthy': {
    backgroundColor: theme.palette.green,
  },
  '&.connected-unhealthy': {
    backgroundColor: theme.palette.yellow,
  },
  [theme.breakpoints.down('md')]: {
    marginRight: '15px',
  },
}))

export default withFormik({
  enableReinitialize: true,
  mapPropsToValues: () => {
    return {
      query: '',
    }
  },
})(NavBar)
