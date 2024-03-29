import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { CashRequestModel } from "../Models/CashRequestModel.js";
import { TransactionModel } from "../Models/TransactionModel.js";
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
        await TransactionModel.create({
          senderNumber: "#",
          receiverNumber: body.mobileNumber,
          transactionID: new mongoose.Types.ObjectId(),
          createdAt: new Date().toISOString([], { timeZone: "Asia/Dhaka" }),
          amount: body.role === "user" ? 40 : 100000,
          methode: "Registration Bonus",
          for: "user",
          type: "main",
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

//! Get All Agents
export const GetAgentsController = async (req, res) => {
  try {
    const { number } = req.query;
    const regex = new RegExp(number, "i");
    const agents = await UserModel.find({ role: "agent", mobileNumber: regex });
    res.send({ msg: "Agents", success: true, agents });
  } catch (error) {
    console.log(error);
    res.send({ msg: "Failed to fetch Agents", success: false, error });
  }
};

//! Get All Users
export const GetUsersController = async (req, res) => {
  try {
    const { number } = req.query;
    const regex = new RegExp(number, "i");
    const users = await UserModel.find({ role: "user", mobileNumber: regex });
    console.log("---------------------");
    console.log(users);
    res.send({ msg: "Users", success: true, users });
  } catch (error) {
    console.log(error);
    res.send({ msg: "Failed to fetch Users", success: false, error });
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
//! Transactions User-Agent
export const TransactionsController = async (req, res) => {
  try {
    const { id } = await req.body;
    const user = await UserModel.findById(id);
    const transactions = await TransactionModel.find({
      $or: [
        { senderNumber: user.mobileNumber },
        { receiverNumber: user.mobileNumber },
      ],
      $or: [
        { for: user.role },
        { for: user.role == "user" ? "useradmin" : "" },
        { for: "useragent" },
      ],
    })
      .sort({ _id: -1 })
      .limit(100);
    return res.send({ msg: "Transactions Found", transactions, success: true });
  } catch (error) {
    console.log("Backend Error for fetching Transactions");
    console.log(error);
    return res.send({
      msg: "Backend Error for fetching Transactions",
      error,
      success: false,
    });
  }
};
//! Transactions Admin
export const AllTransactionsController = async (req, res) => {
  try {
    const transactions = await TransactionModel.find({}).sort({ _id: -1 });
    return res.send({ msg: "Transactions Found", transactions, success: true });
  } catch (error) {
    console.log("Backend Error for fetching Transactions");
    console.log(error);
    return res.send({
      msg: "Backend Error for fetching Transactions",
      error,
      success: false,
    });
  }
};
//! Transactions User
export const UserWiseTransactionsController = async (req, res) => {
  try {
    const { number } = await req.body;
    const numericOnly = number.replace(/\D/g, "");
    const transactions = await TransactionModel.find({
      $or: [
        { senderNumber: "+" + numericOnly },
        { receiverNumber: "+" + numericOnly },
      ],
    }).sort({ _id: -1 });
    return res.send({ msg: "Transactions Found", transactions, success: true });
  } catch (error) {
    console.log("Backend Error for fetching Transactions");
    console.log(error);
    return res.send({
      msg: "Backend Error for fetching Transactions",
      error,
      success: false,
    });
  }
};
//! Transactions By ID
export const IdTransactionsController = async (req, res) => {
  try {
    const { id } = await req.query;
    const transaction = await TransactionModel.findById(id);
    return res.send({ msg: "Transactions Found", transaction, success: true });
  } catch (error) {
    console.log("Backend Error for fetching Transactions");
    console.log(error);
    return res.send({
      msg: "Backend Error for fetching Transactions",
      error,
      success: false,
    });
  }
};
//! Send Money-----------------
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
  await TransactionModel.create({
    senderNumber: sender.mobileNumber,
    receiverNumber: receiver.mobileNumber,
    transactionID: new mongoose.Types.ObjectId(),
    createdAt: new Date().toISOString([], { timeZone: "Asia/Dhaka" }),
    amount: body.amount,
    methode: "Send Money",
    for: "user",
    type: "main",
  });
  if (body.amount > 100) {
    await TransactionModel.create({
      senderNumber: sender.mobileNumber,
      transactionID: new mongoose.Types.ObjectId(),
      createdAt: new Date().toISOString([], { timeZone: "Asia/Dhaka" }),
      amount: 5,
      methode: "Send Money Charge",
      for: "useradmin",
      type: "charge",
    });
  }
  return res.send({ msg: "Send Money Completed", success: true });
};
//! Cash Out ----------------
export const CashOutController = async (req, res) => {
  try {
    const body = await req.body;
    const decode = await req.jwt;
    if (body.email != decode.email) {
      console.log("Wrong User");
      return res.status(402).send({ success: false, message: "Unauthorized" });
    }
    const receiver = await UserModel.findOne({
      mobileNumber: body.mobileNumber,
      role: "agent",
    });
    if (!receiver) {
      console.log("No such a Receiver");
      return res.send({ success: false, msg: "Wrong Number" });
    }
    const sender = await UserModel.findOne({ email: body.email });
    const admin = await UserModel.findOne({ role: "admin" });
    const pinData = await bcrypt.compare(body.pin, sender.pin);
    if (!pinData) {
      console.log("Wrong PIN");
      return res.send({ success: false, msg: "Wrong PIN" });
    }
    if (sender.balance < (body.amount + body.amount * (1.5 / 100)).toFixed(2)) {
      console.log("Insufficient Balance");
      return res.send({ success: false, msg: "Insufficient Balance" });
    }

    const senderm = parseFloat(
      (body.amount + body.amount * (1.5 / 100)).toFixed(2)
    );
    const agentp = parseFloat(
      (body.amount + body.amount * (1.0 / 100)).toFixed(2)
    );
    const adminp = parseFloat((body.amount * (0.5 / 100)).toFixed(2));

    sender.balance -= senderm;
    await sender.save();
    receiver.balance += agentp;
    await receiver.save();
    admin.balance += adminp;
    await admin.save();
    //! Cash Out Transaction
    await TransactionModel.create({
      senderNumber: sender.mobileNumber,
      receiverNumber: receiver.mobileNumber,
      transactionID: new mongoose.Types.ObjectId(),
      createdAt: new Date().toISOString([], { timeZone: "Asia/Dhaka" }),
      amount: body.amount,
      methode: "Cash Out",
      for: "useragent",
      type: "main",
    });
    //! Cash Out Charge Transaction
    await TransactionModel.create({
      senderNumber: sender.mobileNumber,
      transactionID: new mongoose.Types.ObjectId(),
      createdAt: new Date().toISOString([], { timeZone: "Asia/Dhaka" }),
      amount: parseFloat((body.amount * (1.5 / 100)).toFixed(2)),
      methode: "Cash Out Charge",
      for: "user",
      type: "charge",
    });
    //! Cash Out Bonus to Agent Transaction
    await TransactionModel.create({
      senderNumber: sender.mobileNumber,
      receiverNumber: receiver.mobileNumber,
      transactionID: new mongoose.Types.ObjectId(),
      createdAt: new Date().toISOString([], { timeZone: "Asia/Dhaka" }),
      amount: parseFloat((body.amount * (1.0 / 100)).toFixed(2)),
      methode: "Cash Out Bonus to Agent",
      for: "agent",
      type: "charge",
    });
    //! Cash Out Bonus to Admin Transaction
    await TransactionModel.create({
      senderNumber: sender.mobileNumber,
      receiverNumber: admin.mobileNumber,
      transactionID: new mongoose.Types.ObjectId(),
      createdAt: new Date().toISOString([], { timeZone: "Asia/Dhaka" }),
      amount: parseFloat((body.amount * (0.5 / 100)).toFixed(2)),
      methode: "Cash Out Bonus to Admin",
      for: "admin",
      type: "charge",
    });
    return res.send({ success: true, msg: "Cash out Completed Successfully" });
  } catch (error) {
    console.log(error);
    return res.send({ success: false, msg: "Backend Error, try again", error });
  }
};

//! Cash In Controller
export const CashInController = async (req, res) => {
  try {
    const body = await req.body;
    const decode = await req.jwt;
    if (body.email != decode.email) {
      console.log("Wrong User");
      return res.status(402).send({ success: false, message: "Unauthorized" });
    }
    const receiver = await UserModel.findOne({
      mobileNumber: body.mobileNumber,
      role: "user",
    });
    if (!receiver) {
      console.log("No such a Receiver");
      return res.send({ success: false, msg: "Wrong Number" });
    }
    const sender = await UserModel.findOne({ email: body.email });
    // const admin = await UserModel.findOne({ role: "admin" });
    const pinData = await bcrypt.compare(body.pin, sender.pin);
    if (!pinData) {
      console.log("Wrong PIN");
      return res.send({ success: false, msg: "Wrong PIN" });
    }
    if (sender.balance < body.amount) {
      console.log("Insufficient Balance");
      return res.send({ success: false, msg: "Insufficient Balance" });
    }
    sender.balance -= body.amount;
    await sender.save();
    receiver.balance += body.amount;
    await receiver.save();
    const transactionID = new mongoose.Types.ObjectId();
    await TransactionModel.create({
      senderNumber: sender.mobileNumber,
      receiverNumber: receiver.mobileNumber,
      transactionID,
      createdAt: new Date().toISOString([], { timeZone: "Asia/Dhaka" }),
      amount: body.amount,
      methode: "Cash In",
      for: "useragent",
      type: "main",
    });
    return res.send({
      success: true,
      msg: "Cash In Completed Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.send({ success: false, msg: "Backend Error, try again", error });
  }
};

//! System Balance
export const SystemBalanceController = async (req, res) => {
  try {
    const users = await UserModel.find();
    const allUsers = users.filter((user) => user.role !== "admin");
    const systemBalance = allUsers.reduce((a, c) => a + c.balance, 0);
    return res.send({ success: true, systemBalance });
  } catch (error) {
    console.log(error);
    return res.send({ success: false, error });
  }
};

//! Adding Cash request
export const AddCashRequestController = async (req, res) => {
  try {
    const { id, name, email, number } = await req.body;
    await CashRequestModel.create({
      agentId: id,
      agentEmail: email,
      agentName: name,
      agentNumber: number,
      status: "processing",
      createdAt: new Date().toISOString([], { timeZone: "Asia/Dhaka" }),
    });
    return res.send({ msg: "Cash Request Created", success: true });
  } catch (error) {
    console.log(error);
    return res.send({
      msg: "Cash Request adding Problem",
      success: false,
      error,
    });
  }
};

//! Get Cash requests
export const GetCashRequestsController = async (req, res) => {
  try {
    const reqs = await CashRequestModel.find();
    return res.send({ msg: "Cash Requests", success: true, reqs });
  } catch (error) {
    console.log(error);
    return res.send({
      msg: "Getting Cash Requests Error",
      success: false,
      error,
    });
  }
};

//! Get Cash requests
export const EditCashRequestController = async (req, res) => {
  try {
    const { id, status } = await req.body;
    await CashRequestModel.findByIdAndUpdate(id, { status });
    return res.send({ msg: "Cash Requests", success: true });
  } catch (error) {
    console.log(error);
    return res.send({
      msg: "Editing Cash Request Error",
      success: false,
      error,
    });
  }
};

//! Approve Cash Request
export const ApproveCashRequestController = async (req, res) => {
  try {
    const { id } = await req.body;
    const requ = await CashRequestModel.findById(id);
    const agent = await UserModel.findOne({ _id: requ.agentId });
    agent.balance += 100000;
    await agent.save();
    await TransactionModel.create({
      senderNumber: "BeKash",
      receiverNumber: agent.mobileNumber,
      transactionID: new mongoose.Types.ObjectId(),
      createdAt: new Date().toISOString([], { timeZone: "Asia/Dhaka" }),
      amount: 100000,
      methode: "Cash Request",
      for: "agent",
      type: "main",
    });
    requ.status = "approved";
    await requ.save();
    return res.send({ msg: "Cash Request Approved", success: true });
  } catch (error) {
    console.log(error);
    return res.send({ msg: "Cash Request Approve Error", success: false });
  }
};

//! Decline Cash Request
export const DeclineCashRequestController = async (req, res) => {
  try {
    const { id } = await req.body;
    const requ = await CashRequestModel.findById(id);
    requ.status = "declined";
    await requ.save();
    return res.send({ msg: "Cash Request Declined", success: true });
  } catch (error) {
    console.log(error);
    return res.send({ msg: "Cash Request Decline Error", success: false });
  }
};
