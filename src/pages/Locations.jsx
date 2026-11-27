import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, MapPin, LayoutGrid, List, Edit3, Archive, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SearchBar from '../components/common/SearchBar';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LocationCard from '../components/locations/LocationCard';
import LocationForm from '../components/locations/LocationForm';
import { getLocationStats } from '../services/locationService';
import { MONTH_NAMES, getBillingMonthKey } from '../utils/formatters';

export default function Locations() {
  const navigate = useNavigate();
  const {
    locations,
    customers,
    bills,
    issues,
    addLocation,
    editLocation,
    toggleLocationStatus,
  } = useApp();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(10); // Nov 2026
  const [formOpen, setFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);

  const selectedMonthKey = getBillingMonthKey(selectedYear, selectedMonthIdx);

  const enrichedLocations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return locations
      .filter((loc) => {
        if (statusFilter !== 'All' && loc.status !== statusFilter) return false;
        if (!q) return true;
        return (
          loc.location_name.toLowerCase().includes(q) ||
          loc.location_id.toLowerCase().includes(q) ||
          (loc.address || '').toLowerCase().includes(q) ||
          (loc.description || '').toLowerCase().includes(q)
        );
      })
      .map((loc) => ({
        ...loc,
        stats: getLocationStats(loc.location_id, customers, bills, issues, selectedMonthKey),
      }));
  }, [locations, customers, bills, issues, search, statusFilter, selectedMonthKey]);

  const handleOpenAdd = () => {
    setEditingLocation(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (loc) => {
    setEditingLocation(loc);
    setFormOpen(true);
  };

  const handleSubmitForm = (payload) => {
    if (editingLocation) {
      editLocation(editingLocation.location_id, payload);
    } else {
      addLocation(payload);
    }
  };

  const listColumns = [
    {
      key: 'location_name',
      label: 'Location',
      render: (l) => (
        <div>
          <p className="font-semibold text-slate-900">{l.location_name}</p>
          <p className="text-[11px] text-slate-400">{l.address}</p>
        </div>
      ),
    },
    {
      key: 'total',
      label: 'Customers',
      render: (l) => (
        <span className="tabular-nums text-xs">
          <strong className="text-slate-900">{l.stats.totalCustomers}</strong>{' '}
          <span className="text-slate-400">({l.stats.activeCustomers} active)</span>
        </span>
      ),
    },
    {
      key: 'billing',
      label: `${MONTH_NAMES[selectedMonthIdx].slice(0, 3)} Paid / Unpaid`,
      render: (l) => (
        <span className="tabular-nums text-xs font-semibold">
          <span className="text-emerald-700">{l.stats.paidCount}</span>
          <span className="mx-1 text-slate-300">/</span>
          <span className={l.stats.unpaidCount > 0 ? 'text-amber-600' : 'text-slate-400'}>
            {l.stats.unpaidCount}
          </span>
        </span>
      ),
    },
    {
      key: 'issues',
      label: 'Connection Issues',
      render: (l) =>
        l.stats.ongoingIssues > 0 ? (
          <StatusBadge
            status="Ongoing"
            label={`${l.stats.ongoingIssues} Ongoing`}
            size="xs"
          />
        ) : (
          <StatusBadge status="Connected" label="Operational" size="xs" />
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (l) => <StatusBadge status={l.status} size="xs" />,
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (l) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Link
            to={`/locations/${l.location_id}`}
            className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
          >
            Manage
          </Link>
          <button
            type="button"
            onClick={() => handleOpenEdit(l)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title="Edit Location"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setArchiveTarget(l)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title={l.status === 'Active' ? 'Archive Location' : 'Reactivate'}
          >
            {l.status === 'Active' ? (
              <Archive className="h-3.5 w-3.5" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Locations</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage service areas and organize your customers.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" />
          Add Location
        </button>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search locations..."
            className="w-full sm:w-72"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Archived</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Billing period:</span>
            <select
              value={selectedMonthIdx}
              onChange={(e) => setSelectedMonthIdx(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`rounded-md p-1.5 transition ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={`rounded-md p-1.5 transition ${
                viewMode === 'list'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or List View */}
      {enrichedLocations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-14 text-center">
          <MapPin className="h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-800">No service locations found</p>
          <p className="mt-1 text-xs text-slate-500">
            Add a new service area or adjust your search query.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {enrichedLocations.map((loc) => (
            <LocationCard
              key={loc.location_id}
              location={loc}
              stats={loc.stats}
              onEdit={handleOpenEdit}
              onToggleArchive={(target) => setArchiveTarget(target)}
            />
          ))}
        </div>
      ) : (
        <DataTable
          columns={listColumns}
          data={enrichedLocations}
          keyField="location_id"
          onRowClick={(l) => navigate(`/locations/${l.location_id}`)}
        />
      )}

      <LocationForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmitForm}
        initialData={editingLocation}
      />

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => archiveTarget && toggleLocationStatus(archiveTarget.location_id)}
        variant={archiveTarget?.status === 'Active' ? 'danger' : 'success'}
        title={archiveTarget?.status === 'Active' ? 'Archive Location?' : 'Reactivate Location?'}
        confirmLabel={archiveTarget?.status === 'Active' ? 'Archive Location' : 'Reactivate'}
        message={
          archiveTarget?.status === 'Active'
            ? `Archiving "${archiveTarget?.location_name}" marks it as Inactive while preserving all existing customers and historical billing records.`
            : `Reactivating "${archiveTarget?.location_name}" restores it as an active service area.`
        }
      />
    </div>
  );
}
