export function calculateCost(servers, hours, storage) {
  const values = [servers, hours, storage];
  if (values.some(value => !Number.isInteger(value)) ||
      servers < 1 || servers > 100 || hours < 1 || hours > 744 ||
      storage < 0 || storage > 100000) {
    throw new RangeError('Use números inteiros: 1–100 servidores, 1–744 horas e 0–100.000 GB.');
  }
  const computeCents = servers * hours * 12;
  const storageCents = storage * 8;
  return { compute: computeCents / 100, storage: storageCents / 100, total: (computeCents + storageCents) / 100 };
}

if (typeof document !== 'undefined') {
  const form = document.querySelector('#calculator');
  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const error = document.querySelector('#error');
    try {
      const result = calculateCost(Number(form.elements.servers.value), Number(form.elements.hours.value), Number(form.elements.storage.value));
      document.querySelector('#total').textContent = currency.format(result.total);
      document.querySelector('#breakdown').textContent = `Computação: ${currency.format(result.compute)} · Armazenamento: ${currency.format(result.storage)}`;
      error.textContent = '';
    } catch (exception) {
      error.textContent = exception.message;
      document.querySelector('#total').textContent = '—';
      document.querySelector('#breakdown').textContent = 'Revise os valores e calcule novamente.';
    }
  });
}
