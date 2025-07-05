import swaggerAutogen from "swagger-autogen";

const doc = {
    info: {
        version: "v0.0.1",
        title: "Dokumentasi API Absensi Berbasis Face Recognition",
        description: "Dokumentasi API untuk sistem absensi berbasis face recognition yang mencakup fitur login, registrasi, manajemen kontak, dan pengajuan izin.",
    },
    servers: [
        {
            url: "http://localhost:3000/api",
            description: "Lokal server",
        },
        {
            url: "https://back-end-absensi.vercel.app/api",
            description: "Deploy server",
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
            },
        },
        schemas: {
            
        }
    }
}

const outputFile = "./swagger_output.json";
const endpointFiles = ["./src/routes/api.ts"];


swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointFiles, doc);