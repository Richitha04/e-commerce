import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import {redis} from "../lib/redis.js";

const generateTokens = (userID) => {
    const accessToken = jwt.sign({userID}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "15m",});

    const refreshToken = jwt.sign({userID}, process.env.REFRESH_TOKEN_SECRET, {expiresIn : "7d",});

    return {accessToken , refreshToken};
}

const storeRefreshToken = async(userID, refreshToken) => {
    await redis.set(`Refresh_Token : ${userID}`, refreshToken, "EX", 7*24*60*60);
}

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure:process.env.NODE_ENV === "production",
        sameSite:"strict",
        maxAge: 15*60*1000
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure:process.env.NODE_ENV === "production",
        sameSite:"strict",
        maxAge: 7*24*60*60*1000
    });
}

export const signup = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }   

        const user = await User.create({ email, password, name });

        //authenticate
        const {accessToken , refreshToken} = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);

        //cookies
        setCookies(res, accessToken, refreshToken);

        res.status(201).json({user:{
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        },message:"User created successfully"});

    } 
    catch (error) {
        res.status(500).json({ message: error});
        
    }
};

export const login = async (req, res) => {
    res.send("Login route");
};

export const logout = async (req, res) => {
    res.send("Logout route");
};