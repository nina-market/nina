import React, { useState, useContext, useEffect } from 'react'
import { styled } from '@mui/material/styles'
import ninaCommon from 'nina-common'
import { useWallet } from '@solana/wallet-adapter-react'
import Drawer from '@mui/material/Drawer'
import Button from '@mui/material/Button'
import {Typography, Box} from '@mui/material'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import { NavLink } from 'react-router-dom'
import { Icon } from '@material-ui/core'
import hamburger from '../assets/hamburger.svg'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faDiscord} from '@fortawesome/free-brands-svg-icons'
import {faTwitter} from '@fortawesome/free-brands-svg-icons'

const { NinaContext, ReleaseContext } = ninaCommon.contexts

const linksConnected = [
  'home',
  'collection',
  'releases',
  'upload',
  'faq',
]

const linksNotConnected = ['home', 'upload', 'faq']

const NavDrawer = () => {
  const { collection } = useContext(NinaContext)
  const wallet = useWallet()
  const {
    releaseState,
    getReleasesPublishedByUser,
    filterReleasesPublishedByUser,
    filterReleasesUserCollection,
  } = useContext(ReleaseContext)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [userPublishedReleasesCount, setUserPublishedReleasesCount] = useState()
  const [userCollectionReleasesCount, setUserCollectionReleasesCount] =
    useState()
  const [links, setLinks] = useState(linksNotConnected)

  useEffect(() => {
    if (wallet?.connected) {
      setLinks(linksConnected)
      getReleasesPublishedByUser()
    } else {
      setLinks(linksNotConnected)
    }
  }, [wallet?.connected])

  useEffect(() => {
    if (wallet?.connected) {
      setUserPublishedReleasesCount(filterReleasesPublishedByUser().length)
      setUserCollectionReleasesCount(filterReleasesUserCollection().length)
    }
  }, [releaseState, collection])

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return
    }
    setDrawerOpen(open)
  }

  const list = () => (
    <Box
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <StyledList disablePadding>
        {links.map((link) => {
          switch (link) {
            case 'collection':
              return (
                <NavLink
                  className={`${classes.drawerLink}`}
                  to={`/${link}`}
                  activeClassName={`${classes.drawerLink} ${classes.drawerLink}--active  `}
                  key={link}
                >
                  <ListItem button key={link}>
                    <ListItemText
                      primary={`your ${link}  ${
                        userCollectionReleasesCount
                          ? `(${userCollectionReleasesCount})`
                          : ''
                      }`}
                    />
                  </ListItem>
                </NavLink>
              )
            case 'releases':
              return (
                <NavLink
                  className={`${classes.drawerLink}`}
                  to={`/${link}`}
                  activeClassName={`${classes.drawerLink} ${classes.drawerLink}--active  `}
                  key={link}
                >
                  <ListItem button key={link}>
                    <ListItemText
                      primary={`your ${link}  ${
                        userPublishedReleasesCount
                          ? `(${userPublishedReleasesCount})`
                          : ''
                      }`}
                    />
                  </ListItem>
                </NavLink>
              )
            default:
              return (
                <NavLink
                  className={`${classes.drawerLink}`}
                  to={`${link === 'home' ? '/' : `/${link}`}`}
                  activeClassName={`${classes.drawerLink} ${classes.drawerLink}--active  `}
                  key={link}
                >
                  <ListItem button key={link}>
                    <ListItemText primary={link} />
                  </ListItem>
                </NavLink>
              )
          }
        })}
      </StyledList>
    </Box>
  )

  return (
    <div>
      {
        <Box key={'left'}>
          <StyledMenuButton onClick={toggleDrawer(true)}>
            <Icon>
              <img src={hamburger} height={25} width={25} />
            </Icon>
          </StyledMenuButton>
          <StyledDrawer
            anchor={'left'}
            open={drawerOpen}
            onClose={toggleDrawer(false)}
            BackdropProps={{ invisible: true }}
          >
            {list()}

            <DrawerFooter >
              <Box>
                <a
                  href="https://twitter.com/nina_market_"
                  target="_blank"
                  rel="noreferrer"
                  style={{paddingRight: '15px'}}
                >
                  <FontAwesomeIcon icon={faTwitter} />
                </a>
                <a
                  href="https://discord.gg/EqaCvgRn"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FontAwesomeIcon icon={faDiscord} />
                </a>
              </Box>

              <Typography variant="subtitle1" >
                © 2021 Nina Protocol Corp
              </Typography>
            </DrawerFooter>


          </StyledDrawer>
        </Box>
      }
    </div>
  )
}

const PREFIX = 'NavDrawer'

const classes = {
  toggle: `${PREFIX}-toggle`,
  list: `${PREFIX}-list`,
  drawerLink: `${PREFIX}-drawerLink`,
}

const StyledDrawer = styled(Drawer)(() => ({
  '& .MuiPaper-root': {
    width: 436,
  },
}))

const StyledList = styled(List)(({ theme }) => ({
  padding: `${theme.spacing('100px', 4, 0, 4)} !important`,
  '& .MuiListItem-root': {
    padding: '5px 0',
    '&:hover': {
      backgroundColor: theme.palette.transparent,
    },
    '& .MuiListItemText-root': {
      margin: 0,
      '& span': {
        textTransform: 'capitalize',
        fontSize: '18px !important',
        lineHeight: '20.7px !important',
      }
    },
  },
}))

const StyledMenuButton = styled(Button)(({ theme }) => ({
  padding: '0px !important',
  '&:hover': {
    backgroundColor: `${theme.palette.transparent} !important`,
  },
  '& .MuiSvgIcon-root': {
    color: theme.palette.black,
  },
}))

const DrawerFooter = styled(Box)(() => ({
  position: 'absolute',
  bottom: '10px',
  width: '75%',
  left: '60px',
  transform: 'translateY(-50%)',
  display: 'flex',
  justifyContent: 'space-between'
}))

export default NavDrawer
