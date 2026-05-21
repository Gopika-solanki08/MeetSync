import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { IconButton } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);

  const [meetings, setMeetings] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        console.log("History:", history); // DEBUG
        setMeetings(Array.isArray(history) ? history : []);
      } catch (err) {
        console.log(err);
      }
    };

    fetchHistory();
  }, [getHistoryOfUser]);

  let formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${
      (date.getMonth() + 1).toString().padStart(2, "0")
    }/${date.getFullYear()}`;
  };

  return (
  <div
    style={{
      minHeight: "100vh",
      background: "#0f172a",
      padding: "20px",
      color: "white",
    }}
  >
    {/* Home Button */}
    <IconButton
      onClick={() => navigate("/home")}
      style={{ color: "white", marginBottom: "10px" }}
    >
      <HomeIcon />
    </IconButton>

    {/* Cards */}
    {meetings.length !== 0 ? (
      meetings.map((e, i) => {
        return (
          <Card
            key={i}
            variant="outlined"
            sx={{
              marginBottom: "15px",
              borderRadius: "12px",
              background: "#1e293b",
              color: "white",
              border: "1px solid #334155",
              transition: "0.3s",
              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.4)",
              },
            }}
          >
            <CardContent>
              <Typography
                sx={{
                  fontSize: 14,
                  color: "#94a3b8",
                  marginBottom: "5px",
                  
                }}
              >
                Message: {e.message || e.data || e.meetingCode }
              </Typography>

              <Typography
                sx={{
                  fontSize: 15,
                  fontWeight: 500,
                }}
              >
                Date: {formatDate(e.date)}
              </Typography>
            </CardContent>
          </Card>
        );
      })
    ) : (
      <p style={{ opacity: 0.7 }}>No Meeting History Found</p>
    )}
  </div>
);
}