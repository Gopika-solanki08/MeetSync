import * as React from "react";
import {
  Avatar,
  Button,
  CssBaseline,
  TextField,
  Box,
  Typography,
  Snackbar,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AuthContext } from "../contexts/AuthContext";

const theme = createTheme();

export default function PremiumAuth() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [formState, setFormState] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  const handleAuth = async () => {
    try {
      if (formState === 0) {
        await handleLogin(username, password);
      } else {
        const result = await handleRegister(name, username, password);
        setMessage(result);
        setOpen(true);
        setFormState(0);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong!");
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ height: "100vh", width: "100vw" }}>
        <CssBaseline />

        {/*  AI VIDEO CALL BACKGROUND IMAGE */}
        <Box
          sx={{
            position: "fixed",
            width: "100%",
            height: "100%",
            backgroundImage:
              'url("https://images.unsplash.com/photo-1677442136019-21780ecad995")',
            backgroundSize: "cover",
            backgroundPosition: "center",
            zIndex: -2,
            opacity: 0.6
          }}
        />

        {/*  DARK OVERLAY */}
        <Box
          sx={{
            position: "fixed",
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.4))",
            zIndex: -1,
          }}
        />

        {/*  MULTICOLOR LOGIN CARD */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            borderRadius: "30px",
            padding: "40px",
            width: { xs: "90%", sm: "500px" },
            color: "white",
            background:
              "linear-gradient(135deg, rgba(255,0,150,0.3), rgba(0,204,255,0.3), rgba(0,255,150,0.3))",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(20, 195, 76, 0.3)",
          }}
        >
          <Box textAlign="center">
            <Avatar sx={{ m: 1, bgcolor: "secondary.main", mx: "auto" }}>
              <LockOutlinedIcon />
            </Avatar>

            <Typography variant="h5" mb={2}>
              {formState === 0 ? "Sign In" : "Sign Up"}
            </Typography>
          </Box>

          {formState === 1 && (
            <TextField
              fullWidth
              margin="normal"
              label="Full Name"
              variant="filled"
              value={name}
              onChange={(e) => setName(e.target.value)}
              InputProps={{ style: { background: "white" } }}
              
            />
          )}

          <TextField
            fullWidth
            margin="normal"
            label="Username"
            variant="filled"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            InputProps={{ style: { background: "white"} }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Password"
            type="password"
            variant="filled"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{ style: { background: "white" } }}
          />

          {error && <p style={{ color: "red" }}>{error}</p>}

          <Button
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              borderRadius: "30px",
              background:
                "linear-gradient(45deg, #ff6b6b, #6c5ce7, #00cec9)",
            }}
            onClick={handleAuth}
          >
            {formState === 0 ? "Login" : "Register"}
          </Button>

          <Box textAlign="center" mt={2}>
            <Button
              onClick={() => setFormState(formState === 0 ? 1 : 0)}
              sx={{ color: "white" }}
            >
              {formState === 0
                ? "New user? Sign Up"
                : "Already have an account? Sign In"}
            </Button>
          </Box>
        </Box>

        <Snackbar open={open} autoHideDuration={4000} message={message} />
      </Box>
    </ThemeProvider>
  );
}



