const express = require('express');

//import the usermodel.js file
const User = require('../models/Usermodels');
const bcrypt = require('bcrypt')

const signinRoute = express.Router();

signinRoute.post('/signin', (req, res) => {
    let {email, password} = req.body;

    email = email.trim();
    password = password.trim()

    if(email == "" || password == ""){
        res.json({
            status: "FAILED",
            message: "All fields are required!"
        })
    }else {
        //check if a user with the provided email address exists
        User.find({email})
            .then(data => {

                //if the user exists compare the provided password
                if(data.length){

                    if(!data[0].verified){
                        res.json({
                            status: "FAILED",
                            message: "You are yet to verify your account! Please check your inbox or spam for verification code"
                        })
                    }else {
                        const hashedPassword = data[0].password
                    bcrypt.compare(password, hashedPassword)
                        .then(result => {
                            if(result){
                                res.json({
                                    status: "SUCCESS",
                                    message: "You have successfully logged in!"
                                })
                            }else {
                                res.json({
                                    status: "FAILED",
                                    message: "Password incorrect!"
                                })
                            }
                        }).catch(err => {
                            res.json({
                                status: "FAILED",
                                message: "Password comparison failed!"
                            }) 
                        })
                    }
                    
                }else {
                    res.json({
                        status: "FAILED",
                        message: "No user with the procvided email address!"
                    })
                }
            }).catch(err => {
                res.json({
                    status: "FAILED",
                    message: "An error occured!"
                })
            })
    }
})

module.exports = signinRoute 