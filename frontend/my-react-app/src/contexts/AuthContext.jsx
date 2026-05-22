import { useContext } from "react";
import { createContext } from "react";
import { useNavigate } from "react-router-dom";
import httpStatus from "http-status";
import { useState } from "react";
import axios from "axios";

export const AuthContext = createContext({});

const client = axios.create({
    baseURL: "https://meetsync-0c0k.onrender.com"
})

export const AuthProvider = ({children}) => {
    const authContext = useContext(AuthContext);

    const [userData, setUserData] = useState(authContext);

    const router = useNavigate();

    const handleRegister = async (name, username, password) => {
    try {
        const request = await client.post("/register", {
            name,
            username,
            password
        });

        return request.data.message;   // always return

    } catch (err) {
        throw err;
    }
}

    const handleLogin = async (username, password) => {     //handle errors in login
        try{
            let request = await client.post("/login", {
                username: username, 
                password: password
            });

            console.log(username, password)
            console.log(request.data)

            if(request.status === httpStatus.OK){
                localStorage.setItem("token", request.data.token);
                router("/home")
            }
        }catch(err){
            throw err;
        }
    }

    const getHistoryOfUser = async () => {
        try {
            let request = await client.get("/get_all_activity", {
                params: {
                    token: localStorage.getItem("token")
                }
            });
            return request.data
        }catch(e){
            throw e;
        }
    }

    const addToUserHistory = async (meetingCode, message) => {
        try{
            let request = await client.post("/add_to_activity", {
                token: localStorage.getItem("token"),
                meeting_code: meetingCode,
                message: message            
            })
            return request
        }catch(e){
            throw e;
        }
    }

    const data = {
        userData, setUserData, getHistoryOfUser, addToUserHistory, handleRegister, handleLogin
    }

    return(
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )
}