import React, { useState, useRef } from 'react';
import { Play, Pause, Download, Plus, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Competition, LogEntry, Stats } from './types';
import { exportToCSV } from './utils';
import { scrapeUrl } from './scraper';

const CTFScraper = () => {
  const [urls, setUrls] = useState(['https://ctftime.org/event/list/upcoming']);
  const [newUrl, setNewUrl] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Competition[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, success: 0, failed: 0, skipped: 0 });
  const abortControllerRef = useRef<AbortController | null>(null);

  const addLog = (message: string, type: string = 'info'): void => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const updateStats = (key: 'success' | 'failed' | 'skipped', increment: number) => {
    setStats(prev => ({ ...prev, [key]: prev[key] + increment }));
  };

  const addUrl = () => {
    if (newUrl && !urls.includes(newUrl)) {
      setUrls([...urls, newUrl]);
      setNewUrl('');
      addLog(`Added URL: ${newUrl}`, 'success');
    }
  };

  const removeUrl = (index: number) => {
    const removed = urls[index];
    setUrls(urls.filter((_, i) => i !== index));
    addLog(`Removed URL: ${removed}`, 'info');
  };

  const startScraping = async () => {
    setIsRunning(true);
    setResults([]);
    setLogs([]);
    setStats({ total: urls.length, success: 0, failed: 0, skipped: 0 });
    abortControllerRef.current = new AbortController();

    addLog('Starting ethical web scraping...', 'info');
    addLog(`Total URLs to process: ${urls.length}`, 'info');

    const allCompetitions: Competition[] = [];

    for (const url of urls) {
      if (!abortControllerRef.current?.signal.aborted) {
        const competitions = await scrapeUrl(
          url,
          abortControllerRef.current.signal,
          addLog,
          updateStats
        );
        allCompetitions.push(...competitions);
      }
    }

    setResults(allCompetitions);
    addLog(`Scraping complete! Found ${allCompetitions.length} total competitions`, 'success');
    setIsRunning(false);
  };

  const stopScraping = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      addLog('Scraping stopped by user', 'warning');
      setIsRunning(false);
    }
  };

  const handleExport = () => {
    exportToCSV(results, addLog);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-blue-500/20">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">Ethical CTF Competition Scraper</h1>
          <p className="text-slate-300">Rhode Island College - Institute of Cybersecurity</p>
          <p className="text-slate-400 text-sm mt-2">Respects robots.txt • Throttled requests • Privacy-conscious</p>
        </div>

        {/* URL Management */}
        <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-blue-500/20">
          
          <div className="flex gap-2 mb-4">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addUrl()}
              placeholder="https://example.com/ctf-events"
              className="flex-1 bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={addUrl}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Plus size={20} />
              Add URL
            </button>
          </div>

          <div className="space-y-2">
            {urls.map((url, index) => (
              <div key={index} className="flex items-center justify-between bg-slate-700/50 p-3 rounded">
                <span className="text-slate-200 truncate flex-1">{url}</span>
                <button
                  onClick={() => removeUrl(index)}
                  className="text-red-400 hover:text-red-300 ml-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-blue-500/20">
          <div className="flex gap-4">
            <button
              onClick={isRunning ? stopScraping : startScraping}
              disabled={urls.length === 0}
              className={`flex-1 ${
                isRunning 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white px-6 py-3 rounded font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
              {isRunning ? 'Stop Scraping' : 'Start Scraping'}
            </button>
            
            <button
              onClick={handleExport}
              disabled={results.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} />
              Export CSV
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="bg-slate-700/50 p-3 rounded text-center">
              <div className="text-slate-400 text-sm">Total</div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </div>
            <div className="bg-green-900/30 p-3 rounded text-center">
              <div className="text-green-400 text-sm">Success</div>
              <div className="text-2xl font-bold text-green-300">{stats.success}</div>
            </div>
            <div className="bg-red-900/30 p-3 rounded text-center">
              <div className="text-red-400 text-sm">Failed</div>
              <div className="text-2xl font-bold text-red-300">{stats.failed}</div>
            </div>
            <div className="bg-yellow-900/30 p-3 rounded text-center">
              <div className="text-yellow-400 text-sm">Skipped</div>
              <div className="text-2xl font-bold text-yellow-300">{stats.skipped}</div>
            </div>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-blue-500/20">
            <h2 className="text-xl font-semibold text-blue-300 mb-4">
              Results ({results.length} competitions found)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="p-3 text-blue-300">Name</th>
                    <th className="p-3 text-blue-300">Dates</th>
                    <th className="p-3 text-blue-300">Type</th>
                    <th className="p-3 text-blue-300">Location</th>
                    <th className="p-3 text-blue-300">Fees</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((comp, index) => (
                    <tr key={index} className="border-b border-slate-700">
                      <td className="p-3 text-slate-200">
                        <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          {comp.name}
                        </a>
                      </td>
                      <td className="p-3 text-slate-300">{comp.dates}</td>
                      <td className="p-3 text-slate-300">{comp.type}</td>
                      <td className="p-3 text-slate-300">{comp.location}</td>
                      <td className="p-3 text-slate-300">{comp.fees}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Logs */}
        <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-blue-500/20">
          <h2 className="text-xl font-semibold text-blue-300 mb-4">Activity Log</h2>
          <div className="bg-slate-900/50 rounded p-4 h-64 overflow-y-auto font-mono text-sm space-y-1">
            {logs.length === 0 ? (
              <p className="text-slate-500">No activity yet. Add URLs and start scraping.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-slate-500">[{log.timestamp}]</span>
                  {log.type === 'success' && <CheckCircle size={16} className="text-green-400 mt-0.5" />}
                  {log.type === 'error' && <AlertCircle size={16} className="text-red-400 mt-0.5" />}
                  {log.type === 'warning' && <AlertCircle size={16} className="text-yellow-400 mt-0.5" />}
                  {log.type === 'info' && <Clock size={16} className="text-blue-400 mt-0.5" />}
                  <span className={`${
                    log.type === 'success' ? 'text-green-300' :
                    log.type === 'error' ? 'text-red-300' :
                    log.type === 'warning' ? 'text-yellow-300' :
                    'text-slate-300'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTFScraper;