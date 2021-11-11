import React from 'react'
import { styled } from '@mui/material/styles'
import { Box } from '@mui/material'
import Carousel from 'react-multi-carousel'
import 'react-multi-carousel/lib/styles.css'
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Link } from 'react-router-dom'
import SmoothImage from 'react-smooth-image'
import CircularProgress from '@mui/material/CircularProgress'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';


const RecentlyPublished = (props) => {
  const { releases } = props
  const responsive = {
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 3,
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 2,
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
      slidesToSlide: 1, // optional, default to 1.
    },
  }

  const buttonStyle = {
    position: 'absolute',
    color: 'black',
    backgroundColor: 'red !important',
    '&:hover': {
      backgroundColor: 'black !important'
    },
    '& ::before': {
      display: 'none'
    }
  }

  const CustomRightArrow = ({onClick}) => {
    return(
        <Button disableRipple style={{right: '-10px', ...buttonStyle}}>
          <KeyboardArrowRightIcon fontSize="large" onClick={() => onClick()} />
        </Button>
       )

  };
  const CustomLeftArrow = ({onClick}) => {

    
    return(
        <Button disableRipple style={{left: '-10px', ...buttonStyle}}>
          <KeyboardArrowLeftIcon fontSize="large" onClick={() => onClick()} />
        </Button>
       )
  };

  if (releases === undefined || releases.length === 0) {
    return (
      <RecentlyPublishedContainer
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <CircularProgress color="black" />
      </RecentlyPublishedContainer>
    )
  }
  return (
    <RecentlyPublishedContainer>
      {releases?.length > 0 && (
        <Carousel
          showDots={false}
          showArrows={false}
          draggable={true}
          responsive={responsive}
          infinite={true}
          autoPlay={true}
          autoPlaySpeed={2000}
          keyBoardControl={true}
          // customTransition="all .5"
          // centerMode={true}
          transitionDuration={500}
          slidesToSlide={1}
          containerClass="carousel-container"
          removeArrowOnDeviceType={['tablet', 'mobile']}
          customRightArrow={<CustomRightArrow />}
          customLeftArrow={<CustomLeftArrow />}
        >
          {releases.map((release, i) => {
            const imageUrl = release.metadata.image
            const artistInfo = (
              <Typography variant="body2">
                {release.metadata.properties.artist},{' '}
                {release.metadata.properties.title}
              </Typography>
            )
            const availability = (
              <Typography variant="body2">
                {release.tokenData.remainingSupply.toNumber()} /{' '}
                {release.tokenData.totalSupply.toNumber()}
              </Typography>
            )

            return (
              <ReleaseSlide key={i}>
                <Link to={'/release/' + release.releasePubkey}>
                  <SmoothImage src={imageUrl} />
                </Link>
                {artistInfo}
                {availability}
              </ReleaseSlide>
            )
          })}
        </Carousel>
      )}
    </RecentlyPublishedContainer>
  )
}

const RecentlyPublishedContainer = styled(Box)(() => ({
  width: '100%',
  minHeight: '250px',
}))

const ReleaseSlide = styled(Box)(() => ({
  width: '250px',
  textAlign: 'left',
  paddingLeft: '1px',
  '& a': {
    width: '250px',

  },
}))

export default RecentlyPublished
