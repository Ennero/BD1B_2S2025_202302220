const { Router } = require('express');
const oracledb = require('oracledb');
const router = Router();

// Ensure output is in JSON object format
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// --- Validation Helper Functions ---
async function checkMunicipioExists(connection, municipioId) {
    const result = await connection.execute(
        `SELECT ID_MUNICIPIO FROM MUNICIPIO WHERE ID_MUNICIPIO = :id`,
        [municipioId]
    );
    return result.rows.length > 0;
}

async function checkUbicacionExists(connection, escuelaId, centroId) {
    const result = await connection.execute(
        `SELECT ESCUELA_ID_ESCUELA FROM UBICACION WHERE ESCUELA_ID_ESCUELA = :escuelaId AND CENTRO_ID_CENTRO = :centroId`,
        { escuelaId, centroId }
    );
    return result.rows.length > 0;
}


// GET (Fetch all registros)
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute('SELECT * FROM REGISTRO ORDER BY ID_REGISTRO');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching registros' });
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

// GET (Fetch a single registro by ID)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT * FROM REGISTRO WHERE ID_REGISTRO = :id`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Registro not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching registro' });
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


// POST (Create a new registro)
router.post('/', async (req, res) => {
    const {
        id_registro, fecha, tipo_tramite, tipo_licencia,
        nombre_completo = null, // Default to null if not provided
        genero, municipio_id_municipio,
        ubicacion_escuela_id, ubicacion_centro_id
    } = req.body;

    // Basic validation
    if (!id_registro || !fecha || !tipo_tramite || !tipo_licencia || !genero || !municipio_id_municipio || !ubicacion_escuela_id || !ubicacion_centro_id) {
        return res.status(400).json({ message: 'All required fields must be provided.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();

        // *** FOREIGN KEY VALIDATIONS ***
        const [municipioExiste, ubicacionExiste] = await Promise.all([
            checkMunicipioExists(connection, municipio_id_municipio),
            checkUbicacionExists(connection, ubicacion_escuela_id, ubicacion_centro_id)
        ]);

        if (!municipioExiste) {
            return res.status(404).json({ message: `The municipio with ID ${municipio_id_municipio} does not exist.` });
        }
        if (!ubicacionExiste) {
            return res.status(404).json({ message: `The ubicacion with Escuela ID ${ubicacion_escuela_id} and Centro ID ${ubicacion_centro_id} does not exist.` });
        }

        const newRegistro = { id_registro, fecha, tipo_tramite, tipo_licencia, nombre_completo, genero, municipio_id_municipio, ubicacion_escuela_id, ubicacion_centro_id };

        await connection.execute(
            `INSERT INTO REGISTRO (ID_REGISTRO, FECHA, TIPO_TRAMITE, TIPO_LICENCIA, NOMBRE_COMPLETO, GENERO, MUNICIPIO_ID_MUNICIPIO, UBICACION_ESCUELA_ID, UBICACION_CENTRO_ID) 
       VALUES (:id_registro, TO_DATE(:fecha, 'YYYY-MM-DD'), :tipo_tramite, :tipo_licencia, :nombre_completo, :genero, :municipio_id_municipio, :ubicacion_escuela_id, :ubicacion_centro_id)`,
            newRegistro,
            { autoCommit: true }
        );
        res.status(201).json({ message: 'Registro created successfully', data: newRegistro });
    } catch (err) {
        console.error(err);
        if (err.errorNum === 1) {
            return res.status(409).json({ message: 'Error: The registro ID already exists.' });
        }
        res.status(500).json({ message: 'Error creating registro' });
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

// PUT (Update a registro by its ID)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        fecha, tipo_tramite, tipo_licencia,
        nombre_completo = null,
        genero, municipio_id_municipio,
        ubicacion_escuela_id, ubicacion_centro_id
    } = req.body;

    if (!fecha || !tipo_tramite || !tipo_licencia || !genero || !municipio_id_municipio || !ubicacion_escuela_id || !ubicacion_centro_id) {
        return res.status(400).json({ message: 'All required fields must be provided for update.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();

        // *** FOREIGN KEY VALIDATIONS ***
        const [municipioExiste, ubicacionExiste] = await Promise.all([
            checkMunicipioExists(connection, municipio_id_municipio),
            checkUbicacionExists(connection, ubicacion_escuela_id, ubicacion_centro_id)
        ]);

        if (!municipioExiste) {
            return res.status(404).json({ message: `The municipio with ID ${municipio_id_municipio} does not exist.` });
        }
        if (!ubicacionExiste) {
            return res.status(404).json({ message: `The ubicacion with Escuela ID ${ubicacion_escuela_id} and Centro ID ${ubicacion_centro_id} does not exist.` });
        }

        const updatedRegistro = { id, fecha, tipo_tramite, tipo_licencia, nombre_completo, genero, municipio_id_municipio, ubicacion_escuela_id, ubicacion_centro_id };
        const result = await connection.execute(
            `UPDATE REGISTRO 
             SET FECHA = TO_DATE(:fecha, 'YYYY-MM-DD'), TIPO_TRAMITE = :tipo_tramite, TIPO_LICENCIA = :tipo_licencia, NOMBRE_COMPLETO = :nombre_completo, 
                 GENERO = :genero, MUNICIPIO_ID_MUNICIPIO = :municipio_id_municipio, UBICACION_ESCUELA_ID = :ubicacion_escuela_id, UBICACION_CENTRO_ID = :ubicacion_centro_id
             WHERE ID_REGISTRO = :id`,
            updatedRegistro,
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Registro not found for update.' });
        }
        res.status(200).json({ message: 'Registro updated successfully.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating registro.' });
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

// DELETE (Delete a registro by its ID)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `DELETE FROM REGISTRO WHERE ID_REGISTRO = :id`,
            [id],
            { autoCommit: true }
        );
        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Registro not found for deletion.' });
        }
        res.status(200).json({ message: 'Registro deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting registro.' });
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
