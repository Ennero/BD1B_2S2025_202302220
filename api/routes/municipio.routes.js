const { Router } = require('express');
const oracledb = require('oracledb');
const router = Router();

// Asegurarnos que la salida sea en formato de objeto JSON
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// Función auxiliar para verificar la existencia de un Departamento
async function checkDepartamentoExists(connection, departamentoId) {
    const result = await connection.execute(
        `SELECT ID_DEPARTAMENTO FROM DEPARTAMENTO WHERE ID_DEPARTAMENTO = :id`,
        [departamentoId]
    );
    return result.rows.length > 0;
}

// GET (Traer todos los municipios)
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute('SELECT * FROM MUNICIPIO ORDER BY ID_MUNICIPIO');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener los municipios' });
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

// GET (Traer un municipio por su ID)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT * FROM MUNICIPIO WHERE ID_MUNICIPIO = :id`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Municipio no encontrado' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener el municipio' });
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

// POST (Crear un nuevo municipio)
router.post('/', async (req, res) => {
    const { id_municipio, nombre, codigo, departamento_id_departamento } = req.body;

    if (!id_municipio || !nombre || codigo === undefined || !departamento_id_departamento) {
        return res.status(400).json({ message: 'Todos los campos son requeridos: id_municipio, nombre, codigo, departamento_id_departamento.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();

        // VALIDACIÓN DE LLAVE FORÁNEA 
        const departamentoExiste = await checkDepartamentoExists(connection, departamento_id_departamento);
        if (!departamentoExiste) {
            return res.status(404).json({ message: `El departamento con ID ${departamento_id_departamento} no existe.` });
        }

        const newMunicipio = { id_municipio, nombre, codigo, departamento_id_departamento };
        await connection.execute(
            `INSERT INTO MUNICIPIO (ID_MUNICIPIO, NOMBRE, CODIGO, DEPARTAMENTO_ID_DEPARTAMENTO) 
       VALUES (:id_municipio, :nombre, :codigo, :departamento_id_departamento)`,
            newMunicipio,
            { autoCommit: true }
        );
        res.status(201).json({ message: 'Municipio creado exitosamente', data: newMunicipio });
    } catch (err) {
        console.error(err);
        if (err.errorNum === 1) {
            return res.status(409).json({ message: 'Error: El ID del municipio ya existe.' });
        }
        res.status(500).json({ message: 'Error al crear el municipio' });
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

// PUT (Actualizar un municipio por su ID)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, codigo, departamento_id_departamento } = req.body;

    if (!nombre || codigo === undefined || !departamento_id_departamento) {
        return res.status(400).json({ message: 'Los campos nombre, codigo y departamento_id_departamento son requeridos.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();

        // VALIDACIÓN DE LLAVE FORÁNEA
        const departamentoExiste = await checkDepartamentoExists(connection, departamento_id_departamento);
        if (!departamentoExiste) {
            return res.status(404).json({ message: `El departamento con ID ${departamento_id_departamento} no existe.` });
        }

        const updatedMunicipio = { id, nombre, codigo, departamento_id_departamento };
        const result = await connection.execute(
            `UPDATE MUNICIPIO 
             SET NOMBRE = :nombre, CODIGO = :codigo, DEPARTAMENTO_ID_DEPARTAMENTO = :departamento_id_departamento
             WHERE ID_MUNICIPIO = :id`,
            updatedMunicipio,
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Municipio no encontrado para actualizar.' });
        }
        res.status(200).json({ message: 'Municipio actualizado exitosamente.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al actualizar el municipio.' });
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

// DELETE (Eliminar un municipio por su ID)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `DELETE FROM MUNICIPIO WHERE ID_MUNICIPIO = :id`,
            [id],
            { autoCommit: true }
        );
        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Municipio no encontrado para eliminar.' });
        }
        res.status(200).json({ message: 'Municipio eliminado exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al eliminar el municipio.' });
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
