import React from "react";
import "../App.css";
import { Link, useNavigate } from "react-router-dom";

export default function LandingPage() {
  const router = useNavigate();

  return (
    <div className="landingPageContainer">
        
      {/* NAVBAR */}
      <nav className="navbar">
        
        <div className="logoContainer">
          <img src="/mainlogo.png" alt="main logo" className="logoImage"/>
          <h2 className="logo">MeetSync</h2>
        </div>

        <div className="navLinks">
          <p onClick={() => router("/q23qsc")}>Join as Guest</p>
          <p onClick={() => router("/auth")}>Register</p>
          <button onClick={() => router("/auth")}>Login</button>
        </div>
      </nav>

      {/* MAIN SECTION */}
      <div className="landingMainContainer">
        
        {/* LEFT TEXT */}
        <div className="leftSection">
          <h1>
            <span>Connect</span> with your loved Ones
          </h1>

          <p>Experience seamless video calling anytime, anywhere 💬</p>

          <Link to="/auth" className="startBtn">
            Get Started
          </Link>
        </div>

        {/* RIGHT IMAGE */}
        <div className="rightSection">
          <img src="/mobile.png" alt="video call" />
        </div>
      </div>
    </div>
  );
}