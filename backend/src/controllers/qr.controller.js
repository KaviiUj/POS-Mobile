const { encrypt } = require('../utils/encryption');
const logger = require('../utils/logger');

/**
 * @desc    Encrypt table data object
 * @route   POST /api/v1/qr/encrypt
 * @access  Public
 */
exports.encryptTableData = async (req, res) => {
  try {
    const { tableName, tableId } = req.body;

    // Validate required fields
    if (!tableName || !tableId) {
      return res.status(400).json({
        success: false,
        message: 'tableName and tableId are required',
      });
    }

    // Create table data object
    const tableData = {
      tableName,
      tableId,
    };

    // Encrypt the entire object as one string
    const encryptedData = encrypt(tableData);

    logger.info('Table data encrypted', {
      tableName,
      tableId,
    });

    res.status(200).json({
      success: true,
      encryptedData,
    });
  } catch (error) {
    logger.error('Encryption error', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: 'Error encrypting data',
      error: error.message,
    });
  }
};

