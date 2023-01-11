import React, {
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import * as Yup from "yup";
import Hub from "@nina-protocol/nina-internal-sdk/esm/Hub";
import Nina from "@nina-protocol/nina-internal-sdk/esm/Nina";
import Release from "@nina-protocol/nina-internal-sdk/esm/Release";
import { getMd5FileHash } from "@nina-protocol/nina-internal-sdk/esm/utils";
import { useSnackbar } from "notistack";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import dynamic from "next/dynamic";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import ReleaseCreateForm from "./ReleaseCreateForm";
import ReleaseCreateConfirm from "./ReleaseCreateConfirm";
import NinaBox from "./NinaBox";
import MediaDropzones from "./MediaDropzones";
import Dots from "./Dots";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import {
  createUpload,
  updateUpload,
  removeUpload,
  UploadType,
  uploadHasItemForType,
} from "../utils/uploadManager";
const BundlrModal = dynamic(() => import("./BundlrModal"));

const ReleaseCreateSchema = Yup.object().shape({
  artist: Yup.string().required("Artist Name is Required"),
  title: Yup.string().required("Title is Required"),
  description: Yup.string(),
  catalogNumber: Yup.string().required("Catalog Number is Required"),
  amount: Yup.number().required("Edition Amount is Required"),
  retailPrice: Yup.number().required("Sale Price is Required"),
  resalePercentage: Yup.number().required("Resale Percent Amount is Required"),
});

const ReleaseCreateViaHub = ({ canAddContent, hubPubkey }) => {
  const { enqueueSnackbar } = useSnackbar();
  const wallet = useWallet();
  const {
    releaseInitViaHub,
    releaseState,
    initializeReleaseAndMint,
    releaseCreateMetadataJson,
    validateUniqueMd5Digest,
  } = useContext(Release.Context);
  const { hubState } = useContext(Hub.Context);
  const router = useRouter();

  const {
    bundlrUpload,
    bundlrBalance,
    getBundlrBalance,
    getBundlrPricePerMb,
    bundlrPricePerMb,
    solPrice,
    getSolPrice,
    checkIfHasBalanceToCompleteAction,
    NinaProgramAction,
    getUserBalances,
  } = useContext(Nina.Context);
  const hubData = useMemo(() => hubState[hubPubkey], [hubState, hubPubkey]);
  const [track, setTrack] = useState(undefined);
  const [artwork, setArtwork] = useState();
  const [uploadSize, setUploadSize] = useState();
  const [releasePubkey, setReleasePubkey] = useState(undefined);
  const [release, setRelease] = useState(undefined);
  const [buttonText, setButtonText] = useState("Publish Release");
  const [pending, setPending] = useState(false);
  const [formIsValid, setFormIsValid] = useState(false);
  const [formValues, setFormValues] = useState({
    releaseForm: {},
  });
  const [formValuesConfirmed, setFormValuesConfirmed] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [releaseInfo, setReleaseInfo] = useState();
  const [artworkTx, setArtworkTx] = useState();
  const [trackTx, setTrackTx] = useState();
  const [metadata, setMetadata] = useState();
  const [metadataTx, setMetadataTx] = useState();
  const [releaseCreated, setReleaseCreated] = useState(false);
  const [uploadId, setUploadId] = useState();
  const [publishingStepText, setPublishingStepText] = useState();
  const [md5Digest, setMd5Digest] = useState();
  const [processingProgress, setProcessingProgress] = useState()

  const mbs = useMemo(
    () => bundlrBalance / bundlrPricePerMb,
    [bundlrBalance, bundlrPricePerMb]
  );
  const bundlrUsdBalance = useMemo(
    () => bundlrBalance * solPrice,
    [bundlrBalance, solPrice]
  );

  useEffect(() => {
    refreshBundlr();
    getUserBalances();
  }, []);

  const refreshBundlr = () => {
    getBundlrPricePerMb();
    getBundlrBalance();
    getSolPrice();
  };

  useEffect(() => {
    if (isPublishing) {
      if (!artworkTx) {
        setPublishingStepText(
          "1/4 Uploading Artwork.  Please confirm in wallet and do not close this window."
        );
      } else if (!trackTx) {
        setPublishingStepText(
          "2/4 Uploading Track.  Please confirm in wallet and do not close this window.  This may take a while."
        );
      } else if (!metadataTx) {
        setPublishingStepText(
          "3/4 Uploading Metadata.  Please confirm in wallet and do not close this window."
        );
      } else {
        setPublishingStepText(
          "4/4 Finalizing Release.  Please confirm in wallet and do not close this window."
        );
      }
    } else {
      if (releaseCreated) {
        setButtonText("Release Created!  View Release.");
      } else if (artworkTx && !trackTx) {
        setButtonText("Restart 2/4: Upload Track.");
      } else if (artworkTx && trackTx && !metadataTx) {
        setButtonText("Restart 3/4: Upload Metadata.");
      } else if (artworkTx && trackTx && metadataTx && !releaseCreated) {
        setButtonText('There may have been an error creating this release. Please wait 30 seconds and check for the release in your dashboard before retrying')
      } else if (mbs < uploadSize) {
        setButtonText(
          `Release requires more storage than available in your bundlr account, please top up`
        );
      }
    }
  }, [
    artworkTx,
    metadataTx,
    trackTx,
    isPublishing,
    releaseCreated,
    bundlrBalance,
  ]);

  useEffect(() => {
    if (releasePubkey && releaseState.tokenData[releasePubkey]) {
      setRelease(releaseState.tokenData[releasePubkey]);
    }
  }, [releaseState.tokenData[releasePubkey]]);

  const handleFormChange = useCallback(
    async (values) => {
      setFormValues({
        ...formValues,
        releaseForm: values,
      });
    },
    [formValues]
  );

  useEffect(() => {
    if (track && artwork) {
      const valid = async () => {
        const isValid = await ReleaseCreateSchema.isValid(
          formValues.releaseForm,
          {
            abortEarly: true,
          }
        );
        setFormIsValid(isValid);
      };
      valid();
    } else {
      setFormIsValid(false);
    }
  }, [formValues, track, artwork]);

  useEffect(() => {
    if (track) {
      const handleGetMd5FileHash = async (track) => {
        const hash = await getMd5FileHash(track.file, (progress) => setProcessingProgress(progress));
        setMd5Digest(hash);
      };
      handleGetMd5FileHash(track);
    }
  }, [track]);

  useEffect(() => {
    const trackSize = track ? track.meta.size / 1000000 : 0;
    const artworkSize = artwork ? artwork.meta.size / 1000000 : 0;
    setUploadSize((trackSize + artworkSize).toFixed(2));
  }, [track, artwork]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (releaseCreated) {
        router.push({
          pathname: `/${
            hubData.handle
          }/releases/${releaseInfo.hubRelease.toBase58()}`,
        });
      } else if (track && artwork && md5Digest) {
        const error = await checkIfHasBalanceToCompleteAction(
          NinaProgramAction.RELEASE_INIT_VIA_HUB
        );
        if (error) {
          enqueueSnackbar(error.msg, { variant: "failure" });
          return;
        }

        const release = await validateUniqueMd5Digest(md5Digest);
        if (release) {
          enqueueSnackbar(
            `A release with this audio file already exists: ${release.metadata.properties.artist} - ${release.metadata.properties.title}`,
            {
              variant: "warn",
            }
          );

          return;
        }

        let upload = uploadId;
        let artworkResult = artworkTx;
        if (!uploadId) {
          setIsPublishing(true);
          enqueueSnackbar(
            "Uploading artwork to Arweave.  Please confirm in wallet.",
            {
              variant: "info",
            }
          );
          artworkResult = await bundlrUpload(artwork.file);
          setArtworkTx(artworkResult);
          upload = createUpload(
            UploadType.artwork,
            artworkResult,
            formValues.releaseForm
          );
          setUploadId(upload);
        }
        if (uploadHasItemForType(upload, UploadType.artwork) || artworkResult) {
          let trackResult = trackTx;
          if (!uploadHasItemForType(upload, UploadType.track)) {
            enqueueSnackbar(
              "Uploading track to Arweave.  Please confirm in wallet.",
              {
                variant: "info",
              }
            );
            trackResult = await bundlrUpload(track.file);
            setTrackTx(trackResult);
            updateUpload(upload, UploadType.track, trackResult);
          }
          if (uploadHasItemForType(upload, UploadType.track) || trackResult) {
            let metadataResult = metadataTx;
            const info =
              releaseInfo || (await initializeReleaseAndMint(hubPubkey));
            setReleaseInfo(info);
            setReleasePubkey(info.release);
            if (!uploadHasItemForType(upload, UploadType.metadataJson)) {
              enqueueSnackbar(
                "Uploading Metadata to Arweave.  Please confirm in wallet.",
                {
                  variant: "info",
                }
              );

              const metadataJson = releaseCreateMetadataJson({
                release: info.release,
                ...formValues.releaseForm,
                trackTx: trackResult,
                artworkTx: artworkResult,
                trackType: track.file.type,
                artworkType: artwork.file.type,
                duration: track.meta.duration,
                md5Digest,
              });
              metadataResult = await bundlrUpload(
                new Blob([JSON.stringify(metadataJson)], {
                  type: "application/json",
                })
              );
              setMetadata(metadataJson);
              setMetadataTx(metadataResult);
              updateUpload(
                upload,
                UploadType.metadataJson,
                metadataResult,
                info
              );
            }
            if (
              uploadHasItemForType(upload, UploadType.metadataJson) ||
              metadataResult
            ) {
              enqueueSnackbar(
                "Finalizing Release.  Please confirm in wallet.",
                {
                  variant: "info",
                }
              );

              const result = await releaseInitViaHub({
                hubPubkey,
                ...formValues.releaseForm,
                release: info.release,
                releaseBump: info.releaseBump,
                releaseMint: info.releaseMint,
                metadataUri: `https://arweave.net/${metadataResult}`,
              });

              if (result.success) {
                enqueueSnackbar("Release Created!", {
                  variant: "success",
                });

                removeUpload(upload);
                setIsPublishing(false);
                setReleaseCreated(true);
              } else {
                setIsPublishing(false);
                enqueueSnackbar("Error creating release - please try again.", {
                  variant: "error",
                });
              }
            }
          }
        } else {
          console.warn("didnt mean condition");
        }
      }
    } catch (error) {
      setIsPublishing(false);
      console.warn(error);
    }
  };

  return (
    <Grid item md={12}>
      {!wallet.connected && (
        <ConnectMessage variant="body" gutterBottom>
          Please connect your wallet to start publishing
        </ConnectMessage>
      )}
      {wallet?.connected && (
        <NinaBox columns="350px 400px" gridColumnGap="10px">
          <Box sx={{ width: "100%" }}>
            <MediaDropzones
              setTrack={setTrack}
              setArtwork={setArtwork}
              values={formValues}
              releasePubkey={releasePubkey}
              track={track}
              disabled={isPublishing || releaseCreated}
              processingProgress={processingProgress}
            />
          </Box>

          <CreateFormWrapper>
            <ReleaseCreateForm
              onChange={handleFormChange}
              values={formValues.releaseForm}
              ReleaseCreateSchema={ReleaseCreateSchema}
              disabled={isPublishing}
            />
          </CreateFormWrapper>

          <CreateCta>
            {bundlrBalance === 0 && <BundlrModal inCreate={true} />}
            {bundlrBalance > 0 && formValuesConfirmed && (
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                onClick={(e) => handleSubmit(e)}
                disabled={
                  isPublishing ||
                  !formIsValid ||
                  bundlrBalance === 0 ||
                  mbs < uploadSize ||
                  artwork?.meta.status === "uploading" ||
                  (track?.meta.status === "uploading" && !releaseCreated) ||
                  (artworkTx && trackTx && metadataTx && !releaseCreated)
                }
                href={`${
                  releaseCreated
                    ? `/${
                        hubData.handle
                      }/releases/${releaseInfo.hubRelease.toBase58()}`
                    : ""
                }`}
                sx={{ height: "54px" }}
              >
                {isPublishing && !releaseCreated && (
                  <Dots msg={publishingStepText} />
                )}
                {!isPublishing && buttonText}
              </Button>
            )}
            {!canAddContent && (
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                onClick={(e) => handleSubmit(e)}
                disabled={
                  isPublishing ||
                  !formIsValid ||
                  bundlrBalance === 0 ||
                  mbs < uploadSize ||
                  artwork?.meta.status === "uploading" ||
                  (track?.meta.status === "uploading" && !releaseCreated)
                }
                sx={{ height: "54px" }}
              >
                You do not have allowance or permission to create releases.
              </Button>
            )}

            {bundlrBalance > 0 && !formValuesConfirmed && canAddContent && (
              <ReleaseCreateConfirm
                formValues={formValues}
                formIsValid={formIsValid && processingProgress === 1}
                handleSubmit={(e) => handleSubmit(e)}
                setFormValuesConfirmed={setFormValuesConfirmed}
              />
            )}

            {pending && (
              <LinearProgress
                variant="determinate"
                value={audioProgress || imageProgress}
              />
            )}

            <Box display="flex" justifyContent="space-between">
              {bundlrBalance > 0 && (
                <BundlrBalanceInfo variant="subtitle1" align="left">
                  Bundlr Balance: {bundlrBalance?.toFixed(4)} SOL / $
                  {bundlrUsdBalance.toFixed(2)} / {mbs?.toFixed(2)} MB ($
                  {(bundlrUsdBalance / mbs)?.toFixed(4)}/MB)
                </BundlrBalanceInfo>
              )}
              {bundlrBalance === 0 && (
                <BundlrBalanceInfo variant="subtitle1" align="left">
                  Please fund your Bundlr Account to enable publishing
                </BundlrBalanceInfo>
              )}
              {uploadSize > 0 && (
                <Typography
                  variant="subtitle1"
                  align="right"
                  sx={{ mt: "5px" }}
                >
                  Upload Size: {uploadSize} MB | Cost: $
                  {(uploadSize * (bundlrUsdBalance / mbs)).toFixed(2)}
                </Typography>
              )}
            </Box>
          </CreateCta>
        </NinaBox>
      )}
    </Grid>
  );
};

const ConnectMessage = styled(Typography)(() => ({
  gridColumn: "1/3",
  paddingTop: "30px",
}));

const CreateFormWrapper = styled(Box)(({ theme }) => ({
  width: "100%",
  height: "476px",
  margin: "auto",
  display: "flex",
  flexDirection: "column",
  border: `1px solid ${theme.palette.grey.primary}`,
}));

const CreateCta = styled(Box)(({ theme }) => ({
  gridColumn: "1/3",
  width: "100%",
  position: "relative",
  "& .MuiButton-root": {
    ...theme.helpers.baseFont,
  },
}));

const NetworkDegradedMessage = styled(Box)(({ theme }) => ({
  color: theme.palette.red,
  padding: "0 0 50px",
}));

const BundlrBalanceInfo = styled(Typography)(({ theme }) => ({
  whiteSpace: "nowrap",
  margin: "5px 0",
}));

export default ReleaseCreateViaHub;
