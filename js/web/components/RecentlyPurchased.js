import React from "react";
import ninaCommon from "nina-common";
import { styled } from "@mui/material/styles";
// import 'react-multi-carousel/lib/styles.css'
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Link from "next/link";
// import SmoothImage from 'react-smooth-image'
// import Image from "next/image";
import Image from "./Image";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import Button from "@mui/material/Button";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
const { Dots } = ninaCommon.components;

const RecentlyPurchased = (props) => {
  const { releases } = props;
  if (releases === undefined || releases.length === 0) {
    return (
      <RecentlyPurchasedContainer
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Dots size="80px" />
      </RecentlyPurchasedContainer>
    );
  }

  const responsive = {
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 1,
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 1,
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
      slidesToSlide: 1,
    },
  };

  const buttonStyle = {
    position: "absolute",
    color: "black",
    backgroundColor: "red !important",
    "&:hover": {
      backgroundColor: "black !important",
    },
    "& ::before": {
      display: "none",
    },
  };

  const CustomRightArrow = ({ onClick }) => {
    return (
      <Button
        className="testclass"
        style={{
          right: "10%",
          top: "75%",
          fontSize: "50px",
          ...buttonStyle,
        }}
      >
        <KeyboardArrowRightIcon fontSize="inherit" onClick={() => onClick()} />
      </Button>
    );
  };
  const CustomLeftArrow = ({ onClick }) => {
    return (
      <Button style={{ display: "none", ...buttonStyle }}>
        <KeyboardArrowLeftIcon fontSize="large" onClick={() => onClick()} />
      </Button>
    );
  };

  return (
    <>
      <RecentlyPurchasedContainer>
        <Typography align="left" className={classes.sectionHeader}>
          Market Movers
        </Typography>
        <Box>
          {releases?.length > 0 && (
            <Carousel
              showDots={false}
              showArrows={false}
              draggable={true}
              responsive={responsive}
              infinite={true}
              autoPlay={true}
              autoPlaySpeed={4000}
              keyBoardControl={true}
              transitionDuration={700}
              customTransition="transform 700ms ease-in-out"
              slidesToSlide={1}
              containerClass="carousel-container"
              removeArrowOnDeviceType={["tablet", "mobile"]}
              customRightArrow={<CustomRightArrow />}
              customLeftArrow={<CustomLeftArrow />}
            >
              {releases.map((release, i) => {
                const releaseDate = new Date(
                  release.tokenData.releaseDatetime.toNumber() * 1000
                );
                const dateNow = new Date();
                const differenceTime =
                  dateNow.getTime() - releaseDate.getTime();
                const dayDifference = Math.round(
                  differenceTime / (1000 * 3600 * 24)
                );
                let dayCopy = `in the last ${dayDifference} days`;
                if (dayDifference === 0) {
                  dayCopy = "today";
                } else if (dayDifference === 1) {
                  dayCopy = "in the last day";
                }

                const sales =
                  release.tokenData.totalSupply.toNumber() -
                  release.tokenData.remainingSupply.toNumber();
                const imageUrl = release.metadata.image;

                const artistInfo = (
                  <div display="inline">
                    <Typography display="inline" variant="body2">
                      {release.metadata.properties.artist},
                    </Typography>{" "}
                    <Typography
                      display="inline"
                      variant="body2"
                      sx={{ fontStyle: "italic" }}
                    >
                      {release.metadata.properties.title}
                    </Typography>
                  </div>
                );
                const availability = (
                  <Typography variant="body2">
                    {release.tokenData.remainingSupply.toNumber()} /{" "}
                    {release.tokenData.totalSupply.toNumber()}
                  </Typography>
                );

                return (
                  <Slide key={i}>
                    <Link
                      href={"/" + release.releasePubkey}
                      style={{ width: "400px" }}
                      passHref
                    >
                      <a>
                      <Image src={imageUrl} width="400px" height="400px" />
                      </a>
                    </Link>
                    <Copy sx={{ paddingLeft: 2 }}>
                      <Typography variant="h3" color="blue">
                        {`${sales} ${
                          sales === 1 ? "copy was" : "copies were"
                        } sold ${dayCopy}`}
                        {release.tokenData.exchangeSaleCounter.toNumber() > 0 &&
                          ` + (${release.tokenData.exchangeSaleCounter.toNumber()} secondary market ${
                            release.tokenData.exchangeSaleCounter.toNumber() ===
                            1
                              ? "sale"
                              : "sales"
                          })`}
                      </Typography>
                      {availability}
                      {artistInfo}
                    </Copy>
                  </Slide>
                );
              })}
            </Carousel>
          )}
        </Box>
      </RecentlyPurchasedContainer>
    </>
  );
};

const PREFIX = "recentlyPurchased";

const classes = {
  sectionHeader: `${PREFIX}-sectionHeader`,
};

const RecentlyPurchasedContainer = styled(Box)(({ theme }) => ({
  minHeight: "400px",
  flexShrink: "0",
  alignItems: "center",
  "& a": {
    minWidth: "400px",
    [theme.breakpoints.down("md")]: {
      width: "100% !important",
      minWidth: "unset",
    },
  },
  [theme.breakpoints.down("md")]: {
    marginLeft: "0",
  },
  [`& .${classes.sectionHeader}`]: {
    fontWeight: "700 ",
    paddingBottom: `${theme.spacing(1)}`,
  },
}));

const Slide = styled(Box)(({ theme }) => ({
  display: "flex",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
}));

const Copy = styled(Box)(({ theme }) => ({
  paddingLeft: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  textAlign: "left",
  width: "32%",
  [theme.breakpoints.down("md")]: {
    paddingLeft: 0,
    paddingTop: theme.spacing(1),
    width: "100%",
  },
  "& *": {
    paddingBottom: "5px",
  },
}));

export default RecentlyPurchased;
