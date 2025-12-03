import { Competition } from './types';

export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export const exportToCSV = (results: Competition[], onExport: (message: string, type: string) => void): void => {
  if (results.length === 0) {
    onExport('No results to export', 'warning');
    return;
  }

  const headers = ['Name', 'Dates', 'Fees', 'Requirements', 'Notes', 'Type', 'Age Group', 'Location', 'URL'];
  const rows = results.map(comp => [
    comp.name,
    comp.dates,
    comp.fees,
    comp.requirements,
    comp.notes,
    comp.type,
    comp.ageGroup,
    comp.location,
    comp.url
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ctf_competitions_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();

  onExport('Results exported to CSV', 'success');
};
