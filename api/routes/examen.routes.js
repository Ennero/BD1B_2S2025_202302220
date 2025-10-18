const { Router } = require('express');
const oracledb = require('oracledb');
const router = Router();

// Asegurar que la salida sea en formato de objeto JSON
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// --- Funciones Auxiliares de Validación ---
async function checkRegistroExists(connection, registroId) {
    const result = await connection.execute(
        `SELECT ID_REGISTRO FROM REGISTRO WHERE ID_REGISTRO = :id`,
        [registroId]
    );
    return result.rows.length > 0;
}

async function checkCorrelativoExists(connection, correlativoId) {
    const result = await connection.execute(
        `SELECT ID_CORRELATIVO FROM CORRELATIVO WHERE ID_CORRELATIVO = :id`,
        [correlativoId]
    );
    return result.rows.length > 0;
}


// GET (Obtener todos los exámenes)
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute('SELECT * FROM EXAMEN ORDER BY ID_EXAMEN');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener los exámenes' });
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

// GET (Obtener un examen por su ID)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT * FROM EXAMEN WHERE ID_EXAMEN = :id`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Examen no encontrado' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener el examen' });
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


// POST (Crear un nuevo examen)
router.post('/', async (req, res) => {
    const { id_examen, registro_id_registro, correlativo_id_correlativo } = req.body;

    if (!id_examen || !registro_id_registro || !correlativo_id_correlativo) {
        return res.status(400).json({ message: 'Todos los campos son requeridos: id_examen, registro_id_registro, correlativo_id_correlativo.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();

        // VALIDACIÓN DE LLAVES FORÁNEAS
        const [registroExiste, correlativoExiste] = await Promise.all([
            checkRegistroExists(connection, registro_id_registro),
            checkCorrelativoExists(connection, correlativo_id_correlativo)
        ]);

        if (!registroExiste) {
            return res.status(404).json({ message: `El registro con ID ${registro_id_registro} no existe.` });
        }
        if (!correlativoExiste) {
            return res.status(404).json({ message: `El correlativo con ID ${correlativo_id_correlativo} no existe.` });
        }

        const newExamen = { id_examen, registro_id_registro, correlativo_id_correlativo };

        await connection.execute(
            `INSERT INTO EXAMEN (ID_EXAMEN, REGISTRO_ID_REGISTRO, CORRELATIVO_ID_CORRELATIVO) 
       VALUES (:id_examen, :registro_id_registro, :correlativo_id_correlativo)`,
            newExamen,
            { autoCommit: true }
        );
        res.status(201).json({ message: 'Examen creado exitosamente', data: newExamen });
    } catch (err) {
        console.error(err);
        if (err.errorNum === 1) {
            return res.status(409).json({ message: 'Error: El ID del examen ya existe.' });
        }
        res.status(500).json({ message: 'Error al crear el examen' });
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

// PUT (Actualizar un examen por su ID)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { registro_id_registro, correlativo_id_correlativo } = req.body;

    if (!registro_id_registro || !correlativo_id_correlativo) {
        return res.status(400).json({ message: 'Los campos registro_id_registro y correlativo_id_correlativo son requeridos.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();

        // VALIDACIÓN DE LLAVES FORÁNEAS 
        const [registroExiste, correlativoExiste] = await Promise.all([
            checkRegistroExists(connection, registro_id_registro),
            checkCorrelativoExists(connection, correlativo_id_correlativo)
        ]);

        if (!registroExiste) {
            return res.status(404).json({ message: `El registro con ID ${registro_id_registro} no existe.` });
        }
        if (!correlativoExiste) {
            return res.status(404).json({ message: `El correlativo con ID ${correlativo_id_correlativo} no existe.` });
        }

        const updatedExamen = { id, registro_id_registro, correlativo_id_correlativo };
        const result = await connection.execute(
            `UPDATE EXAMEN 
             SET REGISTRO_ID_REGISTRO = :registro_id_registro, CORRELATIVO_ID_CORRELATIVO = :correlativo_id_correlativo
             WHERE ID_EXAMEN = :id`,
            updatedExamen,
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Examen no encontrado para actualizar.' });
        }
        res.status(200).json({ message: 'Examen actualizado exitosamente.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al actualizar el examen.' });
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

// DELETE (Eliminar un examen por su ID)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `DELETE FROM EXAMEN WHERE ID_EXAMEN = :id`,
            [id],
            { autoCommit: true }
        );
        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Examen no encontrado para eliminar.' });
        }
        res.status(200).json({ message: 'Examen eliminado exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al eliminar el examen.' });
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
