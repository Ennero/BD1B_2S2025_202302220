const { Router } = require('express');
const oracledb = require('oracledb');
const router = Router();

// Asegurarnos que la salida sea en formato de objeto JSON
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// GET (Traer todos los departamentos)
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute('SELECT * FROM DEPARTAMENTO ORDER BY ID_DEPARTAMENTO');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener los departamentos' });
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

// GET (Traer un departamento por su ID)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT * FROM DEPARTAMENTO WHERE ID_DEPARTAMENTO = :id`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Departamento no encontrado' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener el departamento' });
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

// POST (Crear un nuevo departamento)
router.post('/', async (req, res) => {
    const { id_departamento, nombre, codigo } = req.body;
    if (!id_departamento || !nombre || codigo === undefined) {
        return res.status(400).json({ message: 'ID_DEPARTAMENTO, NOMBRE y CODIGO son requeridos.' });
    }
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `INSERT INTO DEPARTAMENTO (ID_DEPARTAMENTO, NOMBRE, CODIGO) VALUES (:id_departamento, :nombre, :codigo)`,
            { id_departamento, nombre, codigo },
            { autoCommit: true }
        );
        res.status(201).json({ message: 'Departamento creado exitosamente', data: { id_departamento, nombre, codigo } });
    } catch (err) {
        console.error(err);
        if (err.errorNum === 1) {
            return res.status(409).json({ message: 'Error: El ID del departamento ya existe.' });
        }
        res.status(500).json({ message: 'Error al crear el departamento' });
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

// PUT (Actualizar un departamento por su ID)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, codigo } = req.body;

    if (!nombre || codigo === undefined) {
        return res.status(400).json({ message: 'Los campos NOMBRE y CODIGO son requeridos.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `UPDATE DEPARTAMENTO SET NOMBRE = :nombre, CODIGO = :codigo WHERE ID_DEPARTAMENTO = :id`,
            { nombre, codigo, id },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Departamento no encontrado para actualizar.' });
        }
        res.status(200).json({ message: 'Departamento actualizado exitosamente.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al actualizar el departamento.' });
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

// DELETE (Eliminar un departamento por su ID)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `DELETE FROM DEPARTAMENTO WHERE ID_DEPARTAMENTO = :id`,
            [id],
            { autoCommit: true }
        );
        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Departamento no encontrado para eliminar.' });
        }
        res.status(200).json({ message: 'Departamento eliminado exitosamente.' });
    } catch (err) {
        console.error(err);
        if (err.errorNum === 2292) {
            return res.status(409).json({ message: 'Error: No se puede eliminar el departamento porque está siendo utilizado en otra tabla (Municipio).' });
        }
        res.status(500).json({ message: 'Error al eliminar el departamento.' });
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
