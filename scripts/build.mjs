import { execSync } from "child_process";
import fs from "fs";
execSync("tish build src/index.tish -o dist/index.js --target js", { stdio: 'inherit' });
execSync("tish build src/sw_worker.tish -o dist/sw_worker.js --target js", { stdio: 'inherit' });

fs.appendFileSync("dist/index.js", "\nexport { serve, dispatch, createBcWebSocket, readFile, writeFile, fileExists, readDir, mkdir, unlink, clearAll, process, getProcess, setOnExit, fetch, nativeWebSocket };\n");
