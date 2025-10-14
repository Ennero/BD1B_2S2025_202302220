const { Router } = require('express');
const oracledb = require('oracledb');
const router = Router();

// Asegurarnos que la salida sea en formato de objeto JSON
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// GET (Traer todos los correlativos)
router.get('/', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute('SELECT * FROM CORRELATIVO ORDER BY ID_CORRELATIVO');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener los correlativos' });
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

// GET (Traer un correlativo por su ID)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT * FROM CORRELATIVO WHERE ID_CORRELATIVO = :id`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Correlativo no encontrado' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener el correlativo' });
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

// POST (Crear un nuevo correlativo)
router.post('/', async (req, res) => {
  const { id_correlativo, fecha, no_examen } = req.body;
  if (!id_correlativo || !fecha || no_examen === undefined) {
    return res.status(400).json({ message: 'ID_CORRELATIVO, FECHA y NO_EXAMEN son requeridos.' });
  }
  let connection;
  try {
    connection = await oracledb.getConnection();
    // El driver de node-oracledb puede manejar strings de fecha si están en un formato estándar
    const result = await connection.execute(
      `INSERT INTO CORRELATIVO (ID_CORRELATIVO, FECHA, NO_EXAMEN) VALUES (:id_correlativo, :fecha, :no_examen)`,
      { id_correlativo, fecha, no_examen },
      { autoCommit: true }
    );
    res.status(201).json({ message: 'Correlativo creado exitosamente', data: { id_correlativo, fecha, no_examen } });
  } catch (err) {
    console.error(err);
    if (err.errorNum === 1) {
        return res.status(409).json({ message: 'Error: El ID del correlativo ya existe.' });
    }
    res.status(500).json({ message: 'Error al crear el correlativo' });
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

// PUT (Actualizar un correlativo por su ID)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { fecha, no_examen } = req.body;

    if (!fecha || no_examen === undefined) {
        return res.status(400).json({ message: 'Los campos FECHA y NO_EXAMEN son requeridos.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `UPDATE CORRELATIVO SET FECHA = :fecha, NO_EXAMEN = :no_examen WHERE ID_CORRELATIVO = :id`,
            { fecha, no_examen, id },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Correlativo no encontrado para actualizar.' });
        }
        res.status(200).json({ message: 'Correlativo actualizado exitosamente.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al actualizar el correlativo.' });
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

// DELETE (Eliminar un correlativo por su ID)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `DELETE FROM CORRELATIVO WHERE ID_CORRELATIVO = :id`,
            [id],
            { autoCommit: true }
        );
        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Correlativo no encontrado para eliminar.' });
        }
        res.status(200).json({ message: 'Correlativo eliminado exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al eliminar el correlativo.' });
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
