import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { Button, IconButton, TextField } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { AuthContext } from "../contexts/AuthContext";

function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");

  const { addToUserHistory } = useContext(AuthContext);

  let handleJoinVideoCall = async () => {
    if (!meetingCode) return;
    await addToUserHistory(meetingCode);
    navigate(`/${meetingCode}`);
  };

  return (
    <div className="homeContainer">
      {/* NAVBAR */}
      <div className="navBar">
        <div className="logoContainer">
          <img src="/mainlogo.png" alt="main logo" className="logoImage" />
          <h2 className="logo">MeetSync</h2>
        </div>

        <div className="navActions">
          <IconButton onClick={() => navigate("/history")}>
            <RestoreIcon style={{ color: "white" }} />
          </IconButton>
          <p>History</p>

          <Button
            className="logoutBtn"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/auth");
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* MAIN */}
      <div className="meetContainer">
        {/* LEFT */}
        <div className="leftPanel">
          <h1>
            Join a <span>Video Call</span>
          </h1>

          <p>Enter meeting code to connect instantly 🚀</p>

          <div className="inputBox">
            <TextField
              onChange={(e) => setMeetingCode(e.target.value)}
              label="Meeting Code"
              variant="filled"
              fullWidth
              InputProps={{ style: { background: "white" } }}
            />

            <Button
              onClick={handleJoinVideoCall}
              className="joinBtn"
              variant="contained"
            >
              Join
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(HomeComponent);