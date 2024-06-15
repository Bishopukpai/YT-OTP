//import express
const express = require('express');

//import nodemailer
const nodemailer = require('nodemailer');

//import dotenv 
require('dotenv').config()

//import the usermodel.js file
const User = require('../models/Usermodels'); 

//import OTPVerification model
const OTPVerification = require('../models/OTPVerification');
const bcrypt = require('bcrypt');

//create the signup router
const signupRoute = express.Router();

//create the transporter variable
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS
    }
})

//verify that the transporter is working
transporter.verify((error, success) => {
    if(error){
        console.log(error);
    }else {
        console.log("Transporter is working perfectly!");
        console.log(success)
    }
})

signupRoute.post('/signup', (req, res) => {
    //collect user data from the request body
    let {name, email, username, password, dateOfbirth} = req.body;

    //trim the collected data to remove all white spaces
    name = name.trim();
    email = email.trim();
    username = username.trim();
    password = password.trim();
    dateOfbirth = dateOfbirth.trim();

    //check if any of the fields are empty and respond with an error
    if(name == "" || email == "" || username == "" || password == "" || dateOfbirth == ""){
        res.json({
            status: "FAILED",
            message: "All input fields are required! Please make sure you fill in the correct details in all fields."
        })
    }else if(!/^[a-zA-Z ]*$/.test(name)){
        res.json({
            status: "FAILED",
            message: "Your name can only contain letters from A-z"
        })
    }else if(!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)){
        res.json({
            status: "FAILED",
            message: "Please enter a valid email address!"
        })
    }else if(!/^[a-zA-Z]*$/.test(username)){
        res.json({
            status: "FAILED",
            message: "Your username can only contain letters without white spaces"
        })
    }else if(!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,30}$/.test(password)){
        res.json({
            status: "FAILED",
            message: "A strong password be atleast 8 characters long, with 1 uppercase and lower case letter, a number and any special character!"
        })
    }else {
        //if all the fields are correctly filled, then you can start the signup process 

        //check if a user with the provided email address already exists

        User.find({email}).then(result => {
            if(result.length){
                res.json({
                    status: "FAILED",
                    message: "A user with the provided email address exists! Please login instead"
                })
            }else {
                //create an account if the user does not exist, first hash the provided user password.
                const saltRounds = 10;
                bcrypt.hash(password, saltRounds)
                    .then(hashedPassword => {
                        const newUser = new User({
                            name,
                            email,
                            username,
                            password: hashedPassword,
                            dateOfbirth,
                            verified: false
                        })
                        newUser.save()
                            .then(result => {
                                sendOTP(result, res)
                            }).catch(err => {
                                res.json({
                                    status: "FAILED",
                                    message: "Account creation failed!!"
                                })
                            })
                    }).catch(err => {
                        res.json({
                            status: "FAILED",
                            message: "Password could not be hashed!"
                        })
                    })
            }
        }).catch(err => {
            console.log(err)
            res.json({
                status: "FAILED",
                message: "An error occured!"
            }) 
        })
    }
})

//create a sendOTP function
const sendOTP = async ({_id, email}, res) => {
    try{
        //generate the otp
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`

        const mailOptions = {
            from: process.env.AUTH_EMAIL,
            to: email,
            subject: "Please Verify your Email",
            html: `<p>Use the code below to verify your account</p><b><p>${otp}</p></b>`
        }
        const saltRounds = 10;
        hashedOTP = await bcrypt.hash(otp, saltRounds)

        const newOTPVerificationRecord = new OTPVerification({
            userId: _id,
            otp: hashedOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000
        })
        await newOTPVerificationRecord.save()

        await transporter.sendMail(mailOptions)

        res.json({
            status: "PENDING",
            message: "Verification Email sent!",
            data: {
                userId: _id,
                email
            }
        })
    }catch(error){
        res.json({
            status: "FAILED",
            message: error.message
        })
    }
}
 
module.exports = signupRoute