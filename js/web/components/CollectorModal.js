import React, { useState, useContext, useEffect } from 'react'
import { styled } from '@mui/material/styles'
import Modal from '@mui/material/Modal'
import Backdrop from '@mui/material/Backdrop'
import Box from '@mui/material/Box'
import { Typography, Paper } from '@mui/material'
import { useWallet } from "@solana/wallet-adapter-react";
import ninaCommon from "nina-common";
import Link from "next/link";

const { ReleaseContext, NinaContext } = ninaCommon.contexts;

const CollectorModal = (props) => {
  const { releasePubkey, metadata } = props
  const wallet = useWallet();
  const { collection } = useContext(NinaContext)
  const { getCollectorsForRelease } = useContext(ReleaseContext)
  const [open, setOpen] = useState(false)
  const [collectors, setCollectors] = useState()
  useEffect(() => {
    handleGetCollectorsForRelease(releasePubkey)
  }, [collection])
  
  const handleGetCollectorsForRelease = async (releasePubkey) => {
    const collectorsList = await getCollectorsForRelease(releasePubkey)
    // Manually check if in user collection since script only updates collectors every hour
    // and websocket to update on each purchase can be inconsistent
    if (wallet?.publicKey) {
      if (collection[releasePubkey] > 0) {
        collectorsList.push(wallet.publicKey)
      } else if (collectorsList.includes(wallet.publicKey)) {
        collectorsList.remove(wallet.publicKey)
      }
    }
    setCollectors(collectorsList)
  }

  return (
    <Box color={'wj'}>
      <Cta onClick={() => setOpen(true)} variant="body2" align="left" paddingBottom="10px">
        {`View Collectors ${collectors ? `(${collectors.length})` : ''}`}
      </Cta>
      <StyledModal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        className={classes.modal}
        open={open}
        onClose={() => setOpen(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <StyledPaper>
          <Header>
            <Typography fontWeight="700">{`${metadata.properties.artist.substring(0, 100)} - "${metadata.properties.title.substring(0, 100)}" Collectors`}</Typography>
          </Header>
          <HistoryTable>
            <TableBody>
              {collectors &&
                collectors.map((entry, i) => {
                  return (
                    <tr key={i}>
                      <td>
                        <Link href={`/collection/${entry}`} passHref>
                          {`${entry} (View Collection)`}
                        </Link>
                      </td>
                    </tr>
                  )
                })}
            </TableBody>
          </HistoryTable>
        </StyledPaper>
      </StyledModal>
    </Box>
  )
}

const PREFIX = 'ExchangeHistoryModal'

const classes = {
  exchangeHistoryCta: `${PREFIX}-exchangeHistoryCta`,
  modal: `${PREFIX}-modal`,
  paper: `${PREFIX}-paper`,
  header: `${PREFIX}-header`,
  historyTable: `${PREFIX}-historyTable`,
  historyTableBody: `${PREFIX}-historyTableBody`,
}

const Cta = styled(Typography)(({ theme }) => ({
  cursor: 'pointer',
  '& span': {
    color: `${theme.palette.blue}`,
  },
  ':hover': {
    opacity: 0.5
  }
}))

const StyledModal = styled(Modal)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  'a:hover': {
    opacity: 0.5
  }
}))

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[5],
  padding: theme.spacing(6, 4),
  ...theme.gradient,
  zIndex: '10',
}))

const Header = styled(Typography)(({ theme }) => ({
  fontSize: '26px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  fontWeight: '700',
  lineHeight: '29.9px',
  color: theme.palette.white,
}))

const HistoryTable = styled('table')(({ theme }) => ({
  padding: `${theme.spacing(1, 1)}`,
  display: 'block',
  maxHeight: '50vh',
  overflow: 'scroll',
  color: theme.palette.white,
  [theme.breakpoints.down('md')]: {
    width: '80vw',
  },
  '& th': {
    textTransform: 'uppercase',
  },
}))

const TableBody = styled('tbody')(({ theme }) => ({
  '& td': {
    '& ': {
      padding: `${theme.spacing(0, 2)}`,
    },
    '& a': {
      color: `${theme.palette.white}`,
    },
  },
}))

export default CollectorModal
