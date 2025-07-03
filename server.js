require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const authRoute = require("./routes/auth");
const absenRoute = require("./routes/absen");
const adminRoute = require("./routes/admin");
const siswaRoute = require("./routes/siswa");
const userRoute = require("./routes/user");
const kelasRoute = require("./routes/kelas");

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoute);
app.use("/api",absenRoute);
app.use("/api",adminRoute);
app.use("/api",siswaRoute);
app.use("/api",userRoute);
app.use("/api",kelasRoute);



app.get("/", (req, res) => {
  res.send("API absensi aktif!");
});

app.listen(port, () => {
  console.log(`🚀 Server berjalan di http://localhost:${port}`);
});
