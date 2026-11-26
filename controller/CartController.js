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

const addToCart = (req, res) => {
  const auth = ensureAuthorization(req);
  if (auth instanceof jwt.JsonWebTokenError) return unauthorized(res, auth);

  const { bookId, quantity } = req.body;

  const sql =
    "INSERT INTO cartItems (book_id, quantity, user_id) VALUES (?, ?, ?)";
  const values = [bookId, quantity, auth.id];
  conn.query(sql, values, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }
    return res.status(StatusCodes.CREATED).json(result);
  });
};

const getCartItems = (req, res) => {
  const auth = ensureAuthorization(req);
  if (auth instanceof jwt.JsonWebTokenError) return unauthorized(res, auth);

  const { selected } = req.body ?? {};

  let sql = `SELECT cartItems.id, book_id, title, summary, quantity, price, img
             FROM cartItems LEFT JOIN books ON cartItems.book_id = books.id
             WHERE user_id = ?`;
  const values = [auth.id];

  if (Array.isArray(selected) && selected.length > 0) {
    sql += " AND cartItems.id IN (?)";
    values.push(selected);
  }

  conn.query(sql, values, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }
    return res.status(StatusCodes.OK).json(result);
  });
};

const removeCartItems = (req, res) => {
  const auth = ensureAuthorization(req);
  if (auth instanceof jwt.JsonWebTokenError) return unauthorized(res, auth);

  const cartItemId = parseInt(req.params.id);

  const sql = "DELETE FROM cartItems WHERE id = ? AND user_id = ?";
  conn.query(sql, [cartItemId, auth.id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }
    return res.status(StatusCodes.OK).json(result);
  });
};

module.exports = { addToCart, getCartItems, removeCartItems };
