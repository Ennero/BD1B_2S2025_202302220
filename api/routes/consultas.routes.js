// api/routes/consultas.routes.js

const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');

// Endpoint para la CONSULTA 1
// GET /api/consultas/estadisticas-evaluaciones
router.get('/estadisticas-evaluaciones', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const sql = `
            SELECT
                c.NOMBRE AS "Centro",
                e.NOMBRE AS "Escuela",
                COUNT(ex.ID_EXAMEN) AS "Total de exámenes",
                -- Lógica para el promedio teórico (4 pts por respuesta correcta)
                -- Esta es una aproximación, necesitarás ajustarla a tu lógica exacta
                AVG((SELECT COUNT(*) FROM RES_USU ru WHERE ru.EXAMEN_ID_EXAMEN = ex.ID_EXAMEN AND ru.RES = (SELECT p.RES FROM PREG p WHERE p.ID_PREG = ru.PREG_ID_PREG)) * 4) AS "Promedio teórico",
                -- Lógica para el promedio práctico
                AVG((SELECT SUM(rpu.NOTA) FROM RES_PRACT_USU rpu WHERE rpu.EXAMEN_ID_EXAMEN = ex.ID_EXAMEN)) AS "Promedio práctico",
                -- Lógica para el total de aprobados (ambos punteos >= 70)
                SUM(CASE WHEN
                    (SELECT COUNT(*) FROM RES_USU ru WHERE ru.EXAMEN_ID_EXAMEN = ex.ID_EXAMEN AND ru.RES = (SELECT p.RES FROM PREG p WHERE p.ID_PREG = ru.PREG_ID_PREG)) * 4 >= 70
                    AND
                    (SELECT SUM(rpu.NOTA) FROM RES_PRACT_USU rpu WHERE rpu.EXAMEN_ID_EXAMEN = ex.ID_EXAMEN) >= 70
                    THEN 1 ELSE 0 END
                ) AS "Total aprobados"
            FROM EXAMEN ex
            JOIN REGISTRO r ON ex.REGISTRO_ID_REGISTRO = r.ID_REGISTRO
            JOIN UBICACION u ON r.UBICACION_ESCUELA_ID = u.ESCUELA_ID_ESCUELA AND r.UBICACION_CENTRO_ID = u.CENTRO_ID_CENTRO
            JOIN CENTRO c ON u.CENTRO_ID_CENTRO = c.ID_CENTRO
            JOIN ESCUELA e ON u.ESCUELA_ID_ESCUELA = e.ID_ESCUELA
            GROUP BY c.NOMBRE, e.NOMBRE
            ORDER BY c.NOMBRE, e.NOMBRE
        `;

        const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al ejecutar la consulta.', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});


// Aquí añadirías los otros endpoints para la CONSULTA 2 y 3...


module.exports = router;