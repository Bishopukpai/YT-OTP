const express = require('express');
const VerifyOTPRouter = express.Router()

const bcrpt = require('bcrypt')

const OTPVerification = require('../models/OTPVerification')
const User = require('../models/Usermodels')

VerifyOTPRouter.post('/verifyotp', async(req, res) => {
    try{
        let {userId, otp} = req.body;

        if (userId == "" || otp == ""){
            res.json({
                status: "FAILED",
                message: "Empty fields are not allowed!"
            })
        }else {
            const OTPVerificationRecord = await OTPVerification.find({userId})

            if(OTPVerificationRecord.length <= 0){
                res.json({
                    status: "FAILED",
                    message: "Invalid otp verification details!"
                })
            }else {
                const {expiresAt} = OTPVerificationRecord[0]

                const hashedOTP = OTPVerificationRecord[0].otp

                if(expiresAt < Date.now()){
                    await OTPVerification.deleteMany({userId})

                    await User.deleteOne({_id:userId})

                    res.json({
                        status: "FAILED",
                        message: "One time password has expired! Please signup to get another one"
                    })
                }else {
                    const validOTP = await bcrpt.compare(otp, hashedOTP)

                    if(!validOTP){
                        res.json({
                            status: "FAILED",
                            message: "Invalid one time password!"
                        })
                    }else {
                        await User.updateOne({_id:userId}, {verified:true})

                        await OTPVerification.deleteMany({userId})

                        res.json({
                            status: "SUCCESS",
                            message: "Verified!"
                        })
                    }
                }
            }
        }
    }catch{

    }
})
module.exports = VerifyOTPRouter;