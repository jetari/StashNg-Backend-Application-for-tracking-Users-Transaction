import express from 'express';
const router = express.Router();

/* GET home page. */
router.post('/', function(req, res,) {
  res.send('I am connected to the PostgresSql database succefully');
});

export default router;