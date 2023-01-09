import { useState, useEffect, createElement, Fragment } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { styled } from "@mui/material/styles";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeReact from "rehype-react";
import rehypeSanitize from "rehype-sanitize";
import rehypeExternalLinks from "rehype-external-links";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

const ReleaseCreateConfirm = (props) => {
  const {
    formIsValid,
    formValues,
    handleSubmit,
    setFormValuesConfirmed,
    profileHubs,
  } = props;
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [description, setDescription] = useState();
  const [confirm, setConfirm] = useState();
  const data = formValues.releaseForm;

  const submitAndCloseModal = (e) => {
    e.preventDefault();
    setFormValuesConfirmed(true);
    handleSubmit(e);
    handleClose();
  };

  useEffect(() => {
    if (data.description) {
      unified()
        .use(rehypeParse, { fragment: true })
        .use(rehypeSanitize)
        .use(rehypeReact, {
          createElement,
          Fragment,
        })
        .use(rehypeExternalLinks, {
          target: false,
          rel: ["nofollow", "noreferrer"],
        })
        .process(data.description.replaceAll("<p><br></p>", "<br>"))
        .then((file) => {
          setDescription(file.result);
        });
    }
    setDescription(data.description);
  }, [data.description]);

  const handleChangeCheckbox = (e) => {
    setConfirm(e.target.checked);
  };

  return (
    <div>
      <Button
        variant="outlined"
        color="primary"
        fullWidth
        onClick={handleOpen}
        disabled={!formIsValid}
      >
        Publish Release
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography variant="h4">
            Please double check the following information before publishing your
            release:
          </Typography>
          <Box>
            <Value sx={{ mt: 1 }}>
              Artist: <span>{data.artist}</span>
            </Value>
            <Value sx={{ mt: 1 }}>
              Title: <span>{data.title}</span>
            </Value>

            <Value sx={{ mt: 1 }}>
              Catalog Number:<span>{data.catalogNumber}</span>
            </Value>
            <Value sx={{ mt: 1 }}>
              Amount: <span>{data.amount}</span>
            </Value>
            <Value sx={{ mt: 1 }}>
              Retail Price:<span>${data.retailPrice}</span>
            </Value>
            <Value sx={{ mt: 1, mb: 1 }}>
              Resale Percentage: <span>{data.resalePercentage}%</span>
            </Value>
            <Value
              className="description"
              sx={{ mt: 1, flexDirection: "column", mb: 1 }}
            >
              Description:{" "}
              <span style={{ marginTop: "8px", paddingLeft: "0" }}>
                {description}
              </span>
            </Value>

            <Typography variant="subtitle1" mt={1} sx={{ color: "red" }}>
              ONCE PUBLISHED, YOUR RELEASE INFORMATION WILL BE PERMANENT AND YOU
              WILL NOT BE ABLE TO EDIT IT.
            </Typography>
            <Value>
              <FormControlLabel
                sx={{ mt: 1, mb: 1, paddingLeft: "10px" }}
                control={<Checkbox onChange={handleChangeCheckbox} />}
                label="Confirm"
              />
            </Value>

            <Button
              variant="outlined"
              color="primary"
              fullWidth
              disabled={!confirm}
              onClick={(e) => submitAndCloseModal(e)}
            >
              Publish Release
            </Button>

            <Button
              variant="outlined"
              color="primary"
              fullWidth
              onClick={handleClose}
              sx={{ marginTop: "15px !important" }}
            >
              Close and Edit
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

const Value = styled(Typography)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  "& span": {
    textAlign: "right",
  },

  "&.description": {
    "& span": {
      paddingLeft: theme.spacing(1),
      textAlign: "left",
      maxHeight: "150px",
      overflowY: "scroll",
    },
  },
}));

export default ReleaseCreateConfirm;
