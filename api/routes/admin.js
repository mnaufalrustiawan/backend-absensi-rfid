const express = require("express");
const router = express.Router();
const ExcelJS = require("exceljs");
const { User, Attendance, Student, Class } = require("../models");
const { authMiddleware, authorize } = require("../middleware/auth");
const { Op, literal } = require("sequelize");

router.use(authMiddleware);
router.use(authorize('admin'));
router.use(authorize('admin', 'operator'));

router.get("/admin/semua-absen", async function (req, res) {
  /*
    #swagger.tags = ['Admin']
    #swagger.description = 'Ambil semua data absensi lengkap beserta nama siswa'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.responses[200] = {
      description: "Berhasil ambil data absensi",
      schema: [{ id: 1, studentId: 1, date: "2025-07-05", status: "hadir", Student: { name: "John Doe" } }]
    }
  */
  const attendance = await Attendance.findAll({
    include: {
      model: Student,
      attributes: ['name'],
    },
  });

  res.status(200).json(attendance);
});

router.delete("/admin/hapus-semua-absen", async function (req, res) {
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /*
    #swagger.tags = ['Admin']
    #swagger.description = 'Hapus seluruh data absensi secara permanen'
    #swagger.responses[200] = {
      description: "Berhasil menghapus semua data absensi",
      schema: 100
    }
    #swagger.responses[500] = {
      description: "Gagal menghapus",
    }
  */
  try {
    const attandance = await Attendance.destroy({ where: {}, force: true });
    res.status(200).json(attandance);
  } catch (err) {
    console.error("Hapus semua absen error:", err);
    res.status(500).json({ message: "Gagal menghapus semua absen", error: err.message });
  }
});

router.get("/admin/export-excel", async function (req, res) {
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /*
    #swagger.tags = ['Admin']
    #swagger.description = 'Export data absensi menjadi file Excel'
    #swagger.parameters['classId'] = {
      in: 'query',
      type: 'integer',
      description: 'ID kelas (opsional)'
    }
    #swagger.parameters['date'] = {
      in: 'query',
      type: 'string',
      description: 'Tanggal, bulan, atau tahun (contoh: 2025-07-05, 2025-07, 2025)'
    }
    #swagger.parameters['tipe'] = {
      in: 'query',
      type: 'string',
      enum: ['tanggal', 'bulan', 'tahun'],
      description: 'Tipe filter berdasarkan waktu'
    }
    #swagger.responses[200] = {
      description: "Berhasil download file Excel",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: { type: "string", format: "binary" }
        }
      }
    }
    #swagger.responses[404] = {
      description: "Data tidak ditemukan"
    }
    #swagger.responses[500] = {
      description: "Gagal export Excel"
    }
  */

  try {
    const { classId, date, tipe } = req.query;
    const studentWhere = classId ? { classId } : {};
    const attendanceWhere = {};

    if (date && tipe) {
      const parts = date.split("-");
      if (tipe === "tanggal" && parts.length === 3) {
        attendanceWhere.date = date;
      } else if (tipe === "bulan" && parts.length >= 2) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        attendanceWhere[Op.and] = [
          literal(`YEAR(date) = ${year}`),
          literal(`MONTH(date) = ${month}`),
        ];
      } else if (tipe === "tahun" && parts.length >= 1) {
        const year = parseInt(parts[0]);
        attendanceWhere[Op.and] = [literal(`YEAR(date) = ${year}`)];
      }
    }

    const data = await Attendance.findAll({
      where: attendanceWhere,
      include: {
        model: Student,
        where: studentWhere,
        attributes: ["name", "classId"],
        include: {
          model: Class,
          attributes: ["name"],
        },
      },
    });

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "Data absensi tidak ditemukan" });
    }

    const workbook = new ExcelJS.Workbook();

    function formatTanggal(dateString, tipe) {
      const tanggal = new Date(dateString);
      if (tipe === "tanggal") {
        return tanggal.toISOString().split("T")[0];
      } else if (tipe === "bulan") {
        return tanggal.toLocaleDateString("id-ID", { month: "long", year: "numeric" }).replace(/\s/g, "_");
      } else if (tipe === "tahun") {
        return tanggal.getFullYear().toString();
      } else {
        return tanggal.toLocaleDateString("id-ID");
      }
    }

    function sanitizeFilename(text) {
      return text.replace(/[\\/:*?"<>|]/g, "_").replace(/\s/g, "_");
    }

    let filename = "";

    if (!classId) {
      const groupedByClass = {};
      data.forEach((item) => {
        const className = item.Student?.Class?.name || "Tanpa_Kelas";
        if (!groupedByClass[className]) groupedByClass[className] = [];
        groupedByClass[className].push(item);
      });

      for (const className in groupedByClass) {
        const sheet = workbook.addWorksheet(className.replace(/\s/g, "_"));

        sheet.columns = [
          { header: "No", key: "no", width: 5 },
          { header: "Nama", key: "name", width: 30 },
          { header: "Tanggal", key: "date", width: 20 },
          { header: "Hadir", key: "hadir", width: 10 },
          { header: "Izin", key: "izin", width: 10 },
          { header: "Alpha", key: "alpha", width: 10 },
          { header: "Keterangan", key: "keterangan", width: 30 },
        ];

        const tanggalHeader = date && tipe ? `${tipe?.toUpperCase()} ${formatTanggal(date, tipe)}` : "";
        sheet.spliceRows(1, 0, [`Laporan Absensi Kelas ${className} ${tanggalHeader}`.trim()], []);
        sheet.mergeCells('A1:G1');
        sheet.getCell('A1').font = { bold: true, size: 14 };
        sheet.getCell('A1').alignment = { horizontal: 'center' };

        sheet.getRow(3).eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB6D7A8' } };
          cell.font = { bold: true };
          cell.alignment = { horizontal: 'center' };
          cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
        });

        groupedByClass[className].forEach((item, index) => {
          const status = item.status;
          const row = sheet.addRow({
            no: index + 1,
            name: item.Student?.name || "-",
            date: new Date(item.date).toLocaleDateString("id-ID"),
            hadir: status === "hadir" ? "✔" : "-",
            izin: status === "izin" ? "✔" : "-",
            alpha: status === "alpha" ? "✔" : "-",
            keterangan: item.keterangan || "tanpa keterangan",
          });

          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' },
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          });
        });
      }

      filename = "laporan_absensi_semua_kelas_persheet";
      if (date && tipe) {
        filename += `_${tipe}_${sanitizeFilename(formatTanggal(date, tipe))}`;
      }
    } else {
      // ... (Bagian else untuk satu kelas, bisa ditambahkan jika dibutuhkan)
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Export Excel error:", err);
    res.status(500).json({ message: "Gagal export Excel", error: err.message });
  }
});

module.exports = router;
