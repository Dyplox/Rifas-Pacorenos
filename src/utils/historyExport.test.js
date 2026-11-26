import { describe, expect, it } from 'vitest';
import { formatEntryDate, historyToCsv } from './historyExport';

describe('formatEntryDate', () => {
    it('formats createdAt as dd/mm/yyyy', () => {
        expect(formatEntryDate({ createdAt: '2026-11-26T15:00:00' })).toBe('26/11/2026');
    });

    it('returns an empty string for legacy entries without a date', () => {
        expect(formatEntryDate({ timestamp: '14:00:00' })).toBe('');
        expect(formatEntryDate({ createdAt: 'not a date' })).toBe('');
    });
});

describe('historyToCsv', () => {
    const rows = (csv) => csv.replace(/^\uFEFF/, '').split('\r\n');

    it('starts with a BOM and a header row', () => {
        const csv = historyToCsv([]);
        expect(csv.startsWith('\uFEFF')).toBe(true);
        expect(rows(csv)).toEqual(['"Número","Nombre","Fecha","Hora"']);
    });

    it('writes one row per entry, quoting and escaping fields', () => {
        const csv = historyToCsv([
            { number: '042', winnerName: 'Ana "La Rifa"', createdAt: '2026-11-26T15:00:00', timestamp: '15:00:00' },
            { number: '007', winnerName: '', timestamp: '14:00:00' },
        ]);
        expect(rows(csv).slice(1)).toEqual([
            '"042","Ana ""La Rifa""","26/11/2026","15:00:00"',
            '"007","","","14:00:00"',
        ]);
    });

    it('neutralizes spreadsheet formulas in names', () => {
        const csv = historyToCsv([{ number: '1', winnerName: '=HYPERLINK("x")', timestamp: '' }]);
        expect(rows(csv)[1]).toContain(`"'=HYPERLINK(""x"")"`);
    });
});
