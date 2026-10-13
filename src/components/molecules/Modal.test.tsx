import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Modal } from './index';

function Example() {
  const [open, setOpen] = useState(false);
  return <><button onClick={() => setOpen(true)}>Deschide</button><Modal title="Detalii" open={open} onClose={() => setOpen(false)}><input aria-label="Nume"/><button>Ultimul control</button></Modal></>;
}

describe('Accessible modal', () => {
  it('keeps keyboard focus inside the dialog and restores it after Escape', async () => {
    const user = userEvent.setup();
    render(<Example/>);
    const opener = screen.getByRole('button', {name: 'Deschide'});
    await user.click(opener);
    await waitFor(() => expect(screen.getByRole('button', {name: 'Închide fereastra'})).toHaveFocus());
    await user.tab({shift: true});
    expect(screen.getByRole('button', {name: 'Ultimul control'})).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', {name: 'Închide fereastra'})).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });
});
