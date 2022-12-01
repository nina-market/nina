/* eslint-disable react/jsx-filename-extension */
/* eslint-disable @next/next/no-sync-scripts */
import React from "react";
import Document, { Html, Head, Main, NextScript } from "next/document";
import createEmotionServer from "@emotion/server/create-instance";
import createEmotionCache from "../createEmotionCache";
import { styled } from "@mui/material/styles";

// const sheets = new ServerStyleSheets();
class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const originalRenderPage = ctx.renderPage;

    // You can consider sharing the same emotion cache between all the SSR requests to speed up performance.
    // However, be aware that it can have global side effects.
    const cache = createEmotionCache();
    const { extractCriticalToChunks } = createEmotionServer(cache);

    ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: (App) =>
          function EnhanceApp(props) {
            return <App emotionCache={cache} {...props} />;
          },
      });

    const initialProps = await Document.getInitialProps(ctx);
    // This is important. It prevents emotion to render invalid HTML.
    // See https://github.com/mui/material-ui/issues/26561#issuecomment-855286153
    const emotionStyles = extractCriticalToChunks(initialProps.html);
    const emotionStyleTags = emotionStyles.styles.map((style) => (
      <style
        data-emotion={`${style.key} ${style.ids.join(" ")}`}
        key={style.key}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: style.css }}
      />
    ));

    return {
      ...initialProps,
      emotionStyleTags,
    };
  }

  render() {
    return (
      <Html>
        <Head>
          <meta name="Content-Type" content="text/html; charset=UTF-8" />
          <link rel="icon" href="/images/favicon.ico" />
          <link rel="apple-touch-icon" href="/images/logo192.png" />
          <link rel="manifest" href="/manifest.json" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
          />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/icon?family=Material+Icons"
          />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/images/apple-touch-icon.png"
          />
          <link
            rel="shortcut icon"
            type="image/png"
            sizes="32x32"
            href="/images/favicon-32x32.png"
          />
          <link
            rel="shortcut icon"
            type="image/png"
            sizes="16x16"
            href="/images/favicon-16x16.png"
          />
          <link rel="manifest" href="/site.webmanifest" />
          <script
            defer
            src="https://www.googletagmanager.com/gtag/js?id=G-VDD58V1D22"
          />
          {process.env.SOLANA_CLUSTER === "mainnet" && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', 'G-VDD58V1D22', { page_path: window.location.pathname, app_name: 'hubs' });
                `,
              }}
            />
          )}
          {this.props.emotionStyleTags}
        </Head>
        <StyledBody style={{ margin: "0px", position: "relative" }}>
          <Main />
          <NextScript />
        </StyledBody>
      </Html>
    );
  }
}
const StyledBody = styled("body")(({ theme }) => ({
  margin: "0px",
  position: "relative",
  [theme.breakpoints.down("md")]: {
    "&::-webkit-scrollbar": {
      display: "none !important",
    },
  },
}));
export default MyDocument;
