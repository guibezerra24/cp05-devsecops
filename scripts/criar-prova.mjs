import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const mode = process.argv[2];
if (!['gitleaks', 'semgrep'].includes(mode)) {
  console.error('Uso: node scripts/criar-prova.mjs gitleaks|semgrep');
  process.exit(1);
}
const root = fileURLToPath(new URL('../', import.meta.url));
const destination = join(root, 'sabotagem');
const filename = mode === 'gitleaks' ? 'credencial-falsa.txt' : 'codigo-inseguro.js';
const target = join(destination, filename);
if (existsSync(target)) {
  console.error(`O arquivo sabotagem/${filename} já existe. Nenhum arquivo foi alterado.`);
  process.exit(1);
}
mkdirSync(destination, { recursive: true });
const content = mode === 'gitleaks'
  ? '# Credencial sintética, sem acesso a qualquer serviço.\nCP05_API_TOKEN=' + 'CP05_' + randomBytes(16).toString('hex') + '\n'
  : '// Arquivo de análise estática: não é importado pelo site nem executado.\nfunction executarEntrada(entrada) {\n  return eval(entrada);\n}\n';
writeFileSync(target, content, { encoding: 'utf8', flag: 'wx' });
console.log(`Criado sabotagem/${filename}. Faça commit na branch de prova e envie ao GitHub.`);
console.log('Resultado esperado: o job correspondente deve falhar pelo achado de segurança.');
