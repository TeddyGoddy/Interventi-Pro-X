import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

app.get('/geocode', async (req, res) => {
  const address = req.query.address as string;
  const forceRefresh = req.query.force === 'true';
  console.log(`[SERVER] Ricevuta richiesta geocoding per: "${address}"`);
  console.log(`[SERVER] Query parameters:`, req.query);

  if (!address) {
    console.log('[SERVER] ERRORE: Parametro address mancante');
    return res.status(400).json({ error: 'Address query parameter is required' });
  }

  console.log(`[SERVER] Inizio geocoding per: ${address}`);

  // Definisce il percorso dello script Python relativo alla posizione di server.ts
        // Setup logging
    const logsDir = path.resolve(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
    const logFilePath = path.join(logsDir, 'scraping.log');
    const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

    const logRequest = `\n--- [${new Date().toISOString()}] Nuova Richiesta ---\nIndirizzo: ${address}\n`;
    logStream.write(logRequest);
    console.log(logRequest);

    const pythonScriptPath = path.resolve(__dirname, 'scraper.py');
    const startMessage = `[Server] Avvio dello script Python: ${pythonScriptPath}`;
    console.log(startMessage);
    logStream.write(`${startMessage}\n`);

  const pythonProcess = spawn('python', [pythonScriptPath, address, forceRefresh ? '--force' : '']);

  let scriptOutput = '';
  let scriptError = '';
  let isProcessComplete = false;
  
  // 🚀 TIMEOUT: Uccidi il processo dopo 15 secondi
  let responseAlreadySent = false;
  const timeoutId = setTimeout(() => {
    if (!isProcessComplete && !responseAlreadySent) {
      console.log('[Server] ⚠️ Timeout processo Python (15s), terminazione forzata');
      pythonProcess.kill('SIGTERM');
      responseAlreadySent = true;
      res.status(408).json({ error: 'Timeout: Google Maps scraper troppo lento' });
    }
  }, 15000);

  pythonProcess.stdout.on('data', (data) => {
    scriptOutput += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    // I log di debug dello script Python vengono inviati a stderr
        const logMessage = data.toString();
        console.error(`[Python Debug]: ${logMessage}`);
        logStream.write(logMessage); // Scrive l'output di stderr direttamente nel file di log
        scriptError += logMessage;
  });

  pythonProcess.on('close', (code) => {
        isProcessComplete = true;
        clearTimeout(timeoutId); // Cancella il timeout
        
        const closeMessage = `[Server] Processo Python terminato con codice: ${code}`;
        console.log(closeMessage);
        logStream.write(`${closeMessage}\n`);

    // ✅ CONTROLLO DOPPIA RISPOSTA: Invia risposta solo se non già inviata
    if (responseAlreadySent) {
      console.log('[Server] ⚠️ Risposta già inviata (timeout), skip risposta processo');
      return;
    }

    if (code === 0 && scriptOutput) {
      try {
        const result = JSON.parse(scriptOutput);
                const successMsg = `[Server] Dati JSON ricevuti: ${JSON.stringify(result)}`;
                console.log(successMsg);
                logStream.write(`${successMsg}\n`);
        console.log('[Server] Dati JSON ricevuti da Python:', result);
        responseAlreadySent = true;
        res.json(result);
      } catch (e) {
        console.error('[Server] Errore nel parsing del JSON da Python:', e);
        responseAlreadySent = true;
        res.status(500).json({ error: 'Errore nella risposta dello script di scraping' });
      }
    } else {
            const errorMsg = `[Server] Errore durante l'esecuzione dello script Python. Output di errore: ${scriptError}`;
            console.error(errorMsg);
            logStream.write(`${errorMsg}\n`);
      console.error(`[Server] Errore durante l'esecuzione dello script Python. Output di errore: ${scriptError}`);
      responseAlreadySent = true;
      res.status(500).json({ error: 'Errore del server durante lo scraping', details: scriptError });
    }
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Geocoding server listening at http://0.0.0.0:${port}`);
  console.log(`Also accessible at http://localhost:${port}`);
});
