const { Router } = require('express');
const oracledb = require('oracledb');
const router = Router();

// Asegurarnos que la salida sea en formato de objeto JSON
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// GET (Traer todos los centros)
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute('SELECT * FROM CENTRO ORDER BY ID_CENTRO');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener los centros' });
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

// GET (Traer un centro por su ID)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT * FROM CENTRO WHERE ID_CENTRO = :id`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Centro no encontrado' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener el centro' });
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

// POST (Crear un nuevo centro)
router.post('/', async (req, res) => {
    const { id_centro, nombre } = req.body;
    if (!id_centro || !nombre) {
        return res.status(400).json({ message: 'ID_CENTRO y NOMBRE son requeridos.' });
    }
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `INSERT INTO CENTRO (ID_CENTRO, NOMBRE) VALUES (:id_centro, :nombre)`,
            { id_centro, nombre },
            { autoCommit: true }
        );
        res.status(201).json({ message: 'Centro creado exitosamente', data: { id_centro, nombre } });
    } catch (err) {
        console.error(err);
        if (err.errorNum === 1) {
            return res.status(409).json({ message: 'Error: El ID del centro ya existe.' });
        }
        res.status(500).json({ message: 'Error al crear el centro' });
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

// PUT (Actualizar un centro por su ID)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;

    if (!nombre) {
        return res.status(400).json({ message: 'El campo NOMBRE es requerido.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `UPDATE CENTRO SET NOMBRE = :nombre WHERE ID_CENTRO = :id`,
            { nombre, id },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Centro no encontrado para actualizar.' });
        }
        res.status(200).json({ message: 'Centro actualizado exitosamente.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al actualizar el centro.' });
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

// DELETE (Eliminar un centro por su ID)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `DELETE FROM CENTRO WHERE ID_CENTRO = :id`,
            [id],
            { autoCommit: true }
        );
        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Centro no encontrado para eliminar.' });
        }
        res.status(200).json({ message: 'Centro eliminado exitosamente.' });
    } catch (err) {
        console.error(err);
        // Manejar error de llave foránea (si un centro está en uso)
        if (err.errorNum === 2292) {
            return res.status(409).json({ message: 'Error: No se puede eliminar el centro porque está siendo utilizado en otra tabla.' });
        }
        res.status(500).json({ message: 'Error al eliminar el centro.' });
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
