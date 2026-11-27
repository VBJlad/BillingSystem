import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

export default function LocationForm({ open, onClose, onSubmit, initialData = null }) {
  const [form, setForm] = useState({
    location_name: '',
    description: '',
    address: '',
    remarks: '',
    status: 'Active',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      if (initialData) {
        setForm({
          location_name: initialData.location_name || '',
          description: initialData.description || '',
          address: initialData.address || '',
          remarks: initialData.remarks || '',
          status: initialData.status || 'Active',
        });
      } else {
        setForm({
          location_name: '',
          description: '',
          address: '',
          remarks: '',
          status: 'Active',
        });
      }
    }
  }, [open, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.location_name.trim()) {
      setError('Location name is required.');
      return;
    }
    if (!form.address.trim()) {
      setError('Address or coverage area is required.');
      return;
    }
    onSubmit(form);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? 'Edit Location' : 'Add Location'}
      subtitle="Define a service coverage area to organize customers and track area issues."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">
            Location Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={form.location_name}
            onChange={(e) => setForm({ ...form, location_name: e.target.value })}
            placeholder="e.g., Kaybagal South"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">Description</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Summary of residential or commercial coverage in this area..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">
            Address or Coverage Area <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="e.g., Purok 1–4, Brgy. Kaybagal South, Tagaytay City"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">Remarks</label>
          <input
            type="text"
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            placeholder="e.g., Served by OLT Port 01, NAP Boxes KS-01 to KS-06"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-800"
          >
            Save Location
          </button>
        </div>
      </form>
    </Modal>
  );
}
