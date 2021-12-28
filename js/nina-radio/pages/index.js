import React, { useEffect, useState, useRef, useContext } from 'react'
import ninaCommon from 'nina-common'
import axios from 'axios'
import Head from 'next/head'
import Image from 'next/image'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import { styled } from "@mui/material/styles"

const { ReleaseContext } = ninaCommon.contexts
const { Dots } = ninaCommon.components
const { NinaClient } = ninaCommon.utils

export default function Home() {
  const playerRef = useRef()
  const intervalRef = useRef()
  const [tracks, setTracks] = useState({})
  const [playlist, setPlaylist] = useState([])
  const [activeIndex, setActiveIndex] = useState()
  const [activeTrack, setActiveTrack] = useState()
  const [playing, setPlaying] = useState(false)
  const [trackProgress, setTrackProgress] = useState(0)
  const [hasPrevious, setHasPrevious] = useState(false)
  const [hasNext, setHasNext] = useState(false)
  const [related, setRelated] = useState([])
  const { getRelatedForRelease, filterRelatedForRelease, releaseState } = useContext(ReleaseContext)

  useEffect(() => {
    getTracks()
    playerRef.current = document.querySelector("#audio")

    return () => {
      clearInterval(intervalRef.current)
    }
  }, [])
  
  useEffect(() => {
    if (Object.keys(tracks).length) {
      const releases = Object.keys(tracks)
      shuffle(releases)
      setPlaylist(releases)
      setActiveIndex(0)
    }
  }, [tracks])

  useEffect(() => {
    const track = tracks[playlist[activeIndex]]
    if (track) {
      getRelatedReleases()
      setActiveTrack(track)
      setHasNext((activeIndex + 1) <= playlist.length)
      setHasPrevious(activeIndex > 0)
      playerRef.current.src = track.animation_url
      play()
    }
  }, [activeIndex])

  useEffect(() => {
    const release = playlist[activeIndex]
    const related = filterRelatedForRelease(release)
    console.log(release, related)
    setRelated(related.map(release => release.metadata))
  }, [releaseState])

  const getRelatedReleases = async () => {
    setRelated([])
    const release = playlist[activeIndex]
    await getRelatedForRelease(release)
  }
  const startTimer = () => {
    // Clear any timers already running
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {

      if (playerRef.current.duration > 0 && !playerRef.current.paused) {
        setTrackProgress(Math.ceil(playerRef.current.currentTime));
      } else if (playerRef.current.currentTime > 0) {
        setTrackProgress(0);
        next();
      }
    }, [300]);
  };

  const getTracks = async () => {
    const response = await axios.get("https://api.nina.market/metadata", {
      method: "GET",
    });
    if (response?.data) {
      setTracks(response.data)
    }
  }

  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  const previous = () => {
    if (hasPrevious) {
      setTrackProgress(0)
      setActiveIndex(activeIndex - 1)
    }
  }

  const play = () => {
    if (playerRef.current.paused) {
      playerRef.current.play()
      if (!playerRef.current.paused) {
        setPlaying(true)
        startTimer()
      }
    } else {
      playerRef.current.pause()
      setPlaying(false)
      clearInterval(intervalRef.current)
    }
  }

  const next = () => {
    if (hasNext) {
      setTrackProgress(0)
      setActiveIndex(activeIndex + 1)
    }
  }

  return (
    <Box height="100vh" width="100vw" display="flex" flexDirection="column">
      <Head>
        <title>Nina Radio</title>
        <meta name="description" content="Radio player built on the Nina protocol" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box display ="flex" flex={1} sx={{ width: "100%", height: "100%"}}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Logo>
              <Typography variant="h4">NINA RADIO</Typography>
            </Logo>

            {activeTrack &&
              <>
                <Controls>
                  <Button onClick={() => previous()} disabled={!hasPrevious}>Previous</Button>
                  <span>{` | `}</span>
                  <Button onClick={() => play()}>{playing ? 'Pause' : 'Play'}</Button>
                  <span>{` | `}</span>
                  <Button onClick={() => next()} disabled={!hasNext}>Next</Button>
                </Controls>
                <Typography display="inline">
                  Now Playing: {activeTrack.properties.artist},
                </Typography>{" "}
                <Typography
                  display="inline"
                  sx={{ fontStyle: "italic" }}
                >
                  {activeTrack.properties.title}
                </Typography>
                <Typography>{`${NinaClient.formatDuration(trackProgress)} / ${NinaClient.formatDuration(activeTrack.properties.files[0].duration)}`}</Typography>
                <Links>
                  <a
                    href={activeTrack.external_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Typography>View release</Typography>
                  </a>
                  {related.length > 1 &&
                    <a
                      href={activeTrack.external_url + "/related"}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Typography>View {related.length - 1} related {related.length - 1 === 1 ? "release" : "releases"}</Typography>
                    </a>
                  }
                </Links>
              </>
            }
            <Footer>
              <Box>
                <a
                  href="https://nina.market"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Typography>Powered by Nina.</Typography>
                </a>
              </Box>
            </Footer>
          </Grid>
          <Grid item xs={8}>
            {activeTrack &&
              <Artwork>
                <Image
                  src={activeTrack.image}
                  alt={activeTrack.name}
                  layout='fill'
                  objectFit='contain'
                />
              </Artwork>
            }
            {!activeTrack &&
              <Dots size="80px" />
            }
          </Grid>
        </Grid>
      </Box>
      <audio id="audio" style={{ width: "100%" }}>
        <source src={activeTrack?.animation_url} type="audio/mp3" />
      </audio>
    </Box>
  )
}

const Logo = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(1),
  top: theme.spacing(1),
  "& .MuiTypography-h4": {
    fontWeight: "bold",
  },
}));

const Controls = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  width: "100%",
  "& .MuiButton-root": {
    fontSize: theme.typography.body1.fontSize,
    padding: 0,
    color: theme.palette.black,
    ":hover": {
      color: theme.palette.blue,
    },
    ":disabled": {
      color: theme.palette.greyLight,
    }
  }
}))

const Links = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(2),
  width: "100%",
  "& .MuiButton-root": {
    fontSize: theme.typography.body1.fontSize,
    padding: 0,
    color: theme.palette.black,
    ":hover": {
      color: theme.palette.blue,
    },
  }
}))


const Artwork = styled("div")(({theme}) => ({
  width: "100%",
  height: "100%",
  position: "relative",
  "& img": {
    objectPosition: "right",
  }
}))

const Footer = styled(Box)(({theme}) => ({
  position: "absolute",
  bottom: 0,
  display: "flex",
  justifyContent: "space-between",
  "& a": {
    paddingRight: "15px",
  },
}))

