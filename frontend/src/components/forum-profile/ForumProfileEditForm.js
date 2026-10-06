import React, { useState } from 'react';

// EDIT FORM FOR BIO + COUNTRY + TRADING CURRENCIES (OWNER ONLY)
export default function ForumProfileEditForm({ initialBio, initialCountry, initialCurrencies, saving, onSave, onCancel }) {
  const [bio, setBio] = useState(initialBio || '');
  const [country, setCountry] = useState(initialCountry || '');
  const [currenciesText, setCurrenciesText] = useState((initialCurrencies || []).join(', '));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (saving) return;
    const currencies = currenciesText
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => /^[A-Z0-9]{2,10}$/.test(s))
      .slice(0, 10);
    onSave({ bio: bio.trim().slice(0, 300), country: country.trim().toUpperCase().slice(0, 2), currencies });
  };

  return (
    <form className="fp-edit-form" onSubmit={handleSubmit}>
      <label className="fp-field">
        <span>Bio (máx. 300)</span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Cuéntanos sobre ti…"
        />
      </label>
      <div className="fp-field-row">
        <label className="fp-field">
          <span>País (ISO)</span>
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2))}
            placeholder="MX"
            maxLength={2}
          />
        </label>
        <label className="fp-field fp-field-grow">
          <span>Monedas (separadas por coma)</span>
          <input
            value={currenciesText}
            onChange={(e) => setCurrenciesText(e.target.value.toUpperCase())}
            placeholder="BTC, ETH, USDT"
          />
        </label>
      </div>
      <div className="fp-edit-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
        <button type="submit" className="fb-btn-primary" disabled={saving}>
          {saving ? '…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
