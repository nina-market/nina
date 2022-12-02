import React, { useState, useEffect, useMemo, useContext } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import Box from "@mui/material/Box";
import makeStyles from "@mui/styles/makeStyles";
import { styled } from "@mui/material/styles";
import Hub from "@nina-protocol/nina-internal-sdk/esm/Hub";
import { imageManager } from "@nina-protocol/nina-internal-sdk/esm/utils";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import MenuIcon from "@mui/icons-material/Menu";

import {
  WalletDialogProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-material-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import Image from "next/image";
import NinaSdk from "@nina-protocol/js-sdk";
const { getImageFromCDN, loader } = imageManager;

const navData = [
  {
    label: "+ Publish",
    href: "/dashboard?action=publishRelease",
  },
  {
    label: "Dashboard",
    href: "/dashboard",
  },
];
const mobileNavData = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Hub Overview",
    href: "/dashboard",
  },
  {
    label: "Releases",
    href: "/dashboard?action=releases",
  },
  {
    label: "Posts",
    href: "/dashboard?action=posts",
  },
  {
    label: "Collaborators",
    href: "/dashboard?action=collaborators",
  },
];

const NavBar = ({ hubPubkey }) => {
  const { toolbar, drawerContainer } = useStyles();
  const wallet = useWallet();
  const [hubData, setHubData] = useState(null);
  const [mobileView, setMobileView] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    hubState,
    hubCollaboratorsState,
    filterHubCollaboratorsForHub,
    getHub,
    getHubsForUser,
  } = useContext(Hub.Context);
  const hubCollaborators = useMemo(
    () => filterHubCollaboratorsForHub(hubPubkey),
    [hubCollaboratorsState, hubPubkey]
  );

  useEffect(() => {
    const fetchHub = async () => {
      const { hub } = await NinaSdk.Hub.fetch(hubPubkey);
      setHubData(hub);
    };
    if (hubPubkey) {
      fetchHub();
    }
  }, [hubPubkey]);

  useEffect(() => {
    const setResponsiveness = () => {
      return window.innerWidth < 900
        ? setMobileView(true)
        : setMobileView(false);
    };

    setResponsiveness();

    window.addEventListener("resize", () => setResponsiveness());

    return () => {
      window.removeEventListener("resize", () => setResponsiveness());
    };
  }, []);

  const base58 = useMemo(
    () => wallet?.publicKey?.toBase58(),
    [wallet?.publicKey]
  );

  useEffect(() => {
    if (wallet.connected) {
      getHubsForUser(wallet.publicKey.toBase58());
    }
  }, [wallet.connected]);

  const walletDisplay = useMemo(() => {
    if (!wallet || !base58) return null;
    return base58.slice(0, 4) + ".." + base58.slice(-4);
  }, [wallet, base58]);

  const canAddContent = useMemo(() => {
    if (wallet?.connected && hubPubkey) {
      const hubCollaboratorForWallet = Object.values(hubCollaborators)?.filter(
        (hubCollaborator) =>
          hubCollaborator.collaborator === wallet?.publicKey?.toBase58()
      )[0];
      if (hubCollaboratorForWallet && hubCollaboratorForWallet.canAddContent) {
        return true;
      }
      if (wallet?.publicKey?.toBase58() === hubData?.authority) {
        return true;
      }
    }
    return false;
  }, [hubCollaborators, hubData, wallet]);

  const displayDesktop = () => {
    return (
      <Toolbar
        className={toolbar}
        style={{
          backgroundColor: "#66000000 !important",
          justifyContent: "space-between",
          flexDirection: "row",
        }}
      >
        {mobileView && canAddContent && displayMobile()}
        <Link href={`/${hubData?.handle || ""}`} passHref>
          <LogoLinkWrapper>
            {hubData?.data && (
              <Image
                loader={loader}
                src={getImageFromCDN(
                  hubData?.data?.image,
                  100,
                  new Date(hubData.datetime)
                )}
                height="50"
                width="50"
                alt="hub-logo"
              />
            )}
            {hubData?.data ? (
              <Typography style={{ marginLeft: "15px" }}>
                {hubData?.data.displayName}
              </Typography>
            ) : (
              <Typography variant="h4">NINA HUBS [beta]</Typography>
            )}
          </LogoLinkWrapper>
        </Link>
        <CtaWrapper>
          {!mobileView && canAddContent && getMenuButtons(hubData?.handle)}
          <WalletWrapper id="wallet-wrapper">
            <NavCtas>
              {wallet.wallets && (
                <StyledWalletDialogProvider featuredWallets={4}>
                  <StyledWalletButton>
                    <StyledWalletButtonTypography
                      variant="body1"
                      sx={{ textTransform: "none" }}
                    >
                      {wallet?.connected
                        ? `${wallet.wallet.adapter.name} – ${walletDisplay}`
                        : "Connect Wallet"}
                    </StyledWalletButtonTypography>
                  </StyledWalletButton>
                </StyledWalletDialogProvider>
              )}
            </NavCtas>
          </WalletWrapper>
        </CtaWrapper>
      </Toolbar>
    );
  };

  const displayMobile = () => {
    const handleDrawerOpen = () => setDrawerOpen(true);
    const handleDrawerClose = () => setDrawerOpen(false);

    return (
      <Toolbar>
        <IconButton
          {...{
            edge: "start",
            color: "inherit",
            "aria-label": "menu",
            "aria-haspopup": "true",
            onClick: handleDrawerOpen,
          }}
          style={{ color: "black" }}
        >
          <MenuIcon />
        </IconButton>

        <Drawer
          {...{
            anchor: "left",
            open: drawerOpen,
            onClose: handleDrawerClose,
          }}
          PaperProps={{ onClick: handleDrawerClose }}
        >
          <div className={drawerContainer}>{getDrawerChoices()}</div>
        </Drawer>
      </Toolbar>
    );
  };

  const getDrawerChoices = () => {
    return mobileNavData.map(({ label, href }) => {
      return (
        <Link
          key={label}
          {...{
            href,
            color: "inherit",
            style: { textDecoration: "none" },
            key: label,
          }}
        >
          <MenuItemContent>{label}</MenuItemContent>
        </Link>
      );
    });
  };

  const getMenuButtons = (hubHandle) => {
    return (
      <List>
        {navData.map(({ label, href }) => {
          href = `/${hubHandle}${href}`;
          return (
            <Link
              key={label}
              {...{
                href,
                key: label,
              }}
            >
              <MenuItemContent>{label}</MenuItemContent>
            </Link>
          );
        })}
      </List>
    );
  };

  return <StyledAppBar>{displayDesktop()}</StyledAppBar>;
};

