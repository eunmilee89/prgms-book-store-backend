const conn = require("../mariadb");
const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const ensureAuthorization = require("../auth");

const allBooks = (req, res) => {
  const { news, categoryId, category_id } = req.query;
  const limit = parseInt(req.query.limit) || 8;
  const currentPage = parseInt(req.query.currentPage) || 1;
  const offset = limit * (currentPage - 1);
  const catId = categoryId ?? category_id;

  let where = "";
  const values = [];

  if (catId !== undefined && catId !== "") {
    where += " WHERE category_id = ?";
    values.push(catId);
  }
  if (news === "true") {
    where += where ? " AND" : " WHERE";
    where += " pub_date BETWEEN DATE_SUB(NOW(), INTERVAL 1 MONTH) AND NOW()";
  }

  const listSql = `SELECT books.*, books.pub_date AS pubDate,
    (SELECT count(*) FROM likes WHERE liked_book_id = books.id) AS likes
    FROM books${where} LIMIT ? OFFSET ?`;
  const countSql = `SELECT count(*) AS totalCount FROM books${where}`;

  conn.query(listSql, [...values, limit, offset], (err, books) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }
    conn.query(countSql, values, (err, countResult) => {
      if (err) {
        console.log(err);
        return res.status(StatusCodes.BAD_REQUEST).end();
      }
      return res.status(StatusCodes.OK).json({
        books,
        pagination: { currentPage, totalCount: countResult[0].totalCount },
      });
    });
  });
};

const bookDetail = (req, res) => {
  const id = parseInt(req.params.id);
  const auth = ensureAuthorization(req);
  const userId = auth instanceof jwt.JsonWebTokenError ? null : auth.id;

  const sql = `SELECT books.*, books.pub_date AS pubDate,
    categories.name AS categoryName,
    (SELECT count(*) FROM likes WHERE liked_book_id = books.id) AS likes,
    (SELECT EXISTS (SELECT 1 FROM likes WHERE user_id = ? AND liked_book_id = ?)) AS liked
    FROM books
    LEFT JOIN categories ON books.category_id = categories.id
    WHERE books.id = ?`;

  conn.query(sql, [userId, id, id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }
    if (result[0]) {
      return res.status(StatusCodes.OK).json(result[0]);
    }
    return res.status(StatusCodes.NOT_FOUND).end();
  });
};

const bestBooks = (req, res) => {
  const sql = `SELECT books.*, books.pub_date AS pubDate,
    (SELECT count(*) FROM likes WHERE liked_book_id = books.id) AS likes
    FROM books
    ORDER BY likes DESC, books.id ASC
    LIMIT 10`;

  conn.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }
    return res.status(StatusCodes.OK).json(result);
  });
};

module.exports = { allBooks, bookDetail, bestBooks };
