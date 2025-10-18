const { Router } = require('express');
const oracledb = require('oracledb');
const router = Router();

// Asegurar que la salida sea en formato de objeto JSON
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// --- Funciones Auxiliares de Validación ---
async function checkPregPractExists(connection, pregPractId) {
    const result = await connection.execute(
        `SELECT ID_PREG_PRACT FROM PREG_PRACT WHERE ID_PREG_PRACT = :id`,
        [pregPractId]
    );
    return result.rows.length > 0;
}

async function checkExamenExists(connection, examenId) {
    const result = await connection.execute(
        `SELECT ID_EXAMEN FROM EXAMEN WHERE ID_EXAMEN = :id`,
        [examenId]
    );
    return result.rows.length > 0;
}


// GET (Obtener todas las respuestas prácticas)
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute('SELECT * FROM RES_PRACT_USU ORDER BY ID_RES_PRACT');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener las respuestas prácticas' });
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

// GET (Obtener una respuesta práctica por su ID)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT * FROM RES_PRACT_USU WHERE ID_RES_PRACT = :id`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Respuesta práctica no encontrada' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener la respuesta práctica' });
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


// POST (Crear una nueva respuesta práctica)
router.post('/', async (req, res) => {
    const { id_res_pract, nota, preg_pract_id_preg_pract, examen_id_examen } = req.body;

    if (id_res_pract === undefined || nota === undefined || !preg_pract_id_preg_pract || !examen_id_examen) {
        return res.status(400).json({ message: 'Todos los campos son requeridos: id_res_pract, nota, preg_pract_id_preg_pract, examen_id_examen.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();

        //  VALIDACIÓN DE LLAVES FORÁNEAS
        const [preguntaExiste, examenExiste] = await Promise.all([
            checkPregPractExists(connection, preg_pract_id_preg_pract),
            checkExamenExists(connection, examen_id_examen)
        ]);

        if (!preguntaExiste) {
            return res.status(404).json({ message: `La pregunta práctica con ID ${preg_pract_id_preg_pract} no existe.` });
        }
        if (!examenExiste) {
            return res.status(404).json({ message: `El examen con ID ${examen_id_examen} no existe.` });
        }

        const newRespuesta = { id_res_pract, nota, preg_pract_id_preg_pract, examen_id_examen };

        await connection.execute(
            `INSERT INTO RES_PRACT_USU (ID_RES_PRACT, NOTA, PREG_PRACT_ID_PREG_PRACT, EXAMEN_ID_EXAMEN) 
       VALUES (:id_res_pract, :nota, :preg_pract_id_preg_pract, :examen_id_examen)`,
            newRespuesta,
            { autoCommit: true }
        );
        res.status(201).json({ message: 'Respuesta práctica creada exitosamente', data: newRespuesta });
    } catch (err) {
        console.error(err);
        if (err.errorNum === 1) {
            return res.status(409).json({ message: 'Error: El ID de la respuesta práctica ya existe.' });
        }
        res.status(500).json({ message: 'Error al crear la respuesta práctica' });
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

// PUT (Actualizar una respuesta práctica por su ID)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nota, preg_pract_id_preg_pract, examen_id_examen } = req.body;

    if (nota === undefined || !preg_pract_id_preg_pract || !examen_id_examen) {
        return res.status(400).json({ message: 'Los campos nota, preg_pract_id_preg_pract y examen_id_examen son requeridos.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();

        // VALIDACIÓN DE LLAVES FORÁNEAS
        const [preguntaExiste, examenExiste] = await Promise.all([
            checkPregPractExists(connection, preg_pract_id_preg_pract),
            checkExamenExists(connection, examen_id_examen)
        ]);

        if (!preguntaExiste) {
            return res.status(404).json({ message: `La pregunta práctica con ID ${preg_pract_id_preg_pract} no existe.` });
        }
        if (!examenExiste) {
            return res.status(404).json({ message: `El examen con ID ${examen_id_examen} no existe.` });
        }

        const updatedRespuesta = { id, nota, preg_pract_id_preg_pract, examen_id_examen };
        const result = await connection.execute(
            `UPDATE RES_PRACT_USU 
             SET NOTA = :nota, PREG_PRACT_ID_PREG_PRACT = :preg_pract_id_preg_pract, EXAMEN_ID_EXAMEN = :examen_id_examen
             WHERE ID_RES_PRACT = :id`,
            updatedRespuesta,
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Respuesta práctica no encontrada para actualizar.' });
        }
        res.status(200).json({ message: 'Respuesta práctica actualizada exitosamente.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al actualizar la respuesta práctica.' });
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

// DELETE (Eliminar una respuesta práctica por su ID)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `DELETE FROM RES_PRACT_USU WHERE ID_RES_PRACT = :id`,
            [id],
            { autoCommit: true }
        );
        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Respuesta práctica no encontrada para eliminar.' });
        }
        res.status(200).json({ message: 'Respuesta práctica eliminada exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al eliminar la respuesta práctica.' });
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
