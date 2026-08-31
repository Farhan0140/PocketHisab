// ============================================================================
// src/controllers/export.controller.js
//
// These two endpoints are the one exception in this API to the standard
// { success, data, error, meta } JSON envelope — they hand back an actual
// downloadable file (CSV, PDF, or JSON with a Content-Disposition header),
// since that's what "export"/"backup" means to the client.
// ============================================================================

const exportService = require('../services/exportService');
const { BadRequestError } = require('../utils/ApiError');

const exportTransactions = async (req, res) => {
  const format = req.query.format || 'csv';

  if (format === 'csv') {
    const csv = await exportService.buildTransactionsCsv(req.user.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    return res.status(200).send(csv);
  }

  if (format === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.pdf"');
    return exportService.streamTransactionsPdf(req.user.id, res);
  }

  throw new BadRequestError('Unsupported export format. Use format=csv or format=pdf.');
};

const exportFullBackup = async (req, res) => {
  const backup = await exportService.buildFullBackup(req.user.id);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="pockethisab-backup.json"');
  res.status(200).json(backup);
};

module.exports = { exportTransactions, exportFullBackup };
