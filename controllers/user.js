import { asyncError } from "../middlewares/error.js";
import { User } from "../models/user.js"
import ErrorHadler from "../utils/error.js";
import { cookieOptions, getDataUri, sendEmail, sendToken } from "../utils/features.js";
import cloudinary from 'cloudinary';

export const login = asyncError(async (req, res, next) => {

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return next(new ErrorHadler("Incurrect Email or Password", 400))
    }
    if (!password) return next(new ErrorHadler("Please Enter Password", 400))

    //Handle error

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return next(new ErrorHadler("Incurrect Email or Password", 400))
    };

    sendToken(user, res, `Welcome Back ${user.name}`, 200)
})

export const signup = asyncError(async (req, res, next) => {

    const { name, email, password, address, city, country, pinCode } = req.body;


    let user = await User.findOne({ email });
    if (user) return next(new ErrorHadler("User Already Exists", 400));

    let avatar = undefined;

    if (req.file) {
        // file
        const file = getDataUri(req.file)

        //Add Cloudinary here
        const myCloud = await cloudinary.v2.uploader.upload(file.content);
        avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url
        }
    }

    user = await User.create({
        avatar, name, email, password, address, city, country, pinCode
    });

    sendToken(user, res, "Registered Successfully", 200)

});

export const logOut = asyncError(async (req, res, next) => {

    res.status(200).cookie("token", "", {
        ...cookieOptions,
        expires: new Date(Date.now())
    }).json({
        success: true,
        message: "Logged Out Successfully",
    })
})

export const getMyProfile = asyncError(async (req, res, next) => {

    const user = await User.findById(req.user._id)

    res.status(200).json({
        success: true,
        user,
    })
})

export const updateProfile = asyncError(async (req, res, next) => {

    const user = await User.findById(req.user._id)

    const { name, email, address, city, country, pinCode } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;
    if (address) user.address = address;
    if (city) user.city = city;
    if (country) user.country = country;
    if (pinCode) user.pinCode = pinCode;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Profile Updated Successfully",
    })
})

export const changePassword = asyncError(async (req, res, next) => {

    const user = await User.findById(req.user._id).select("+password");

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) return next(new ErrorHadler("Please Enter Old Password & New Password", 400))

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
        return next(new ErrorHadler("Incurrect Old Password", 400))
    };

    user.password = newPassword;
    await user.save();

    res.status(200).json({
        success: true,
        message: "Password Changed Successfully",
    })
})


export const updatePic = asyncError(async (req, res, next) => {

    const user = await User.findById(req.user._id)

    // file
    const file = getDataUri(req.file)

    //Delete the Uploaded img
    await cloudinary.v2.uploader.destroy(user.avatar.public_id)

    //Add Cloudinary here
    const myCloud = await cloudinary.v2.uploader.upload(file.content);
    user.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url
    }

    await user.save();

    res.status(200).json({
        success: true,
        message: "Image Updated Successfully",
    })
})

export const forgetPassword = asyncError(async (req, res, next) => {

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return next(new ErrorHadler("Incorrect Email", 404));

    //max,min 2000, 10000
    //math.random()*(max-min)+min

    const randomNo = Math.random() * (999999 - 100000) + 100000;
    const otp = Math.floor(randomNo);
    const otp_expire = 15 * 60 * 1000;

    user.otp = otp;
    user.otp_expire = new Date(Date.now() + otp_expire);

    console.log(otp)

    await user.save();

    //Send Email

    const message = `You OTP for Reseting Password is ${otp}.\n Please ignore if you haven't requested this`
    try {
        await sendEmail("OTP For Reseting Password", user.email, message)
    } catch (error) {
        user.otp = null;
        user.otp_expire = null;
        await user.save();
        console.log('err', error);
        return next(error)
    }

    res.status(200).json({
        success: true,
        message: `OTP Sent to ${user.email}`,
    })
})



export const resetPassword = asyncError(async (req, res, next) => {

    const { otp, password } = req.body;

    const user = await User.findOne({
        otp,
        otp_expire: {
            $gt: Date.now(),
        }
    })

    if (!user) return next(new ErrorHadler("Incorrect OTP or has been expired", 400));
    if (!password) return next(new ErrorHadler("Please Enter New Password", 400))

    user.password = password;
    user.otp = undefined;
    user.otp_expire = undefined

    await user.save()

    res.status(200).json({
        success: true,
        message: 'Password Changed Successfully, You can login now',
    })
})

