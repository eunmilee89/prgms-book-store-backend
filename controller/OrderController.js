const mysql = require("mysql2/promise");
const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const ensureAuthorization = require("../auth");
const dotenv = require("dotenv");
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true,
};

const unauthorized = (res, auth) =>
  res.status(StatusCodes.UNAUTHORIZED).json({
    message:
      auth instanceof jwt.TokenExpiredError
        ? "로그인 세션이 만료되었습니다."
        : "로그인이 필요합니다.",
  });

const order = async (req, res) => {
  const auth = ensureAuthorization(req);
  if (auth instanceof jwt.JsonWebTokenError) return unauthorized(res, auth);

  const { items, delivery, totalQuantity, totalPrice, firstBookTitle } =
    req.body;

  if (!Array.isArray(items) || items.length === 0 || !delivery) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "주문할 상품과 배송 정보가 필요합니다." });
  }

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    await conn.beginTransaction();

    const [deliveryResult] = await conn.execute(
      "INSERT INTO deliveries (address, receiver, contact) VALUES (?, ?, ?)",
      [delivery.address, delivery.receiver, delivery.contact],
    );
    const deliveryId = deliveryResult.insertId;

    const [orderResult] = await conn.execute(
      "INSERT INTO orders (book_title, total_quantity, total_price, user_id, delivery_id) VALUES (?, ?, ?, ?, ?)",
      [firstBookTitle, totalQuantity, totalPrice, auth.id, deliveryId],
    );
    const orderId = orderResult.insertId;

    const [orderItems] = await conn.query(
      "SELECT book_id, quantity FROM cartItems WHERE id IN (?) AND user_id = ?",
      [items, auth.id],
    );

    if (orderItems.length === 0) {
      await conn.rollback();
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "장바구니에 주문할 상품이 없습니다." });
    }

    const values = orderItems.map((item) => [
      orderId,
      item.book_id,
      item.quantity,
    ]);
    await conn.query(
      "INSERT INTO orderedBooks (order_id, book_id, quantity) VALUES ?",
      [values],
    );

    await deleteCartItems(conn, items, auth.id);

    await conn.commit();
    return res.status(StatusCodes.CREATED).json({ orderId });
  } catch (err) {
    console.log(err);
    if (conn) await conn.rollback();
    return res.status(StatusCodes.BAD_REQUEST).end();
  } finally {
    if (conn) await conn.end();
  }
};

const deleteCartItems = async (conn, items, userId) => {
  const [result] = await conn.query(
    "DELETE FROM cartItems WHERE id IN (?) AND user_id = ?",
    [items, userId],
  );
  return result;
};

const getOrders = async (req, res) => {
  const auth = ensureAuthorization(req);
  if (auth instanceof jwt.JsonWebTokenError) return unauthorized(res, auth);

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    // getOrders
    const sql = `SELECT orders.id,
                    orders.created_at   AS createdAt,
                    address, receiver, contact,
                    book_title          AS bookTitle,
                    total_quantity      AS totalQuantity,
                    total_price         AS totalPrice
             FROM orders
             LEFT JOIN deliveries ON orders.delivery_id = deliveries.id
             WHERE orders.user_id = ?
             ORDER BY orders.created_at DESC`;
    const [rows] = await conn.query(sql, [auth.id]);
    return res.status(StatusCodes.OK).json(rows);
  } catch (err) {
    console.log(err);
    return res.status(StatusCodes.BAD_REQUEST).end();
  } finally {
    if (conn) await conn.end();
  }
};

const getOrderDetail = async (req, res) => {
  const auth = ensureAuthorization(req);
  if (auth instanceof jwt.JsonWebTokenError) return unauthorized(res, auth);

  const orderId = parseInt(req.params.id);

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    const sql = `SELECT orderedBooks.book_id AS bookId,
                    title, author, price, quantity, img
             FROM orderedBooks
             LEFT JOIN books ON orderedBooks.book_id = books.id
             JOIN orders ON orderedBooks.order_id = orders.id
             WHERE orderedBooks.order_id = ? AND orders.user_id = ?`;
    const [rows] = await conn.query(sql, [orderId, auth.id]);
    return res.status(StatusCodes.OK).json(rows);
  } catch (err) {
    console.log(err);
    return res.status(StatusCodes.BAD_REQUEST).end();
  } finally {
    if (conn) await conn.end();
  }
};

module.exports = {
  order,
  getOrders,
  getOrderDetail,
};