export default NavBar;
const MenuItemContent = styled("span")(({ theme }) => ({
  color: theme.palette.text.primary,
  paddingRight: "15px",
  paddingLeft: "0px",
  "&:hover": {
    opacity: "50%",
    cursor: "pointer",
  },
}));

const WalletWrapper = styled(Box)(() => ({
  display: "flex",
}));

const LogoLinkWrapper = styled("a")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  textDecoration: "none",
  "&:hover": {
    opacity: 100,
  },
  "& p": {
    "&:hover": {
      opacity: "50%",
    },
  },
  "& .MuiTypography-h4": {
    fontWeight: "bold",
  },
  "& img": {
    [theme.breakpoints.down("md")]: {
      paddingTop: "15px !important",
    },
  },
}));

const NavCtas = styled("div")(() => ({
  display: "flex",
}));

const StyledWalletDialogProvider = styled(WalletDialogProvider)(
  ({ theme }) => ({
    "& .MuiList-root": {
      background: `${theme.palette.transparent} !important`,
    },
    "& .MuiButton-root": {
      backgroundColor: `${theme.palette.white}`,
    },
    "& .MuiButton-startIcon": {
      display: "none",
    },
    "& .MuiPaper-root": {
      width: "400px",
      height: "auto",
      ...theme.helpers.gradient,
      "& .MuiDialogTitle-root": {
        color: `${theme.palette.white} !important`,
        textAlign: "center",
        padding: "90px 0 0",
        textTransform: "uppercase",
        margin: "auto",
        background: "none !important",
        "& h2": {
          fontSize: "16px !important",
          fontWeight: "700",
          backgroundColor: `${theme.palette.transparent} !important`,
        },
        "& .MuiButtonBase-root": {
          display: "none",
        },
      },
      "& .MuiDialogContent-root": {
        padding: "24px",
      },
      "& .MuiListItem-root": {
        padding: `8px 24px`,
        boxShadow: "none",
        "&:hover": {
          boxShadow: "none",
        },
        "& .MuiButton-root": {
          width: "241px",
          margin: "auto",
          textAlign: "center",
          borderRadius: "50px",
          color: `${theme.palette.blue}`,
          fontSize: "10px",
          fontWeight: "700",
          justifyContent: "center",
          textTransform: "uppercase",
          "&:hover": {
            backgroundColor: `${theme.palette.blue}`,
            color: `${theme.palette.white}`,
          },
          "& .MuiButton-endIcon": {
            display: "none",
          },
        },
      },
    },
  })
);

const StyledWalletButtonTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  "&:hover": {
    opacity: "50%",
  },
}));

const StyledWalletButton = styled(WalletMultiButton)(({ theme }) => ({
  textTransform: "capitalize",
  paddingRight: "20px",
  paddingLeft: "20px",
  backgroundColor: `${theme.palette.transparent} !important`,
  boxShadow: "none !important",
  paddingTop: "0 !important",
  "& img": {
    display: "none",
  },
  "& .MuiButton-label": {
    border: "2px solid red",

    color: theme.palette.black,
  },
}));

const CtaWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  color: "black",
  paddingRight: "0px",
  paddingLeft: "0px",
  height: "64px",
  boxShadow: "none",
  position: "absolute",
  boxShadow: "none",
  width: "100% !important",
  "& p": {
    cursor: "pointer",
  },
  "@media (max-width: 900px)": {
    paddingLeft: 0,
    paddingBottom: "8px",
    position: "fixed",
  },
}));

const useStyles = makeStyles(({ theme }) => ({
  menuButton: {
    fontFamily: "Helvetica, Arial, sans-serif",
    size: "14px",
    marginLeft: "38px",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0px 15px",
  },
  drawerContainer: {
    padding: "20px 30px 20px 0",
    display: "flex",
    flexDirection: "column",
  },
}));
