const conn = require("../mariadb");
const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const ensureAuthorization = require("../auth");

const unauthorized = (res, auth) =>
  res.status(StatusCodes.UNAUTHORIZED).json({
    message:
      auth instanceof jwt.TokenExpiredError
        ? "로그인 세션이 만료되었습니다."
        : "로그인이 필요합니다.",
  });

const addLike = (req, res) => {
  const auth = ensureAuthorization(req);
  if (auth instanceof jwt.JsonWebTokenError) return unauthorized(res, auth);

  const likedBookId = parseInt(req.params.id);

  const sql = "INSERT INTO likes (user_id, liked_book_id) VALUES (?, ?)";
  const values = [auth.id, likedBookId];
  conn.query(sql, values, (err, result) => {
    if (err) {
      console.log(err);
      if (err.code === "ER_DUP_ENTRY") {
        return res
          .status(StatusCodes.CONFLICT)
          .json({ message: "이미 좋아요한 도서입니다." });
      }
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    return res.status(StatusCodes.CREATED).json(result);
  });
};

const removeLike = (req, res) => {
  const auth = ensureAuthorization(req);
  if (auth instanceof jwt.JsonWebTokenError) return unauthorized(res, auth);

  const likedBookId = parseInt(req.params.id);

  const sql = "DELETE FROM likes WHERE user_id = ? AND liked_book_id = ?";
  const values = [auth.id, likedBookId];
  conn.query(sql, values, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }

    return res.status(StatusCodes.OK).json(result);
  });
};

module.exports = {
  addLike,
  removeLike,
};
