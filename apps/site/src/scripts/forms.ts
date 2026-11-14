/**
 * One handler for every form on the site.
 * A form opts in with data-form="notes | resource | loom".
 * Success and error states are shown in place, and what was typed is kept on error.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LOOM_RE = /^(https?:\/\/)?(www\.)?loom\.com\/share\/[\w-]+/i;

export function toast(message: string, type: 'success' | 'error' | 'neutral' = 'neutral') {
  const host = document.getElementById('toasts');
  if (!host) return;
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

function fieldOf(input: Element): HTMLElement | null {
  return input.closest<HTMLElement>('.field, .check, .notes');
}

function setError(input: HTMLInputElement, on: boolean) {
  const field = fieldOf(input);
  if (!field) return;
  field.classList.toggle('is-error', on);
  input.setAttribute('aria-invalid', String(on));
  const help = field.querySelector<HTMLElement>('.help');
  if (help) {
    help.dataset.default ??= help.textContent ?? '';
    help.textContent = on && input.dataset.error ? input.dataset.error : help.dataset.default;
  }
}

function invalid(input: HTMLInputElement): boolean {
  const value = input.value.trim();
  if (input.type === 'checkbox') return input.required && !input.checked;
  if (!value) return input.required;
  if (input.type === 'email') return !EMAIL_RE.test(value);
  if (input.name === 'loom') return !LOOM_RE.test(value);
  return false;
}

function inputsOf(form: HTMLFormElement): HTMLInputElement[] {
  return [...form.querySelectorAll<HTMLInputElement>('input[name]:not(.hp), select[name], textarea[name]')];
}

/** Forms that start with a quiet button until the essentials are in (the Loom intake). */
function syncReady(form: HTMLFormElement) {
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"][data-ready-when-valid]');
  if (!button) return;
  const ready = inputsOf(form).every((i) => !invalid(i));
  button.setAttribute('aria-disabled', String(!ready));
  const loom = form.querySelector<HTMLInputElement>('input[name="loom"]');
  const note = form.querySelector<HTMLElement>('[data-loom-ok]');
  if (loom && note) note.hidden = !LOOM_RE.test(loom.value.trim());
}

document.addEventListener('input', (e) => {
  const input = e.target as HTMLInputElement;
  const form = input.closest?.('form[data-form]') as HTMLFormElement | null;
  if (!form) return;
  if (fieldOf(input)?.classList.contains('is-error') && !invalid(input)) setError(input, false);
  syncReady(form);
});
document.querySelectorAll<HTMLFormElement>('form[data-form]').forEach(syncReady);

document.addEventListener('submit', async (e) => {
  const form = (e.target as HTMLElement).closest?.('form[data-form]') as HTMLFormElement | null;
  if (!form) return;
  e.preventDefault();

  const kind = form.dataset.form!;
  const inputs = inputsOf(form);
  const alert = form.querySelector<HTMLElement>('.form-alert');
  const bad = inputs.filter(invalid);
  inputs.forEach((i) => setError(i, bad.includes(i)));
  if (alert) alert.hidden = bad.length === 0;
  if (bad.length) {
    bad[0].focus();
    return;
  }

  const data: Record<string, unknown> = { form: kind, company: form.querySelector<HTMLInputElement>('.hp')?.value ?? '' };
  for (const i of inputs) data[i.name] = i.type === 'checkbox' ? i.checked : i.value.trim();
  if (form.dataset.resource) data.resource = form.dataset.resource;

  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const label = button?.textContent ?? '';
  if (button) {
    button.disabled = true;
    button.textContent = 'Sending…';
  }

  try {
    const res = await fetch(kind === 'loom' ? '/api/loom' : '/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    });
    const out = (await res.json().catch(() => ({}))) as { ok?: boolean; fields?: string[] };
    if (!res.ok || !out.ok) {
      if (out.fields?.length) {
        inputs.forEach((i) => setError(i, out.fields!.includes(i.name)));
        if (alert) alert.hidden = false;
      } else {
        toast('Something went wrong. Please try again.', 'error');
      }
      return;
    }

    const wrap = form.closest<HTMLElement>('[data-form-wrap]');
    if (wrap) {
      wrap.querySelectorAll<HTMLElement>('[data-fill]').forEach((el) => {
        const value = String(data[el.dataset.fill!] ?? '');
        if (value) el.textContent = el.dataset.fill === 'loom' ? value.replace(/^https?:\/\/(www\.)?/, '') : value;
      });
      wrap.querySelectorAll<HTMLElement>('[data-state]').forEach((el) => (el.hidden = el.dataset.state !== 'success'));
      document.querySelectorAll<HTMLElement>('[data-swap-on-success]').forEach((el) => {
        el.hidden = el.dataset.swapOnSuccess !== 'success';
      });
      wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      form.reset();
      toast('Sent. Check your inbox.', 'success');
    }
  } catch {
    toast('Something went wrong. Please try again.', 'error');
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = label;
    }
  }
});
