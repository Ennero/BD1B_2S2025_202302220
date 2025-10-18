const { Router } = require('express');
const oracledb = require('oracledb');
const router = Router();

// Asegurarnos que la salida sea en formato de objeto JSON
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// GET (Traer todas las preguntas)
router.get('/', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute('SELECT * FROM PREG ORDER BY ID_PREG');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener las preguntas' });
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

// GET (Traer una pregunta por su ID)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT * FROM PREG WHERE ID_PREG = :id`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pregunta no encontrada' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener la pregunta' });
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

// POST (Crear una nueva pregunta)
router.post('/', async (req, res) => {
  const { id_preg, preg_texto, res: respuesta, res1, res2, res3 = null, res4 = null } = req.body;

  if (!id_preg || !preg_texto || !respuesta || !res1 || !res2) {
    return res.status(400).json({ message: 'ID_PREG, PREG_TEXTO, RES, RES1 y RES2 son requeridos.' });
  }

  const newPreg = { id_preg, preg_texto, res: respuesta, res1, res2, res3, res4 };

  let connection;
  try {
    connection = await oracledb.getConnection();
    await connection.execute(
      `INSERT INTO PREG (ID_PREG, PREG_TEXTO, RES, RES1, RES2, RES3, RES4) 
       VALUES (:id_preg, :preg_texto, :res, :res1, :res2, :res3, :res4)`,
      newPreg,
      { autoCommit: true }
    );
    res.status(201).json({ message: 'Pregunta creada exitosamente', data: newPreg });
  } catch (err) {
    console.error(err);
    if (err.errorNum === 1) {
      return res.status(409).json({ message: 'Error: El ID de la pregunta ya existe.' });
    }
    res.status(500).json({ message: 'Error al crear la pregunta' });
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

// PUT (Actualizar una pregunta por su ID)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { preg_texto, res: respuesta, res1, res2, res3 = null, res4 = null } = req.body;

  if (!preg_texto || !respuesta || !res1 || !res2) {
    return res.status(400).json({ message: 'Los campos PREG_TEXTO, RES, RES1 y RES2 son requeridos.' });
  }

  // Mapeamos de vuelta a la clave 'res' para la consulta UPDATE
  const updatedPreg = { id, preg_texto, res: respuesta, res1, res2, res3, res4 };

  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `UPDATE PREG 
             SET PREG_TEXTO = :preg_texto, RES = :res, RES1 = :res1, RES2 = :res2, RES3 = :res3, RES4 = :res4 
             WHERE ID_PREG = :id`,
      updatedPreg,
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Pregunta no encontrada para actualizar.' });
    }
    res.status(200).json({ message: 'Pregunta actualizada exitosamente.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar la pregunta.' });
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

// DELETE (Eliminar una pregunta por su ID)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `DELETE FROM PREG WHERE ID_PREG = :id`,
      [id],
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Pregunta no encontrada para eliminar.' });
    }
    res.status(200).json({ message: 'Pregunta eliminada exitosamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar la pregunta.' });
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

