require("dotenv").config();
const serverless = require('serverless-http'); 
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
const waktuMiddleware = require('./middleware/waktu');

const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('../swagger-output.json'); // naik 1 folder karena ini di `api/`

app.use(waktuMiddleware);
app.use(cors());
app.use(express.json());

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.use("/api/auth", authRoute);
app.use("/api",absenRoute);
app.use("/api",adminRoute);
app.use("/api",siswaRoute);
app.use("/api",userRoute);
app.use("/api",kelasRoute);



app.get("/", (req, res) => {
  res.send("API absensi aktif!");
});

module.exports = app; // optional, untuk testing lokal
module.exports.handler = serverless(app); // ✅ ini yang dibutuhkan Vercel