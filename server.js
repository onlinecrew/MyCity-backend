import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import "dotenv/config";
import { v4 as uuidv4 } from "uuid";

import { sendSms } from "./functions/sendSms.js";
import { isEmail } from "./functions/isEmail.js";
import auth from "./middleware/auth.js";

import Events from "./models/Events.js";
import User from "./models/User.js";

const app = express();

app.use(express.json());

app.post("/api/v1/events", auth, async (req, res) => {
  const { title, userID, location, description, type, address } = req.body;

  try {
    mongoose.connect(process.env.DB_CONNECTION);
    const timestamp = new Date();
    await new Events({ title, userID, location, description, type, timestamp, address }).save();

    res.json({ status: "success" });
  } catch (err) {
    res.status(500).json({ message: "Struktura danych niepoprawna! Sprawdź dokumentację API." });
  }
});

app.get("/api/v1/events", auth, async (req, res) => {
  try {
    mongoose.connect(process.env.DB_CONNECTION);
    const problemsData = await Events.find();

    res.json([...problemsData]);
  } catch (err) {
    res.status(500).json({ message: "Wystąpił problem spróbuj ponownie." });
  }
});

app.get("/api/v1/events/:userID", auth, async (req, res) => {
  const userID = req.params.userID;

  try {
    mongoose.connect(process.env.DB_CONNECTION);
    const problemsData = await Events.find({ userID });

    res.json([...problemsData]);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.delete("/api/v1/events/:id", auth, async (req, res) => {
  const id = req.params.id;

  try {
    mongoose.connect(process.env.DB_CONNECTION);
    const { acknowledged, deletedCount } = await Events.findOne({ _id: id }).remove().exec();

    if (acknowledged && deletedCount) {
      res.json({ status: "success", deletedCount });
      return;
    }
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.post("/register", async (req, res) => {
  const { name, password, city } = req.body;
  let { email } = req.body;

  email = email.toLowerCase();

  if (!name || !email || !password) {
    res.status(404).send();
    return;
  }

  try {
    const firstname = name.split(" ")[0];
    const lastname = name.split(" ")[1];

    if (!(email && password && firstname && lastname)) {
      res.status(400).json({ message: "Wypełnij wszytkie pola!" });
    }

    if (!isEmail(email)) {
      res.status(400).json({ message: "Podaj poprawny adres email" });
      return;
    }

    mongoose.connect(process.env.DB_CONNECTION);

    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.status(409).json({ message: "Użytkownik o podanym email już istnieje" });
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    const userID = uuidv4();

    const user = await User.create({
      firstname,
      lastname,
      email,
      userID,
      city,
      password: encryptedPassword,
    });

    const token = jwt.sign({ user_id: user._id, email }, process.env.TOKEN_KEY, {
      expiresIn: "30d",
    });

    user.token = token;

    res.json({ token, message: "Twoje konto zostało utworzone" });
  } catch (err) {
    res.status(500).json({ message: "error" });
    console.log("[ /register ] - ", err.message);
  }
});

app.post("/login", async (req, res) => {
  const { password } = req.body;
  let { email } = req.body;

  email = email.toLowerCase();

  if (!email || !password) {
    res.status(404).send();
    return;
  }

  try {
    if (!(email && password)) {
      res.status(400).send({ message: "Wypełnij wszytkie pola!" });
    }

    mongoose.connect(process.env.DB_CONNECTION);

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ user_id: user._id, email }, process.env.TOKEN_KEY, {
        expiresIn: "30d",
      });

      user.token = token;

      const { firstname, lastname, userID, city } = user;

      res.json({ token, firstname, lastname, email, userID, city });
      return;
    }
    res.status(403).json({ message: "Błędny email lub hasło!" });
  } catch (err) {
    res.status(500).json({ message: "Wystąpił błąd wewnętrzny!" });
  }
});

app.post("/api/sms", auth, async (req, res) => {
  const { message, phone } = req.body;

  if (!message || !phone) {
    res.status(404).send();
    return;
  }

  if (phone.toString().length > 9 || phone.toString().length < 9) {
    res.status(404).send("Phone number is invalid!");
    return;
  }

  const { status } = await sendSms(message, phone);

  if (status === "error") {
    res.json({ status: "error", message: "Wystąpił błąd! Nie udało się wysłać wiadomości" });
    return;
  }

  res.json({ status: "success", message: "Wiadomość wysłana" });
});

app.all("*", (req, res) => {
  res.status(404).send(`Niestety nie wiem co to znaczy ${req.originalUrl}. Sorry nie pomogę :(`);
});

app.listen(5420);
