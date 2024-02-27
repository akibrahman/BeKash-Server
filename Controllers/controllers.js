import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserModel } from "../Models/UserModel.js";

//! Root Response
export const IndexController = async (req, res) => {
  res.send("BeKash Server is Running");
};

//! Token VerifY
export const verifyToken = async (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    console.log("Token Middleware Error");
    return res.status(401).send({ success: false, message: "Unauthorized" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log("Token Middleware Error");
      return res.status(402).send({ success: false, message: "Unauthorized" });
    }
    req.jwt = decoded;
    next();
  });
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

        res.status(400).send({
          msg: "Unique Error",
          error,
          success: false,
        });
        // throw new Error(error);
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
        const { email } = jwt.decode(token);
        await UserModel.findOneAndUpdate({ email }, { isLoggedIn: false });
        return res
          .status(402)
          .send({ msg: "Expired or wrong token", success: false });
      }
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

export const GetAgentsController = async (req, res) => {
  try {
    const agents = await UserModel.find({ role: "agent" });
    res.send({ msg: "Agents", success: true, agents });
  } catch (error) {
    console.log(error);
    res.send({ msg: "Failed to fetch Agents", success: false, error });
  }
};

export const ApproveAgentController = async (req, res) => {
  try {
    const { id } = await req.body;
    const result = await UserModel.findByIdAndUpdate(id, {
      isRoleVerified: true,
      isBlocked: false,
    });
    res.send({ msg: "Agent Approved", success: true, result });
  } catch (error) {
    console.log(error);
    res.send({ msg: "Agent Approval Error", success: false, error });
  }
};
export const RejectAgentController = async (req, res) => {
  try {
    const { id } = await req.body;
    const result = await UserModel.findByIdAndUpdate(id, {
      isRoleVerified: false,
      isBlocked: true,
    });
    res.send({ msg: "Agent Rejected", success: true, result });
  } catch (error) {
    console.log(error);
    res.send({ msg: "Agent Rejection Error", success: false, error });
  }
};
export const BlockUserController = async (req, res) => {
  try {
    const { id } = await req.body;
    const result = await UserModel.findByIdAndUpdate(id, { isBlocked: true });
    res.send({ msg: "User Blocked", success: true, result });
  } catch (error) {
    console.log(error);
    res.send({ msg: "User Blocation Error", success: false, error });
  }
};

export const AddTransactionController = async (req, res) => {};

export const SendMoneyController = async (req, res) => {
  const body = await req.body;
  const decode = await req.jwt;
  if (body.email != decode.email) {
    console.log("Wrong User");
    return res.status(402).send({ success: false, message: "Unauthorized" });
  }
  const receiver = await UserModel.findOne({ mobileNumber: body.mobileNumber });
  const sender = await UserModel.findOne({ email: body.email });
  const admin = await UserModel.findOne({ role: "admin" });
  if (!receiver) {
    console.log("No such a User");
    return res.send({ success: false, msg: "Wrong Number" });
  }
  const pinData = await bcrypt.compare(body.pin, sender.pin);
  if (!pinData) {
    console.log("Wrong PIN");
    return res.send({ success: false, msg: "Wrong PIN" });
  }
  if (sender.balance < (body.amount > 100 ? body.amount + 5 : body.amount)) {
    console.log("Insufficient Balance");
    return res.send({ success: false, msg: "Insufficient Balance" });
  }
  sender.balance =
    sender.balance -
    parseInt(body.amount > 100 ? body.amount + 5 : body.amount);
  await sender.save();
  receiver.balance = receiver.balance + body.amount;
  await receiver.save();
  if (body.amount > 100) {
    admin.balance = admin.balance + 5;
    await admin.save();
  }
  return res.send({ msg: "Send Money Completed", success: true });
};
