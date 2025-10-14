require('dotenv').config(); // Carga las variables de entorno desde .env
const express = require('express'); // 1. Importación de Módulos
const cors = require('cors'); // Middleware para manejar CORS
const oracledb = require('oracledb'); // Driver de Oracle DB

// Inicialización de Express
const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Permite peticiones de diferentes orígenes
app.use(express.json()); // Permite a Express entender peticiones con cuerpo en formato JSON

// Configuración de la Conexión a la Base de Datos
async function initialize() {
    try {
        // Inicializar el pool de conexiones
        await oracledb.createPool({
            user: process.env.DB_USER, // Usuario de la BD
            password: process.env.DB_PASSWORD, // Contraseña de la BD
            connectString: process.env.DB_CONNECT_STRING, // Cadena de conexión
            poolMin: 4, // Número mínimo de conexiones en el pool
            poolMax: 10, // Número máximo de conexiones en el pool
            poolIncrement: 1 // Incremento de conexiones cuando se necesiten más
        });
        console.log('Pool de conexiones a Oracle creado exitosamente.');

        // Iniciar el servidor después de que el pool se haya creado
        app.listen(port, () => {
            console.log(`Servidor API corriendo en http://localhost:${port}`);
        });

    } catch (err) {
        console.error('Error al inicializar el pool de conexiones:', err);
        process.exit(1); // Salir de la aplicación si no se puede conectar a la BD
    }
}

// Llamar a la función de inicialización para empezar todo
initialize();

// Ruta de Prueba
app.get('/', (req, res) => {
    res.json({ message: '¡Bienvenido al API de Centros de Evaluación!' });
});



// Rutas del API
const centroRoutes = require('./routes/centro.routes');
app.use('/api/centros', centroRoutes);

const departamentoRoutes = require('./routes/departamento.routes');
app.use('/api/departamentos', departamentoRoutes);

const correlativoRoutes = require('./routes/correlativo.routes');
app.use('/api/correlativos', correlativoRoutes);

const escuelaRoutes = require('./routes/escuela.routes');
app.use('/api/escuelas', escuelaRoutes);

const pregRoutes = require('./routes/preg.routes');
app.use('/api/preguntas', pregRoutes);

const pregPractRoutes = require('./routes/preg_pract.routes');
app.use('/api/preguntas-practicas', pregPractRoutes);

const municipioRoutes = require('./routes/municipio.routes');
app.use('/api/municipios', municipioRoutes);

const ubicacionRoutes = require('./routes/ubicacion.routes');
app.use('/api/ubicaciones', ubicacionRoutes);

const registroRoutes = require('./routes/registro.routes');
app.use('/api/registros', registroRoutes);





// Ruta para probar la conexión a la BD
app.get('/test-db', async (req, res) => {
    let connection;
    try {
        // Obtener una conexión del pool
        connection = await oracledb.getConnection();
        // Usar la conexión dual de Oracle para una prueba rápida
        const result = await connection.execute('SELECT 1 + 1 AS solution FROM DUAL');
        res.json({
            message: 'Conexión a la BD exitosa',
            data: result.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al conectar con la base de datos.', error: err.message });
    } finally {
        if (connection) {
            try {
                // Liberar la conexión de vuelta al pool
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
});