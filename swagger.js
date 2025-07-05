const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'API Absensi Siswa',
    description: 'Dokumentasi API untuk sistem absensi RFID siswa',
  },
  host: 'localhost:3000', // atau ganti dengan domain kamu di production
  schemes: ['http', 'https'],
  components: {},
  securityDefinitions: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./api/index.js']; // file utama kamu (ubah sesuai kebutuhan)

swaggerAutogen(outputFile, endpointsFiles, doc);
