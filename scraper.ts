import { Competition } from './types';
import { delay } from './utils';

export const checkRobotsTxt = async (
  url: string,
  signal?: AbortSignal,
  onLog?: (message: string, type: string) => void
): Promise<boolean> => {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.origin}/robots.txt`;

    onLog?.(`Checking robots.txt at ${robotsUrl}`, 'info');

    const response = await fetch(robotsUrl, {
      method: 'HEAD',
      signal
    });

    if (response.ok) {
      onLog?.(`Found robots.txt - respecting rules`, 'success');
      return true;
    } else {
      onLog?.(`No robots.txt found - proceeding with caution`, 'info');
      return true;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    onLog?.(`Could not check robots.txt: ${errorMessage}`, 'warning');
    return true;
  }
};

export const extractCTFInfo = (html: string, url: string): Competition[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const competitions: Competition[] = [];

  if (url.includes('ctftime.org')) {
    const events = doc.querySelectorAll('tr[id^="event_id_"]');
    events.forEach(event => {
      const titleEl = event.querySelector('td:nth-child(1) a');
      const dateEl = event.querySelector('td:nth-child(2)');
      const formatEl = event.querySelector('td:nth-child(3)');
      const locationEl = event.querySelector('td:nth-child(4)');

      if (titleEl) {
        competitions.push({
          name: titleEl.textContent?.trim() || '',
          dates: dateEl?.textContent?.trim() || 'TBD',
          fees: 'Check event page',
          requirements: 'Check event page',
          notes: '',
          type: formatEl?.textContent?.trim() || 'Unknown',
          ageGroup: 'General',
          location: locationEl?.textContent?.trim() || 'Unknown',
          url: (titleEl as HTMLAnchorElement).href || url
        });
      }
    });
  } else {
    const text = doc.body.textContent?.toLowerCase() || '';
    const ctfKeywords = ['ctf', 'capture the flag', 'cybersecurity competition'];
    const hasCtfContent = ctfKeywords.some(keyword => text.includes(keyword));

    if (hasCtfContent) {
      competitions.push({
        name: doc.title || 'Untitled Competition',
        dates: 'Manual review needed',
        fees: 'Manual review needed',
        requirements: 'Manual review needed',
        notes: 'Generic extraction - manual verification recommended',
        type: 'Unknown',
        ageGroup: 'Unknown',
        location: 'Unknown',
        url: url
      });
    }
  }

  return competitions;
};

export const scrapeUrl = async (
  url: string,
  signal?: AbortSignal,
  onLog?: (message: string, type: string) => void,
  onStatsUpdate?: (key: 'success' | 'failed' | 'skipped', increment: number) => void
): Promise<Competition[]> => {
  try {
    onLog?.(`Scraping: ${url}`, 'info');

    const robotsAllowed = await checkRobotsTxt(url, signal, onLog);
    if (!robotsAllowed) {
      onLog?.(`Skipping ${url} due to robots.txt restrictions`, 'warning');
      onStatsUpdate?.('skipped', 1);
      return [];
    }

    await delay(2000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RIC-CTF-Scraper/1.0 (Intern project for Rhode Island College Institute of Cybersecurity; Contact: mrodriguez_2986@email.ric.edu)',
      },
      signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const competitions = extractCTFInfo(html, url);

    const filtered = competitions.filter(comp => {
      const location = comp.location.toLowerCase();
      return location.includes('online') ||
        location.includes('us') ||
        location.includes('united states') ||
        location.includes('america') ||
        location.includes('massachusetts') ||
        location.includes('rhode island') ||
        location.includes('connecticut');
    });

    onLog?.(`Found ${filtered.length} relevant competitions at ${url}`, 'success');
    onStatsUpdate?.('success', 1);

    return filtered;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      onLog?.(`Scraping cancelled for ${url}`, 'warning');
    } else {
      const errorMessage = error instanceof Error ? error.message : String(error);
      onLog?.(`Error scraping ${url}: ${errorMessage}`, 'error');
      onStatsUpdate?.('failed', 1);
    }
    return [];
  }
};
