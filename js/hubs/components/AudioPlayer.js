import React, { useEffect, useState, useRef, useContext, useMemo } from "react";
import nina from "@nina-protocol/nina-sdk";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

const { AudioPlayerContext, HubContext, ReleaseContext } = nina.contexts;
const { formatDuration } = nina.utils;
const AudioPlayer = ({ hubPubkey }) => {
  const { releaseState } = useContext(ReleaseContext);
  const { hubContentState, filterHubContentForHub } = useContext(HubContext);
  const audio = useContext(AudioPlayerContext);
  const [tracks, setTracks] = useState({});
  const {
    track,
    playNext,
    playPrev,
    updateTrack,
    playlist,
    createPlaylistFromTracksHubs,
    isPlaying,
    initialized,
    setInitialized,
    audioPlayerRef
  } = audio;

  const audioInitialized = useMemo(() => initialized, [initialized])
  useEffect(() => {
    const trackObject = {};
    const [hubReleases] = filterHubContentForHub(hubPubkey);
    hubReleases.forEach((hubRelease) => {
      let contentItem;
      if (
        hubRelease.contentType === "NinaReleaseV1" &&
        releaseState.metadata[hubRelease.release] &&
        hubRelease.visible
      ) {
        contentItem = releaseState.metadata[hubRelease.release];
        contentItem.contentType = hubRelease.contentType;
        contentItem.publicKey = hubRelease.release;
        contentItem.datetime = hubRelease.datetime;
        trackObject[hubRelease.release] = contentItem;
      }
    });
    setTracks(trackObject);
  }, [hubContentState, hubPubkey]);
  const activeTrack = useRef();
  const intervalRef = useRef();
  const activeIndexRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [trackProgress, setTrackProgress] = useState(0.0);

  useEffect(() => {
    audioPlayerRef.current = document.querySelector("#audio");

    const actionHandlers = [
      ["play", () => play()],
      ["pause", () => play()],
      ["previoustrack", () => previous()],
      ["nexttrack", () => next()],
    ];

    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (error) {
        console.warn(
          `The media session action "${action}" is not supported yet.`
        );
      }
    }

    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (Object.values(tracks).length > 0) {
      const trackIds = Object.values(tracks)
        .sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
        .map((track) => track.publicKey);
      createPlaylistFromTracksHubs(trackIds);
    }
  }, [tracks, hubContentState]);
  console.log('audioInitialized', audioInitialized)
  useEffect(() => {
    if (isPlaying && audioInitialized) {
      play();
    } else {
      pause();
    }
  }, [isPlaying]);
  const hasNext = useMemo(
    () => activeIndexRef.current + 1 < playlist.length,
    [activeIndexRef.current, playlist]
  );
  const hasPrevious = useMemo(
    () => activeIndexRef.current > 0,
    [activeIndexRef.current]
  );
  useEffect(() => {
    if (track && audioInitialized) {
      activeIndexRef.current = playlist.indexOf(track);
      activeTrack.current = track;
      audioPlayerRef.current.src = track.txid;
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: activeTrack.current.title,
          artist: activeTrack.current.artist,
          artwork: [
            {
              src: activeTrack.current.cover,
              sizes: "512x512",
              type: "image/jpeg",
            },
          ],
        });
      }
    }
    if (audioInitialized && isPlaying) {
      play();
    }
  }, [track, audioInitialized, isPlaying]);

  useEffect(() => {
    if (
      playlist.length > 0 &&
      !activeIndexRef.current &&
      track?.releasePubkey != playlist[0].releasePubkey
    ) {
      updateTrack(playlist[0].releasePubkey, false);
    }
  }, [playlist, activeIndexRef.current]);

  const startTimer = () => {
    // Clear any timers already running
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (
        audioPlayerRef.current.currentTime > 0 &&
        audioPlayerRef.current.currentTime < audioPlayerRef.current.duration &&
        !audioPlayerRef.current.paused
      ) {
        setTrackProgress(Math.ceil(audioPlayerRef.current.currentTime));
      } else if (audioPlayerRef.current.currentTime >= audioPlayerRef.current.duration) {
        next();
      }
    }, [300]);
  };

  const previous = () => {
    if (hasPrevious) {
      setTrackProgress(0);
      activeIndexRef.current = activeIndexRef.current - 1;
      playPrev(true);
    }
  };

  const play = () => {
    if (audioPlayerRef.current.paused) {
      audioPlayerRef.current.play();
      setPlaying(true);
      startTimer();
    } else {
      // pause()
    }
  };

  const playButtonHandler = () => {
    setInitialized(true)
    if (audioPlayerRef.current.paused) {
      if (track) {
        updateTrack(track.releasePubkey, true);
      }
    } else {
      pause();
    }
  };

  const pause = () => {
    audioPlayerRef.current.pause();
    setPlaying(false);
    clearInterval(intervalRef.current);
    if (track) {
      updateTrack(track.releasePubkey, false);
    }
  };

  const next = () => {
    if (hasNext) {
      setTrackProgress(0);
      activeIndexRef.current = activeIndexRef.current + 1;
      playNext(true);
    } else {
      // This means we've reached the end of the playlist
      setPlaying(false);
    }
  };

  return (
    <Player>
      {track && (
        <>
          <Controls>
            <Button onClick={() => previous()} disabled={!hasPrevious}>
              Previous
            </Button>
            <span>{` | `}</span>
            <Button onClickCapture={() => playButtonHandler()} disabled={!track}>
              {playing ? "Pause" : "Play"}
            </Button>
            <span>{` | `}</span>
            <Button onClick={() => next()} disabled={!hasNext}>
              Next
            </Button>
            {track && (
              <div>
                <Typography>{`Now Playing: ${track.artist} - ${track.title}`}</Typography>
                <Typography>{`${formatDuration(
                  trackProgress
                )} / ${formatDuration(track.duration)}`}</Typography>
              </div>
            )}
          </Controls>
        </>
      )}
      <audio id="audio" style={{ width: "100%" }}>
        <source src={track?.txid + '?ext=mp3'} type="audio/mp3" />
      </audio>
      <Typography sx={{pb: "5px", whiteSpace: 'nowrap'}}>
        <a href={`https://ninaprotocol.com/`} target="_blank" rel="noreferrer" >
          Powered by Nina.
        </a>
      </Typography>
    </Player>
  );
};

const Controls = styled("div")(({ theme }) => ({
  paddingBottom: theme.spacing(2),
  width: "100%",
  maxWidth: "500px",
  minWidth: '250px',
  "& .MuiButton-root": {
    fontSize: theme.typography.body1.fontSize,
    padding: 0,
    color: theme.palette.text.primary,
    ":hover": {
      opacity: "50%",
    },
    ":disabled": {
      color: theme.palette.text.primary + "a0",
    },
  },
}));

const Player = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(2),
  width: '90%',
  background: theme.palette.background.default,
  [theme.breakpoints.down('md')]: {
    position: 'fixed',
    bottom: '0',
    width: '100vw',
    background: theme.palette.background.default,
    paddingTop: '0',
    paddingLeft: '15px'
  },
  "& .MuiButton-root": {
    fontSize: theme.typography.body1.fontSize,
    backgroundColor: `${theme.palette.transparent} !important`,
    padding: 0,
    color: theme.palette.text.primary,
    ":disabled": {
      color: theme.palette.text.primary + "b0",
    },
  },
  "& a": {
    color: theme.palette.text.primary,
    textDecoration: "none",
  },
}));

export default AudioPlayer;
