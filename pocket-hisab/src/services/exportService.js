// ============================================================================
// src/services/exportService.js
//
// Builds the data behind GET /export/transactions (CSV or PDF) and
// GET /export/full-backup (a single JSON dump of everything the user owns).
// Note: unlike every other endpoint in this API, these two do NOT return the
// standard { success, data, error, meta } JSON envelope — they return a raw
// file (text/csv, application/pdf, or a downloadable application/json), since
// the whole point is for the client to save/share the response as a file.
// ============================================================================

const PDFDocument = require('pdfkit');
const knex = require('../db/knex');
const { toCsv } = require('../utils/csvFormatter');

/** All of a user's transactions, most recent first, with category name joined in. */
async function getAllTransactionsForExport(userId) {
  return knex('transactions')
    .leftJoin('categories', 'transactions.category_id', 'categories.id')
    .where('transactions.user_id', userId)
    .orderBy('transactions.transaction_date', 'desc')
    .select(
      'transactions.id',
      'transactions.type',
      'transactions.amount',
      'categories.name as category_name',
      'transactions.note',
      'transactions.transaction_date'
    );
}

async function buildTransactionsCsv(userId) {
  const rows = await getAllTransactionsForExport(userId);
  return toCsv(
    rows,
    ['id', 'type', 'amount', 'category_name', 'note', 'transaction_date'],
    ['ID', 'Type', 'Amount', 'Category', 'Note', 'Date']
  );
}

/**
 * Streams a simple tabular PDF of the user's transactions directly onto an
 * HTTP response. pdfkit is a *streaming* PDF generator — it writes chunks
 * straight to `res` as the document is built, rather than buffering the
 * whole file in memory first.
 *
 * @param {string} userId
 * @param {import('express').Response} res
 */
async function streamTransactionsPdf(userId, res) {
  const rows = await getAllTransactionsForExport(userId);

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  doc.fontSize(18).text('PocketHisab — Transaction History', { align: 'center' });
  doc.moveDown();

  doc.fontSize(10);
  rows.forEach((row) => {
    const line = `${row.transaction_date.toISOString?.().slice(0, 10) ?? row.transaction_date}  |  ${row.type.toUpperCase()}  |  ${Number(row.amount).toFixed(2)}  |  ${row.category_name || '-'}  |  ${row.note || ''}`;
    doc.text(line);
  });

  doc.end();
}

/**
 * A full JSON export of everything a user owns — the whole point of a
 * backup file. Custom categories only (global defaults are re-seeded fresh
 * on any environment, so they don't need to be part of a personal backup).
 */
async function buildFullBackup(userId) {
  const [user, categories, transactions, debts, repayments, reminders, savingsPots, savingsHistory] =
    await Promise.all([
      knex('users').where({ id: userId }).first(),
      knex('categories').where({ user_id: userId }),
      knex('transactions').where({ user_id: userId }),
      knex('debts').where({ user_id: userId }),
      knex('debt_repayments')
        .join('debts', 'debt_repayments.debt_id', 'debts.id')
        .where('debts.user_id', userId)
        .select('debt_repayments.*'),
      knex('reminders')
        .join('debts', 'reminders.debt_id', 'debts.id')
        .where('debts.user_id', userId)
        .select('reminders.*'),
      knex('savings_pots').where({ user_id: userId }),
      knex('savings_history')
        .join('savings_pots', 'savings_history.savings_pot_id', 'savings_pots.id')
        .where('savings_pots.user_id', userId)
        .select('savings_history.*'),
    ]);

  return {
    exported_at: new Date().toISOString(),
    profile: user,
    categories,
    transactions,
    debts,
    debt_repayments: repayments,
    reminders,
    savings_pots: savingsPots,
    savings_history: savingsHistory,
  };
}

module.exports = { buildTransactionsCsv, streamTransactionsPdf, buildFullBackup };
