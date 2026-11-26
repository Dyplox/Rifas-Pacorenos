const DATE_FORMAT = { day: '2-digit', month: '2-digit', year: 'numeric' };

/**
 * Formats the date of a history entry (dd/mm/yyyy).
 * Entries created before dates were stored have no `createdAt` and return ''.
 */
export const formatEntryDate = (entry) => {
    if (!entry.createdAt) return '';
    const date = new Date(entry.createdAt);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-CO', DATE_FORMAT);
};

const escapeCsvField = (value) => {
    let text = String(value ?? '');
    // Prevent formula injection when the file is opened in a spreadsheet
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
};

/**
 * Builds a CSV (with BOM, so Excel detects UTF-8) from the raffle history.
 */
export const historyToCsv = (history) => {
    const header = ['Número', 'Nombre', 'Fecha', 'Hora'];
    const rows = history.map((entry) => [
        entry.number,
        entry.winnerName,
        formatEntryDate(entry),
        entry.timestamp,
    ]);
    const lines = [header, ...rows].map((row) => row.map(escapeCsvField).join(','));
    return '\uFEFF' + lines.join('\r\n');
};

/**
 * Triggers a browser download of the history as CSV.
 */
export const downloadHistoryCsv = (history) => {
    const blob = new Blob([historyToCsv(history)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `rifa-historial-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};
