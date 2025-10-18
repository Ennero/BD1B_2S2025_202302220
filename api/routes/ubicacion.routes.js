const { Router } = require('express');
const oracledb = require('oracledb');
const router = Router();

// Asegurarnos que la salida sea en formato de objeto JSON
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// --- Funciones Auxiliares de Validación ---
async function checkEscuelaExists(connection, escuelaId) {
  const result = await connection.execute(
    `SELECT ID_ESCUELA FROM ESCUELA WHERE ID_ESCUELA = :id`,
    [escuelaId]
  );
  return result.rows.length > 0;
}

async function checkCentroExists(connection, centroId) {
  const result = await connection.execute(
    `SELECT ID_CENTRO FROM CENTRO WHERE ID_CENTRO = :id`,
    [centroId]
  );
  return result.rows.length > 0;
}


// GET (Traer todas las ubicaciones/relaciones)
router.get('/', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute('SELECT * FROM UBICACION');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener las ubicaciones' });
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

// GET (Traer una ubicación por su llave primaria compuesta)
router.get('/escuela/:escuelaId/centro/:centroId', async (req, res) => {
  const { escuelaId, centroId } = req.params;
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT * FROM UBICACION WHERE ESCUELA_ID_ESCUELA = :escuelaId AND CENTRO_ID_CENTRO = :centroId`,
      { escuelaId, centroId }
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ubicación no encontrada' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener la ubicación' });
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


// POST (Crear una nueva ubicación/relación)
router.post('/', async (req, res) => {
  const { escuela_id_escuela, centro_id_centro } = req.body;

  if (!escuela_id_escuela || !centro_id_centro) {
    return res.status(400).json({ message: 'Los campos escuela_id_escuela y centro_id_centro son requeridos.' });
  }

  let connection;
  try {
    connection = await oracledb.getConnection();

    // VALIDACIÓN DE LLAVES FORÁNEAS
    const [escuelaExiste, centroExiste] = await Promise.all([
      checkEscuelaExists(connection, escuela_id_escuela),
      checkCentroExists(connection, centro_id_centro)
    ]);

    if (!escuelaExiste) {
      return res.status(404).json({ message: `La escuela con ID ${escuela_id_escuela} no existe.` });
    }
    if (!centroExiste) {
      return res.status(404).json({ message: `El centro con ID ${centro_id_centro} no existe.` });
    }

    const newUbicacion = { escuela_id_escuela, centro_id_centro };
    await connection.execute(
      `INSERT INTO UBICACION (ESCUELA_ID_ESCUELA, CENTRO_ID_CENTRO) 
       VALUES (:escuela_id_escuela, :centro_id_centro)`,
      newUbicacion,
      { autoCommit: true }
    );
    res.status(201).json({ message: 'Ubicación creada exitosamente', data: newUbicacion });
  } catch (err) {
    console.error(err);
    if (err.errorNum === 1) {
      return res.status(409).json({ message: 'Error: La relación entre esta escuela y este centro ya existe.' });
    }
    res.status(500).json({ message: 'Error al crear la ubicación' });
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

// DELETE (Eliminar una ubicación por su llave primaria compuesta)
router.delete('/escuela/:escuelaId/centro/:centroId', async (req, res) => {
  const { escuelaId, centroId } = req.params;
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `DELETE FROM UBICACION WHERE ESCUELA_ID_ESCUELA = :escuelaId AND CENTRO_ID_CENTRO = :centroId`,
      { escuelaId, centroId },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Ubicación no encontrada para eliminar.' });
    }
    res.status(200).json({ message: 'Ubicación eliminada exitosamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar la ubicación.' });
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
