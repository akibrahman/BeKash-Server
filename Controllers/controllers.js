import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserModel } from "../Models/UserModel.js";

//! Root Response
export const IndexController = async (req, res) => {
  res.send("BeKash Server is Running");
};

//! Registration API
export const RegisterController = async (req, res) => {
  try {
    const body = await req.body;
    // const existingUser = await UserModel.find({ email: user.email });
    // if (existingUser.length != 0) {
    //   console.log("User Already Exists");
    //   res.send({ msg: "user exists" });
    //   return;
    // }
    bcrypt.hash(body.pin, 10, async (error, hash) => {
      if (error) {
        console.log(error);
        res.send({
          msg: "Hashing Error",
          error,
          success: false,
        });
        return;
      }
      const token = jwt.sign(
        { email: body.email },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "1h",
        }
      );
      console.log("----------------------------------------------------------");
      try {
        const registeredUser = await UserModel.create({
          ...body,
          pin: hash,
          isRoleVerified: body.role === "user" ? true : false,
          balance: body.role === "user" ? 40 : 100000,
          isLoggedIn: true,
        });
        res
          .cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
          })
          .send({
            msg: "User Registered & Token created",
            user: registeredUser,
            success: true,
          });
      } catch (error) {
        console.log(error);
        console.log(error.code);
        res.status(500).send({
          msg: "Unique Error",
          error,
          success: false,
        });
        return;
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      msg: "User Registration Error in Backend",
      error,
      success: false,
    });
  }
};
