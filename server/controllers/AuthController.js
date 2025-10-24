import User from '../models/UserModel.js';
import jwt from 'jsonwebtoken';
import {compare}  from 'bcrypt';
import {renameSync, unlinkSync, existsSync} from "fs"
import path from "path";


const maxAge = 3 * 24 * 60 * 60 * 1000;

const createToken = (email, userId) => {
    return jwt.sign({ email, userId }, process.env.JWT_KEY, {
        expiresIn: maxAge
    });
};

export const signup = async (request, response, next) => {
    try {
        const { email, password } = request.body;
        if (!email || !password) {
            return response.status(400).json({ message: "Email and Password are required" });
        }
        const user = new User({ email, password });
        await user.save();
        response.cookie("jwt", createToken(email, user._id), {
            httpOnly: true,
            maxAge,
            secure: true,
            sameSite: "none",
        });
        response.status(201).json({
            user: {
                id: user._id,
                email: user.email,
                profileSetup: user.profileSetup,
            },
        });
    } catch (error) {
        console.log(error);
        return response.status(500).send("Internal Server Error");
    }
};



export const login = async (request, response, next) => {
    try {
        const { email, password } = request.body;
        if (!email || !password) {
            return response.status(400).json({ message: "Email and Password are required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return response.status(404).json({ message: "User not found" });
        }

        const auth = await compare(password, user.password);
        if (!auth) {
            console.log("Password comparison failed"); // Debug log
            return response.status(401).json({ message: "Password is Incorrect" });
        }

        response.cookie("jwt", createToken(email, user._id), {
            httpOnly: true,
            maxAge,
            secure: true,
            sameSite: "none",
        });
        response.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                profileSetup: user.profileSetup,
                firstName: user.firstName,
                lastName: user.lastName,
                image: user.image,
                color: user.color,
            },
        });
    } catch (error) {
        console.log(error);
        return response.status(500).send("Internal Server Error");
    }
};

export const getUserInfo = async (request, response, next) => {
    try {
        const userData = await User.findById(request.userId);
        if (!userData) {
            return response.status(404).json({ message: "User not found" });
        }
        
        response.status(200).json({
                id: userData._id,
                email: userData.email,
                profileSetup: userData.profileSetup,
                firstName: userData.firstName,
                lastName: userData.lastName,
                image: userData.image,
                color: userData.color,
        });
    } catch (error) {
        console.log(error);
        return response.status(500).send("Internal Server Error");
    }
};

export const updateProfile = async (request, response, next) => {
    try {
        const {userId} = request;  
        const { firstName, lastName, color } = request.body;
        if(!firstName || !lastName || color === undefined) {
            return response.status(400).json({ message: "Firstname, lastName and color is required" });
        }  
        
        const userData = await User.findByIdAndUpdate(userId,{
            firstName,
            lastName,
            color,
            profileSetup: true
        },{new: true, runValidators: true});
        
        return response.status(200).json({
                id: userData._id,
                email: userData.email,
                profileSetup: userData.profileSetup,
                firstName: userData.firstName,
                lastName: userData.lastName,
                image: userData.image,
                color: userData.color,
        });
    } catch (error) {
        console.log(error);
        return response.status(500).send("Internal Server Error");
    }
};

export const addProfileImage = async (request, response, next) => {
    try {
        if(!request.file){
            return response.status(400).send("File is required")
        }

        const date = Date.now();
        let fileName = "uploads/profiles/" + date + request.file.originalname
        renameSync(request.file.path, fileName)
        const updatedUser = await User.findByIdAndUpdate(request.userId, {image: fileName}, {new: true, runValidators: true})
        console.log(request.file.path)
        return response.status(200).json({
                image: updatedUser.image
        });
    } catch (error) {
        console.log(error);
        return response.status(500).send("Internal Server Error");
    }
};

export const removeProfileImage = async (request, response, next) => {
    try {
        const {userId} = request;  
        const user = await User.findById(userId)

        if(!user){
            return response.status(400).send("User not Found")
        }

        // Safely delete file
        if (user.image) {
        const imagePath = path.resolve(user.image);
        if (existsSync(imagePath)) {
            unlinkSync(imagePath);
        } else {
            console.warn("File not found:", imagePath);
        }
        }

        user.image=null
        await user.save()
        
        response.status(200).send("Profile removed successfully")
    } catch (error) {
        console.log(error);
        return response.status(500).send("Internal Server Error");
    }
};

export const logout = async (request, response, next) => {
    try {
        
        response.cookie("jwt", "", {
            httpOnly: true,
            maxAge: 1, secure: true,
            sameSite: "none",
        });
        return response.status(200).send("Logout Successful")
    } catch (error) {
        console.log(error);
        return response.status(500).send("Internal Server Error");
    }
};