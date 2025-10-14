const { Router } = require('express');
const oracledb = require('oracledb');
const router = Router();

// Asegurarnos que la salida sea en formato de objeto JSON
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// GET (Traer todas las escuelas)
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute('SELECT * FROM ESCUELA ORDER BY ID_ESCUELA');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener las escuelas' });
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

// GET (Traer una escuela por su ID)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT * FROM ESCUELA WHERE ID_ESCUELA = :id`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Escuela no encontrada' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener la escuela' });
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

// POST (Crear una nueva escuela)
router.post('/', async (req, res) => {
    const { id_escuela, nombre, direccion, acuerdo } = req.body;
    if (!id_escuela || !nombre || !direccion || !acuerdo) {
        return res.status(400).json({ message: 'ID_ESCUELA, NOMBRE, DIRECCION y ACUERDO son requeridos.' });
    }
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `INSERT INTO ESCUELA (ID_ESCUELA, NOMBRE, DIRECCION, ACUERDO) VALUES (:id_escuela, :nombre, :direccion, :acuerdo)`,
            { id_escuela, nombre, direccion, acuerdo },
            { autoCommit: true }
        );
        res.status(201).json({ message: 'Escuela creada exitosamente', data: { id_escuela, nombre, direccion, acuerdo } });
    } catch (err) {
        console.error(err);
        if (err.errorNum === 1) {
            return res.status(409).json({ message: 'Error: El ID de la escuela ya existe.' });
        }
        res.status(500).json({ message: 'Error al crear la escuela' });
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

// PUT (Actualizar una escuela por su ID)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, direccion, acuerdo } = req.body;

    if (!nombre || !direccion || !acuerdo) {
        return res.status(400).json({ message: 'Los campos NOMBRE, DIRECCION y ACUERDO son requeridos.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `UPDATE ESCUELA SET NOMBRE = :nombre, DIRECCION = :direccion, ACUERDO = :acuerdo WHERE ID_ESCUELA = :id`,
            { nombre, direccion, acuerdo, id },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Escuela no encontrada para actualizar.' });
        }
        res.status(200).json({ message: 'Escuela actualizada exitosamente.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al actualizar la escuela.' });
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

// DELETE (Eliminar una escuela por su ID)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `DELETE FROM ESCUELA WHERE ID_ESCUELA = :id`,
            [id],
            { autoCommit: true }
        );
        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Escuela no encontrada para eliminar.' });
        }
        res.status(200).json({ message: 'Escuela eliminada exitosamente.' });
    } catch (err) {
        console.error(err);
        if (err.errorNum === 2292) {
            return res.status(409).json({ message: 'Error: No se puede eliminar la escuela porque está siendo utilizada en otra tabla (Ubicacion).' });
        }
        res.status(500).json({ message: 'Error al eliminar la escuela.' });
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
