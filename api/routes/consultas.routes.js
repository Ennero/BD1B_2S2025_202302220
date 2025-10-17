// api/routes/consultas.routes.js

const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');

// Asegurarnos que la salida sea en formato de objeto JSON
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;


// ===================================================================
// ENDPOINT PARA LA CONSULTA 1: Estadísticas de Evaluaciones
// ===================================================================
router.get('/estadisticas-evaluaciones', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const sql = `
            SELECT
                c.NOMBRE AS "Centro de Evaluación",
                e.NOMBRE AS "Escuela de Manejo",
                COUNT(ex.ID_EXAMEN) AS "Total de Exámenes",
                ROUND(AVG(
                    (SELECT (COUNT(CASE WHEN ru.RES = p.RES THEN 1 END) * 100.0) / COUNT(ru.ID_RES_USU)
                     FROM RES_USU ru
                     JOIN PREG p ON ru.PREG_ID_PREG = p.ID_PREG
                     WHERE ru.EXAMEN_ID_EXAMEN = ex.ID_EXAMEN)
                ), 2) AS "Promedio Teórico",
                ROUND(AVG(
                    (SELECT SUM(NOTA)
                     FROM RES_PRACT_USU rpu
                     WHERE rpu.EXAMEN_ID_EXAMEN = ex.ID_EXAMEN)
                ), 2) AS "Promedio Práctico",
                SUM(CASE
                    WHEN
                        (SELECT (COUNT(CASE WHEN ru.RES = p.RES THEN 1 END) * 100.0) / COUNT(ru.ID_RES_USU)
                         FROM RES_USU ru
                         JOIN PREG p ON ru.PREG_ID_PREG = p.ID_PREG
                         WHERE ru.EXAMEN_ID_EXAMEN = ex.ID_EXAMEN) >= 70
                        AND
                        (SELECT SUM(NOTA)
                         FROM RES_PRACT_USU rpu
                         WHERE rpu.EXAMEN_ID_EXAMEN = ex.ID_EXAMEN) >= 70
                    THEN 1 ELSE 0
                END) AS "Total Aprobados"
            FROM
                EXAMEN ex
            JOIN REGISTRO r ON ex.REGISTRO_ID_REGISTRO = r.ID_REGISTRO
            JOIN UBICACION u ON r.UBICACION_ESCUELA_ID = u.ESCUELA_ID_ESCUELA AND r.UBICACION_CENTRO_ID = u.CENTRO_ID_CENTRO
            JOIN CENTRO c ON u.CENTRO_ID_CENTRO = c.ID_CENTRO
            JOIN ESCUELA e ON u.ESCUELA_ID_ESCUELA = e.ID_ESCUELA
            GROUP BY
                c.NOMBRE, e.NOMBRE
            ORDER BY
                "Centro de Evaluación", "Escuela de Manejo"
        `;

        const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.status(200).json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al ejecutar la consulta 1.', error: err.message });
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


// ===================================================================
// ENDPOINT PARA LA CONSULTA 2: Listado de Evaluados por Resultado
// ===================================================================
router.get('/listado-evaluados', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const sql = `
            SELECT
                r.NOMBRE_COMPLETO,
                r.TIPO_LICENCIA,
                r.GENERO,
                r.FECHA AS "Fecha de Evaluación",
                c.NOMBRE || ' / ' || e.NOMBRE AS "Ubicación",
                ROUND(
                    (SELECT (COUNT(CASE WHEN ru.RES = p.RES THEN 1 END) * 100.0) / COUNT(ru.ID_RES_USU)
                     FROM RES_USU ru
                     JOIN PREG p ON ru.PREG_ID_PREG = p.ID_PREG
                     WHERE ru.EXAMEN_ID_EXAMEN = ex.ID_EXAMEN)
                , 2) AS "Punteo Teórico",
                ROUND(
                    (SELECT NVL(SUM(NOTA), 0)
                     FROM RES_PRACT_USU rpu
                     WHERE rpu.EXAMEN_ID_EXAMEN = ex.ID_EXAMEN)
                , 2) AS "Punteo Práctico",
                ROUND(
                    (SELECT (COUNT(CASE WHEN ru.RES = p.RES THEN 1 END) * 100.0) / COUNT(ru.ID_RES_USU)
                     FROM RES_USU ru
                     JOIN PREG p ON ru.PREG_ID_PREG = p.ID_PREG
                     WHERE ru.EXAMEN_ID_EXAMEN = ex.ID_EXAMEN)
                    +
                    (SELECT NVL(SUM(NOTA), 0)
                     FROM RES_PRACT_USU rpu
                     WHERE rpu.EXAMEN_ID_EXAMEN = ex.ID_EXAMEN)
                , 2) AS "Punteo Total",
                CASE
                    WHEN
                        (SELECT (COUNT(CASE WHEN ru.RES = p.RES THEN 1 END) * 100.0) / COUNT(ru.ID_RES_USU)
                         FROM RES_USU ru
                         JOIN PREG p ON ru.PREG_ID_PREG = p.ID_PREG
                         WHERE ru.EXAMEN_ID_EXAMEN = ex.ID_EXAMEN) >= 70
                        AND
                        (SELECT NVL(SUM(NOTA), 0)
                         FROM RES_PRACT_USU rpu
                         WHERE rpu.EXAMEN_ID_EXAMEN = ex.ID_EXAMEN) >= 70
                    THEN 'Aprobado'
                    ELSE 'Reprobado'
                END AS "Resultado"
            FROM
                REGISTRO r
            JOIN EXAMEN ex ON r.ID_REGISTRO = ex.REGISTRO_ID_REGISTRO
            JOIN UBICACION u ON r.UBICACION_ESCUELA_ID = u.ESCUELA_ID_ESCUELA AND r.UBICACION_CENTRO_ID = u.CENTRO_ID_CENTRO
            JOIN CENTRO c ON u.CENTRO_ID_CENTRO = c.ID_CENTRO
            JOIN ESCUELA e ON u.ESCUELA_ID_ESCUELA = e.ID_ESCUELA
            ORDER BY
                "Resultado" ASC,
                "Punteo Total" DESC,
                "Fecha de Evaluación" DESC
        `;
        const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al ejecutar la consulta 2.', error: err.message });
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


// ===================================================================
// ENDPOINT PARA LA CONSULTA 3: Pregunta Teórica Más Difícil
// ===================================================================
router.get('/pregunta-mas-dificil', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const sql = `
            SELECT
                p.ID_PREG,
                p.PREG_TEXTO,
                p.RES AS "Respuesta Correcta",
                ps.VECES_CONTESTADA,
                ps.VECES_CORRECTA,
                ROUND((ps.VECES_CORRECTA * 100.0) / ps.VECES_CONTESTADA, 2) AS "Porcentaje de Aciertos",
                CASE
                    WHEN (ps.VECES_CORRECTA * 100.0) / ps.VECES_CONTESTADA < 50 THEN 'Revisión Urgente'
                    WHEN (ps.VECES_CORRECTA * 100.0) / ps.VECES_CONTESTADA < 75 THEN 'Revisar'
                    ELSE 'Aceptable'
                END AS "Recomendación"
            FROM
                PREG p
            JOIN
                (
                    SELECT
                        p_inner.ID_PREG,
                        COUNT(ru.ID_RES_USU) AS VECES_CONTESTADA,
                        COUNT(CASE WHEN ru.RES = p_inner.RES THEN 1 END) AS VECES_CORRECTA
                    FROM
                        PREG p_inner
                    LEFT JOIN
                        RES_USU ru ON p_inner.ID_PREG = ru.PREG_ID_PREG
                    GROUP BY
                        p_inner.ID_PREG
                    HAVING
                        COUNT(ru.ID_RES_USU) > 0
                ) ps ON p.ID_PREG = ps.ID_PREG
            ORDER BY
                "Porcentaje de Aciertos" ASC
            FETCH FIRST 1 ROW ONLY
        `;
        const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        // Como solo esperamos una fila, devolvemos el objeto directamente.
        res.status(200).json(result.rows[0] || {});
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al ejecutar la consulta 3.', error: err.message });
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

module.exports = router;
