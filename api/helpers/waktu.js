// helpers/waktu.js

const getWaktuWIB = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const [hh, mm, ss] = formatter.format(now).split(':');
  return `${hh}:${mm}:${ss}`;
};

const getTanggalWIB = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(now); // YYYY-MM-DD
};

const getDateTimeWIB = () => {
  return {
    date: getTanggalWIB(),
    time: getWaktuWIB(),
  };
};

module.exports = {
  getWaktuWIB,
  getTanggalWIB,
  getDateTimeWIB,
};
