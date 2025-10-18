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
                
                -- Subconsulta para el promedio teórico
                ROUND(AVG(
                    (SELECT
                        CASE
                            WHEN COUNT(ru.ID_RES_USU) = 0 THEN 0 -- Si no hay respuestas, la nota es 0
                            ELSE (COUNT(CASE WHEN ru.RES = p.RES THEN 1 END) * 100.0) / COUNT(ru.ID_RES_USU)
                        END
                     FROM RES_USU ru
                     JOIN PREG p ON ru.PREG_ID_PREG = p.ID_PREG
                     WHERE ru.EXAMEN_ID_EXAMEN = ex.ID_EXAMEN)
                ), 2) AS "Promedio Teórico",
                
                -- Subconsulta para el promedio práctico (Mejorada con NVL)
                ROUND(AVG(
                    (SELECT NVL(SUM(NOTA), 0) -- Si no hay notas, el total es 0
                     FROM RES_PRACT_USU rpu
                     WHERE rpu.EXAMEN_ID_EXAMEN = ex.ID_EXAMEN)
                ), 2) AS "Promedio Práctico",
                
                -- Subconsulta para contar los aprobados
                SUM(CASE
                    WHEN
                        (SELECT
                            CASE
                                WHEN COUNT(ru.ID_RES_USU) = 0 THEN 0 -- Si no hay respuestas, la nota es 0
                                ELSE (COUNT(CASE WHEN ru.RES = p.RES THEN 1 END) * 100.0) / COUNT(ru.ID_RES_USU)
                            END
                         FROM RES_USU ru
                         JOIN PREG p ON ru.PREG_ID_PREG = p.ID_PREG
                         WHERE ru.EXAMEN_ID_EXAMEN = ex.ID_EXAMEN) >= 70
                        AND
                        (SELECT NVL(SUM(NOTA), 0) -- Si no hay notas, el total es 0
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
                
                -- Subconsulta para Punteo Teórico
                ROUND(
                    (SELECT
                        CASE
                            WHEN COUNT(ru.ID_RES_USU) = 0 THEN 0
                            ELSE (COUNT(CASE WHEN ru.RES = p.RES THEN 1 END) * 100.0) / COUNT(ru.ID_RES_USU)
                        END
                     FROM RES_USU ru
                     JOIN PREG p ON ru.PREG_ID_PREG = p.ID_PREG
                     WHERE ru.EXAMEN_ID_EXAMEN = ex.ID_EXAMEN)
                , 2) AS "Punteo Teórico",
                
                -- Subconsulta para Punteo Práctico 
                ROUND(
                    (SELECT NVL(SUM(NOTA), 0)
                     FROM RES_PRACT_USU rpu
                     WHERE rpu.EXAMEN_ID_EXAMEN = ex.ID_EXAMEN)
                , 2) AS "Punteo Práctico",
                
                -- Suma de las dos subconsultas para Punteo Total 
                ROUND(
                    (SELECT
                        CASE
                            WHEN COUNT(ru.ID_RES_USU) = 0 THEN 0
                            ELSE (COUNT(CASE WHEN ru.RES = p.RES THEN 1 END) * 100.0) / COUNT(ru.ID_RES_USU)
                        END
                     FROM RES_USU ru
                     JOIN PREG p ON ru.PREG_ID_PREG = p.ID_PREG
                     WHERE ru.EXAMEN_ID_EXAMEN = ex.ID_EXAMEN)
                    +
                    (SELECT NVL(SUM(NOTA), 0)
                     FROM RES_PRACT_USU rpu
                     WHERE rpu.EXAMEN_ID_EXAMEN = ex.ID_EXAMEN)
                , 2) AS "Punteo Total",
                
                -- Lógica de Resultado (CORREGIDA)
                CASE
                    WHEN
                        (SELECT
                            CASE
                                WHEN COUNT(ru.ID_RES_USU) = 0 THEN 0
                                ELSE (COUNT(CASE WHEN ru.RES = p.RES THEN 1 END) * 100.0) / COUNT(ru.ID_RES_USU)
                            END
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
                "Fecha de Evaluación"
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
                    p.RES AS "Respuesta Correcta (Texto)",
                    
                    CASE 
                        WHEN p.RES1 = p.RES THEN p.RES1 || ' (Correcta)'
                        ELSE p.RES1
                    END AS "Opción A",
                    CASE 
                        WHEN p.RES2 = p.RES THEN p.RES2 || ' (Correcta)'
                        ELSE p.RES2
                    END AS "Opción B",
                    CASE 
                        WHEN p.RES3 = p.RES THEN p.RES3 || ' (Correcta)'
                        ELSE p.RES3
                    END AS "Opción C",
                    CASE 
                        WHEN p.RES4 = p.RES THEN p.RES4 || ' (Correcta)'
                        ELSE p.RES4
                    END AS "Opción D",
                    -- ------------------------------
                    
                    (SELECT COUNT(*) FROM RES_USU ru WHERE ru.PREG_ID_PREG = p.ID_PREG AND ru.RES = p.RES1) AS "Veces Opción A",
                    (SELECT COUNT(*) FROM RES_USU ru WHERE ru.PREG_ID_PREG = p.ID_PREG AND ru.RES = p.RES2) AS "Veces Opción B",
                    (SELECT COUNT(*) FROM RES_USU ru WHERE ru.PREG_ID_PREG = p.ID_PREG AND ru.RES = p.RES3) AS "Veces Opción C",
                    (SELECT COUNT(*) FROM RES_USU ru WHERE ru.PREG_ID_PREG = p.ID_PREG AND ru.RES = p.RES4) AS "Veces Opción D",
                    -- ------------------------------

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