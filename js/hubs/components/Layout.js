import React, { useContext, useEffect, useState, useMemo } from "react";
import Container from "@mui/material/Container";
import { styled } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import CssBaseline from "@mui/material/CssBaseline";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import Hub from "@nina-protocol/nina-internal-sdk/esm/Hub";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { lightThemeOptions } from "../styles/theme/lightThemeOptions";
import Head from "next/head";
import NinaSdk from "@nina-protocol/js-sdk";
import { initSdkIfNeeded } from "@nina-protocol/nina-internal-sdk/src/utils/sdkInit";

const NavBar = dynamic(() => import("./NavBar"));
const AudioPlayer = dynamic(() => import("./AudioPlayer"));
const lightTheme = createTheme(lightThemeOptions);

const Layout = ({ children, loading }) => {
  const router = useRouter();
  const [hubPubkey, setHubPubkey] = useState(undefined);
  const { hubState, getHub } = useContext(Hub.Context);

  useEffect(() => {
    const getHubPubkey = async (handle) => {
      try {
        await initSdkIfNeeded();
        const publicKey = (await NinaSdk.Hub.fetch(handle)).hub.publicKey;
        setHubPubkey(publicKey);
      } catch (error) {
        setHubPubkey(undefined);
      }
    };
    if (router.query.hubPubkey) {
      getHubPubkey(router.query.hubPubkey);
    } else {
      setHubPubkey(undefined);
    }
  }, [router.query.hubPubkey]);

  useEffect(() => {
    if (hubPubkey) {
      getHub(hubPubkey);
    }
  }, [hubPubkey]);

  const hubData = useMemo(() => hubState[hubPubkey], [hubState, hubPubkey]);

  useEffect(() => {
    if (
      router.pathname.includes("/[hubPubkey]") &&
      !router.pathname.includes("/dashboard")
    ) {
      if (hubData?.data.backgroundColor) {
        lightTheme.palette.background.default = hubData.data.backgroundColor;
      } else {
        lightTheme.palette.background.default = "#ffffff";
      }
      if (hubData?.data.textColor) {
        lightTheme.palette.text.primary = hubData.data.textColor;
        lightTheme.palette.primary.main = hubData.data.textColor;
        lightTheme.components.MuiTypography.styleOverrides.root.color =
          hubData.data.textColor;
        lightTheme.components.MuiCssBaseline.styleOverrides.a.color =
          hubData.data.textColor;
      } else {
        lightTheme.palette.text.primary = "#000000";
        lightTheme.palette.primary.main = "#000000";
        lightTheme.components.MuiTypography.styleOverrides.root.color =
          "#000000";
        lightTheme.components.MuiCssBaseline.styleOverrides.a.color = "#000000";
      }
    } else {
      lightTheme.palette.background.default = "#ffffff";
      lightTheme.palette.text.primary = "#000000";
      lightTheme.palette.primary.main = "#000000";
      lightTheme.components.MuiTypography.styleOverrides.root.color = "#000000";
      lightTheme.components.MuiCssBaseline.styleOverrides.a.color = "#000000";
    }
  }, [hubData, router]);

  useEffect(() => {
    if (router.pathname === "/404" && hubState) {
      let hubHandle = router.asPath.split("/")[1];
      hubPubkey = Object.values(hubState).find(
        (hub) => hub.handle === hubHandle
      )?.publicKey;
      setHubPubkey(hubPubkey);
    }
  }, [router.pathname, hubState]);

  if (children.props.isEmbed) {
    return <main className={classes.bodyContainer}>{children}</main>;
  }

  let topSpace = "125px";

  if (router.pathname.includes("/releases")) {
    topSpace = "80px";
  }

  if (router.pathname === "/" || router.pathname.includes("/create")) {
    topSpace = "45px";
  }

  return (
    <ThemeProvider theme={lightTheme}>
      <Head>
        <meta
          name="theme-color"
          content={lightTheme.palette.background.default}
          key="theme"
        />
      </Head>
      <Root>
        <CssBaseline>
          <Container
            maxWidth={false}
            disableGutters
            className={classes.mainContainer}
          >
            <main className={classes.bodyContainer}>
              <NavBar hubPubkey={hubPubkey} loading={loading} />
              <Grid
                container
                columns={{ xs: 12, sm: 12, md: 12 }}
                sx={{
                  marginTop: { md: topSpace, xs: "0px" },
                  minHeight: `calc(100% - ${topSpace})`,
                  justifyContent: { xs: "center" },
                }}
              >
                {children}
              </Grid>
              <AudioPlayerWrapper>
                <AudioPlayer hubPubkey={hubPubkey} />
              </AudioPlayerWrapper>
            </main>
          </Container>
        </CssBaseline>
      </Root>
    </ThemeProvider>
  );
};

const PREFIX = "Layout";

const classes = {
  mainContainer: `${PREFIX}-mainContainer`,
  bodyContainer: `${PREFIX}-bodyContainer`,
};

const Root = styled("div")(({ theme }) => ({
  [`& .${classes.mainContainer}`]: {
    minHeight: "100vh",
    height: "100vh",
    width: "100vw",
    overflowX: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: theme.palette.background.default,

    [theme.breakpoints.down("md")]: {
      overflowY: "scroll",
      minHeight: "unset",
      height: "unset",
      "&:-webkit-scrollbar": {
        display: "none !important",
      },
    },
  },

  [`& .${classes.bodyContainer}`]: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    textAlign: "center",
    minHeight: "100%",
    overflow: "hidden",
    background: theme.palette.background.default,
    [theme.breakpoints.down("md")]: {
      overflowY: "scroll",
      height: "100vh",
      "&::-webkit-scrollbar": {
        display: "none !important",
      },
    },
  },
}));

const AudioPlayerWrapper = styled("div")(({ theme }) => ({
  position: "fixed",
  bottom: 0,
  left: 0,
  paddingLeft: "8px",
  textAlign: "left",
  width: "30vw",
  paddingBottom: "0",
  [theme.breakpoints.down("md")]: {
    paddingLeft: "0px",
  },
}));
export default Layout;
