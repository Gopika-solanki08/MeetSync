import React, { useEffect, useState, useRef } from "react";
import styles from "../styles/videoComponent.module.css";
import TextField from "@mui/material/TextField";
import { Badge, Button, IconButton } from "@mui/material";
import { io } from "socket.io-client";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcone from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import { useNavigate } from "react-router-dom";

const server_url = "http://localhost:8000"; // websocket server

var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  var socketRef = useRef();
  let socketIdRef = useRef();
  let localVideoRef = useRef();

  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);

  let [video, setVideo] = useState(true);
  let [audio, setAudio] = useState(true);

  let [screen, setScreen] = useState();
  let [showModel, setModel] = useState(false);
  let [screenAvailable, setScreenAvailable] = useState();

  let [messages, setMessages] = useState([]);
  let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(0);

  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState("");

  let [videos, setVideos] = useState([]);

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      if (videoPermission) {
        setVideoAvailable(true);
      } else {
        setVideoAvailable(false);
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      if (audioPermission) {
        setAudioAvailable(true);
      } else {
        setAudioAvailable(false);
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });

        if (userMediaStream) {
          window.localStream = userMediaStream;

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getPermissions();
  }, [getPermissions]);

  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;
    }

    stream.getTracks().forEach(
      (track) =>
        (onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();             //when we closed the video
            localVideoRef.current.srcObject = window.localStream;

          for (let id in connections) {
            connections[id].addstream(window.localStream);
          }
        }),
    );
  };

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = connectToSocketServer.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());

    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });

    canvas.getContext("2d").fillRect(0, 0, width, height);      //canvas is for animation
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        }),
                      ); //chat reply from another user
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  let addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);

    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prev) => prev + 1);
    }
  };

  const addTracksSafe = (peer, stream) => {
    stream.getTracks().forEach((track) => {
      const alreadyExists = peer
        .getSenders()
        .find((sender) => sender.track === track);

      if (!alreadyExists) {
        peer.addTrack(track, stream);
      }
    });
  };

  let connectToSocketServer = () => {
   
    // socket logic will go here
    socketRef.current = io(server_url, { secure: false });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
     
      socketRef.current.emit("join-call", window.location.href);

      socketIdRef.current = socketRef.current.id;

      //notification of chat msg
      socketRef.current.on("chat-message", (data) => {

        addMessage(data.message, data.sender, data.socketId);
      });

      socketRef.current.on("user-left", (id) => {
        delete connections[id];
        setVideos((prev) => prev.filter((v) => v.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, clients) => {
        
        clients.forEach((socketListId) => {
          if (socketListId === socketIdRef.current) return;

          // avoid duplicate connection
          if (connections[socketListId]) return;

          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections,
          );

          connections[socketListId].onicecandidate = function (event) {
            //icecandidate = stablish direct connects b/w two persons
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate }),
              );
            }
          };
         
          connections[socketListId].ontrack = (event) => {
            const stream = event.streams[0];

            setVideos((prev) => {
              const exists = prev.find((v) => v.socketId === socketListId);

              if (exists) {
                return prev.map((v) =>
                  v.socketId === socketListId ? { ...v, stream } : v,
                );
              } else {
                return [...prev, { socketId: socketListId, stream }];
              }
            });
          };

          if (window.localStream !== undefined && window.localStream !== null) {
            addTracksSafe(connections[socketListId], window.localStream);
          } else {
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();            //when we closed the video
            addTracksSafe(connections[socketListId], window.localStream);
          }
        });

        if (socketIdRef.current === socketRef.current.id) {
          for (let id2 in connections) {
            if (id !== socketIdRef.current) return;

            addTracksSafe(connections[id2], window.localStream);

            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription }),
                  ); //sdp = session description
                })
                .catch((e) => console.log(e));
            });
          }
        }
      });
    });
  };

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .then((stream) => {})
        .catch((e) => console.log(e));
    } else {
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {}
    }
  };

  let getMedia = async () => {
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      window.localStream = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.log("Camera error:", err);
    }
  };

  let routeTo = useNavigate();

  let connect = () => {
    setAskForUsername(false);
    getMedia();
    connectToSocketServer();
  };

  let handleVideo = () => {
    const videoTrack = window.localStream
      ?.getTracks()
      .find((track) => track.kind === "video");

    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled; // toggle camera
      setVideo(videoTrack.enabled);
    }
  };

  let handleAudio = () => {
    const audioTrack = window.localStream
      ?.getTracks()
      .find((track) => track.kind === "audio");

    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setAudio(audioTrack.enabled);
    }
  };

  let getDisplayMediaSuccess = (stream) => {
    //screen sharing feature
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;

    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addstream(window.localStream);
    }

    stream.getTracks().forEach(
      (track) =>
        (onended = () => {
          setScreen(false);

          try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();            
          localVideoRef.current.srcObject = window.localStream;

          getUserMedia();
        }),
    );
  };

  let getDisplayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true })
          .then(getDisplayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e));
      }
    }
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDisplayMedia();
    }
  }, [screen]);

  let handleScreen = () => {
    setScreen(!screen);
  };

  let sendMessage = () => {
    if (!socketRef.current || !socketRef.current.connected) {
      return;
    }
    socketRef.current.emit(
      "chat-message",
      message,
      username,
      socketIdRef.current,
    );
   
    setMessage("");
  };

  let handleEndCall = () => {
    try {
      let tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) {}

    routeTo("/home");
  };

  return (
    <div>
      {askForUsername ? (
        //join meeting page
        <div
          style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background:
              "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            color: "white",
            textAlign: "center",
          }}
        >
          {/* Heading */}
          <h1
            style={{
              fontSize: "40px",
              marginBottom: "20px",
              animation: "fadeIn 1s ease-in-out",
            }}
          >
            Join Meeting
          </h1>

          {/* Username */}
          <TextField
            label="Enter Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="filled"
            style={{
              width: "300px",
              background: "white",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          />

          <Button
            variant="contained"
            onClick={connect}
            style={{
              padding: "10px 30px",
              borderRadius: "10px",
              background: "linear-gradient(45deg, #ff6b6b, #6c5ce7)",
              marginBottom: "30px",
            }}
          >
            Join Now
          </Button>

          {/* Video Preview */}
          <video
            ref={localVideoRef}
            autoPlay
            muted
            style={{
              width: "320px",
              borderRadius: "10px",
              border: "2px solid white",
            }}
          ></video>

          {/* Animation */}
          <style>
            {`
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}
          </style>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          {showModel ? (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <h1>Chat</h1>

                <div className={styles.chattingDisplay}>
                  {messages.length > 0 ? (
                    messages.map((item, index) => {
                      return (
                        <div style={{ marginBottom: "20px" }} key={index}>
                          <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                          <p>{item.data}</p>
                        </div>
                      );
                    })
                  ) : (
                    <p>No Messages Yet</p>
                  )}
                </div>

                <div className={styles.chattingArea}>
                  <TextField
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    id="outlined-basic"
                    label="Enter your chat"
                    sx={{
                      backgroundColor: "white",
                      borderRadius: "8px",
                      input: { color: "black" },
                      label: { color: "gray" },
                    }}
                  ></TextField>
                  <Button onClick={sendMessage} variant="contained">
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <></>
          )}

          <div className={styles.buttonContainers}>
            {" "}
            {/*insert icons on video call footer*/}
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcone />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
            {screenAvailable === true ? (         /*screen sharing feature */
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen === true ? (
                  <ScreenShareIcon />
                ) : (
                  <StopScreenShareIcon />
                )}
              </IconButton>
            ) : (
              <></>
            )}
            <Badge badgeContent={newMessages} max={999} color="secondary">
              <IconButton
                onClick={() => setModel(!showModel)}
                style={{ color: "white" }}
              >
                <ChatIcon></ChatIcon>
              </IconButton>
            </Badge>
          </div>

          <video
            className={styles.meetUserVideo}
            ref={localVideoRef}
            autoPlay
            muted
          ></video>

          <div
            className={styles.conferenceView}
            style={{ marginRight: showModel ? "260px" : "0px" }}
          >
       
            {videos.map((video, index) => (
              <div key={video.socketId}>
                <video
                  data-socket={video.socketId}
                  ref={(ref) => {
                    if (ref && video.stream && ref.srcObject !== video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  autoPlay
                ></video>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
