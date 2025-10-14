const { Router } = require('express');
const oracledb = require('oracledb');
const router = Router();

// Asegurar que la salida sea en formato de objeto JSON
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// --- Funciones Auxiliares de Validación ---
async function checkPregExists(connection, pregId) {
    const result = await connection.execute(
        `SELECT ID_PREG FROM PREG WHERE ID_PREG = :id`,
        [pregId]
    );
    return result.rows.length > 0;
}

async function checkExamenExists(connection, examenId) {
    const result = await connection.execute(
        `SELECT ID_EXAMEN FROM EXAMEN WHERE ID_EXAMEN = :id`,
        [examenId]
    );
    return result.rows.length > 0;
}


// GET (Obtener todas las respuestas de usuario)
router.get('/', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute('SELECT * FROM RES_USU ORDER BY ID_RES_USU');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener las respuestas de usuario' });
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

// GET (Obtener una respuesta de usuario por su ID)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT * FROM RES_USU WHERE ID_RES_USU = :id`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Respuesta de usuario no encontrada' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener la respuesta de usuario' });
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


// POST (Crear una nueva respuesta de usuario)
router.post('/', async (req, res) => {
  // Renombramos 'res' a 'respuesta' para evitar conflicto con el objeto response de Express
  const { id_res_usu, res: respuesta, preg_id_preg, examen_id_examen } = req.body;
  
  if (id_res_usu === undefined || !respuesta || !preg_id_preg || !examen_id_examen) {
    return res.status(400).json({ message: 'Todos los campos son requeridos: id_res_usu, res, preg_id_preg, examen_id_examen.' });
  }

  let connection;
  try {
    connection = await oracledb.getConnection();

    // *** VALIDACIÓN DE LLAVES FORÁNEAS ***
    const [preguntaExiste, examenExiste] = await Promise.all([
        checkPregExists(connection, preg_id_preg),
        checkExamenExists(connection, examen_id_examen)
    ]);

    if (!preguntaExiste) {
        return res.status(404).json({ message: `La pregunta teórica con ID ${preg_id_preg} no existe.` });
    }
    if (!examenExiste) {
        return res.status(404).json({ message: `El examen con ID ${examen_id_examen} no existe.` });
    }

    const newRespuesta = { id_res_usu, respuesta, preg_id_preg, examen_id_examen };
    
    await connection.execute(
      `INSERT INTO RES_USU (ID_RES_USU, RES, PREG_ID_PREG, EXAMEN_ID_EXAMEN) 
       VALUES (:id_res_usu, :respuesta, :preg_id_preg, :examen_id_examen)`,
      newRespuesta,
      { autoCommit: true }
    );
    res.status(201).json({ message: 'Respuesta de usuario creada exitosamente', data: newRespuesta });
  } catch (err) {
    console.error(err);
    if (err.errorNum === 1) {
        return res.status(409).json({ message: 'Error: El ID de la respuesta de usuario ya existe.' });
    }
    res.status(500).json({ message: 'Error al crear la respuesta de usuario' });
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

// PUT (Actualizar una respuesta de usuario por su ID)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    // Renombramos 'res' a 'respuesta' para evitar conflicto
    const { res: respuesta, preg_id_preg, examen_id_examen } = req.body;

    if (!respuesta || !preg_id_preg || !examen_id_examen) {
        return res.status(400).json({ message: 'Los campos res, preg_id_preg y examen_id_examen son requeridos.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection();

        // *** VALIDACIÓN DE LLAVES FORÁNEAS ***
        const [preguntaExiste, examenExiste] = await Promise.all([
            checkPregExists(connection, preg_id_preg),
            checkExamenExists(connection, examen_id_examen)
        ]);

        if (!preguntaExiste) {
            return res.status(404).json({ message: `La pregunta teórica con ID ${preg_id_preg} no existe.` });
        }
        if (!examenExiste) {
            return res.status(404).json({ message: `El examen con ID ${examen_id_examen} no existe.` });
        }

        const updatedRespuesta = { id, respuesta, preg_id_preg, examen_id_examen };
        const result = await connection.execute(
            `UPDATE RES_USU 
             SET RES = :respuesta, PREG_ID_PREG = :preg_id_preg, EXAMEN_ID_EXAMEN = :examen_id_examen
             WHERE ID_RES_USU = :id`,
            updatedRespuesta,
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Respuesta de usuario no encontrada para actualizar.' });
        }
        res.status(200).json({ message: 'Respuesta de usuario actualizada exitosamente.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al actualizar la respuesta de usuario.' });
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

// DELETE (Eliminar una respuesta de usuario por su ID)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `DELETE FROM RES_USU WHERE ID_RES_USU = :id`,
            [id],
            { autoCommit: true }
        );
        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: 'Respuesta de usuario no encontrada para eliminar.' });
        }
        res.status(200).json({ message: 'Respuesta de usuario eliminada exitosamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al eliminar la respuesta de usuario.' });
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
