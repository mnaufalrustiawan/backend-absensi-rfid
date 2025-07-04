const { getDateTimeWIB } = require('../helpers/waktu');

module.exports = (req, res, next) => {
  const { time, date } = getDateTimeWIB();
  req.timeNow = time;
  req.today = date;
  next();
};
