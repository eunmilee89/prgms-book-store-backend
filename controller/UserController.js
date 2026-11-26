const conn = require("../mariadb");
const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

const hash = (password, salt) =>
  crypto.pbkdf2Sync(password, salt, 10000, 10, "sha512").toString("base64");

const join = (req, res) => {
  const { email, password } = req.body;

  const salt = crypto.randomBytes(10).toString("base64");
  const hashPassword = hash(password, salt);

  const sql = "INSERT INTO users (email, password, salt) VALUES (?, ?, ?)";
  const values = [email, hashPassword, salt];
  conn.query(sql, values, (err, result) => {
    if (err) {
      console.log(err);
      if (err.code === "ER_DUP_ENTRY") {
        return res
          .status(StatusCodes.CONFLICT)
          .json({ message: "이미 가입된 이메일입니다." });
      }
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    return res.status(StatusCodes.CREATED).json({ message: "회원가입 완료" });
  });
};

const login = (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  conn.query(sql, email, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    const loginUser = result[0];

    if (!loginUser) {
      return res.status(StatusCodes.UNAUTHORIZED).end();
    }

    const hashPassword = hash(password, loginUser.salt);

    if (loginUser.password !== hashPassword) {
      return res.status(StatusCodes.UNAUTHORIZED).end();
    }

    const token = jwt.sign(
      {
        id: loginUser.id,
        email: loginUser.email,
      },
      process.env.PRIVATE_KEY,
      {
        expiresIn: "1h",
        issuer: "eunmi",
      },
    );

    return res.status(StatusCodes.OK).json({ token });
  });
};

const passwordResetRequest = (req, res) => {
  const { email } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  conn.query(sql, email, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    const user = result[0];
    if (user) {
      return res.status(StatusCodes.OK).json({ email });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).end();
    }
  });
};

const passwordReset = (req, res) => {
  const { email, password } = req.body;

  const salt = crypto.randomBytes(10).toString("base64");
  const hashPassword = hash(password, salt);

  const sql = "UPDATE users SET password = ?, salt = ? WHERE email = ?";
  const values = [hashPassword, salt, email];
  conn.query(sql, values, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    if (result.affectedRows === 0) {
      return res.status(StatusCodes.BAD_REQUEST).end();
    }
    return res.status(StatusCodes.OK).json({ message: "비밀번호 변경 완료" });
  });
};

module.exports = { join, login, passwordResetRequest, passwordReset };
