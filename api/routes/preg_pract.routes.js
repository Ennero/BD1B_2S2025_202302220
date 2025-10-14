const { Router } = require('express');
const oracledb = require('oracledb');
const router = Router();

// Asegurarnos que la salida sea en formato de objeto JSON
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// GET (Traer todas las preguntas prácticas)
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute('SELECT * FROM PREG_PRACT ORDER BY ID_PREG_PRACT');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener las preguntas prácticas' });
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

// GET (Traer una pregunta práctica por su ID)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT * FROM PREG_PRACT WHERE ID_PREG_PRACT = :id`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Pregunta práctica no encontrada' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener la pregunta práctica' });
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

// POST (Crear una nueva pregunta práctica)
router.post('/', async (req, res) => {
    const { id_preg_pract, preg_texto, punteo } = req.body;

    if (!id_preg_pract || !preg_texto || punteo === undefined) {
        return res.status(400).json({ message: 'ID_PREG_PRACT, PREG_TEXTO y PUNTEO son requeridos.' });
    }

    const newPregPract = { id_preg_pract, preg_texto, punteo };

    let connection;
    try {
        connection = await oracledb.getConnection();
        await connection.execute(
            `INSERT INTO PREG_PRACT (ID_PREG_PRACT, PREG_TEXTO, PUNTEO) 
       VALUES (:id_preg_pract, :preg_texto, :punteo)`,
            newPregPract,
            { autoCommit: true }
        );
        res.status(201).json({ message: 'Pregunta práctica creada exitosamente', data: newPregPract });
    } catch (err) {
        console.error(err);
        if (err.errorNum === 1) {
            return res.status(409).json({ message: 'Error: El ID de la pregunta práctica ya existe.' });
        }
        res.status(500).json({ message: 'Error al crear la pregunta práctica' });
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

// PUT (Actualizar una pregunta práctica por su ID)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { preg_texto, punteo } = req.body;

    if (!preg_texto || punteo === undefined) {
        return res.status(400).json({ message: 'Los campos PREG_TEXTO y PUNTEO son requeridos.' });
    }

    const updatedPregPract = { id, preg_texto, punteo };

    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `UPDATE PREG_PRACT 
             SET PREG_TEXTO = :preg_texto, PUNTEO = :punteo
             WHERE ID_PREG_PRACT = :id`,
            updatedPregPract,
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Pregunta práctica no encontrada para actualizar.' });
        }
        res.status(200).json({ message: 'Pregunta práctica actualizada exitosamente.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al actualizar la pregunta práctica.' });
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

// DELETE (Eliminar una pregunta práctica por su ID)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `DELETE FROM PREG_PRACT WHERE ID_PREG_PRACT = :id`,
            [id],
            { autoCommit: true }
        );
        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Pregunta práctica no encontrada para eliminar.' });
        }
        res.status(200).json({ message: 'Pregunta práctica eliminada exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al eliminar la pregunta práctica.' });
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
