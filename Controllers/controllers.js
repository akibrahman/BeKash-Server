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

//! Find User from DB
export const FindUserController = async (req, res) => {
  try {
    const token = req?.cookies?.token;
    if (!token) {
      return res.status(401).send({ msg: "No Token", success: false });
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        return res
          .status(402)
          .send({ msg: "Expired or wrong token", success: false });
      }
      console.log(decoded);
      const user = await UserModel.find({ email: decoded.email });
      res.send({ user: user[0], success: true });
    });
  } catch (error) {
    console.log(first);
    res
      .status(500)
      .send({ msg: "Finding user problem", success: false, error });
  }
};

//! Login User from web
export const LogInUserController = async (req, res) => {
  try {
    const user = await req.body;
    const phoneRegex = /^(?:\+88|88)?01[3-9]\d{8}$/;
    let query = {};
    if (phoneRegex.test(user.user)) {
      const numericOnly = user.user.replace(/\D/g, "");
      if (numericOnly.startsWith("88")) {
        query = { mobileNumber: "+" + numericOnly };
      } else if (numericOnly.startsWith("01") && numericOnly.length === 11) {
        query = { mobileNumber: "+88" + numericOnly };
      } else {
        query = { mobileNumber: user.user };
      }
    } else {
      query = { email: user.user };
    }
    const data = await UserModel.findOne(query);

    if (!data) {
      res.status(500).send({
        msg: "Email or Number is incorrect",
        success: false,
        code: 101,
      });
      return;
    }

    bcrypt.compare(user.pin, data.pin, async (err, result) => {
      if (err) {
        res.status(500).send({
          msg: "Wrong PIN",
          success: false,
          err,
          code: 102,
        });
        return;
      } else if (result) {
        if (data.isLoggedIn) {
          res.status(500).send({
            msg: "Logged in to another Device",
            success: false,
            code: 103,
          });
          return;
        }
        data.isLoggedIn = true;
        await data.save();
        const token = jwt.sign(
          { email: data.email },
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: "1h",
          }
        );
        res
          .cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
          })
          .send({ msg: "Password is correct", success: true, user: data });
      } else {
        res.send({ msg: "Password is incorrect", success: false });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      msg: "Login problem in Backend",
      success: false,
      error,
    });
  }
};

//! Logout User from web
export const LogOutUserController = async (req, res) => {
  const { email } = await req.body;
  await UserModel.findOneAndUpdate({ email }, { isLoggedIn: false });
  res
    .clearCookie("token", {
      maxAge: 0,
      secure: true,
      sameSite: "none",
    })
    .send({ success: true });
};
