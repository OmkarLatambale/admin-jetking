import React, { useState } from "react";
import {
  CirclePlus,
  Search,
  UserPlus,
  Mail,
  Phone,
  Building2,
  X,
} from "lucide-react";
import { useAddTrainer } from "../hooks/useAddTrainer";
import { useAddCenter } from "../hooks/useAddCenter";

const AddTrainer = () => {
  const {
    form,
    errors,
    centers,
    trainers,

    loading,
    listLoading,
    centersLoading,

    search,
    setSearch,
    selectedCenterFilter,
    setSelectedCenterFilter,
    addNewCenterToDropdown,

    showSuccess,
    apiError,

    handleChange,
    handleSubmit,
  } = useAddTrainer();

  const [showCenterModal, setShowCenterModal] = useState(false);

  const {
    centerForm,
    centerErrors,
    centerLoading,
    centerApiError,
    centerSuccess,
    handleCenterChange,
    handleCreateCenter,
    resetCenterForm,
  } = useAddCenter({
    onCenterCreated: (newCenter) => {
      addNewCenterToDropdown(newCenter);
      setShowCenterModal(false);
    },
  });

  const closeCenterModal = () => {
    setShowCenterModal(false);
    resetCenterForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-[#f5f1ff]">
            Academic Head and Center Management
          </h1>
          <p className="text-xs text-[#b9b0d2]">
            Create Academic Head accounts, add centers and manage their access.
          </p>
        </div>

        {(showSuccess || apiError) && (
          <div className="mb-6 space-y-3">
            {showSuccess && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {showSuccess}
              </div>
            )}
            {apiError && (
              <div className="rounded-xl border border-red-200 bg-[#191427] px-4 py-3 text-sm text-red-700">
                {apiError}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1.4fr]">
          {/* Create Trainer Form */}
          <div className="rounded-2xl border border-[#3b3052] bg-[#191426]/95 p-6 shadow-[0_18px_48px_rgba(3,2,8,0.45)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-[#221a34] p-3">
                <CirclePlus className="h-5 w-5 text-[#b9b0d2]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#f5f1ff]">
                  Add Academic Head
                </h2>
                <p className="text-xs text-[#b9b0d2]">
                  Create a Academic Head with center-restricted access.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#b9b0d2]">
                  Head Name
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9f8bc8]" />
                  <input
                    type="text"
                    value={form.trainerName}
                    onChange={(e) =>
                      handleChange("trainerName", e.target.value)
                    }
                    placeholder="Enter head's name"
                    className="w-full rounded-xl border border-[#483b63] bg-[#191427] py-3 pl-10 pr-4 text-sm text-[#f5f1ff] outline-none transition focus:border-[#b89cff] focus:ring-2 focus:ring-[#302647]"
                  />
                </div>
                {errors.trainerName && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.trainerName}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#b9b0d2]">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9f8bc8]" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="Enter unique email"
                    className="w-full rounded-xl border border-[#483b63] bg-[#191427] py-3 pl-10 pr-4 text-sm text-[#f5f1ff] outline-none transition focus:border-[#b89cff] focus:ring-2 focus:ring-[#302647]"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#b9b0d2]">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9f8bc8]" />
                  <input
                    type="text"
                    value={form.phoneNumber}
                    onChange={(e) =>
                      handleChange(
                        "phoneNumber",
                        e.target.value.replace(/\D/g, "").slice(0, 10),
                      )
                    }
                    placeholder="Enter 10-digit phone number"
                    className="w-full rounded-xl border border-[#483b63] bg-[#191427] py-3 pl-10 pr-4 text-sm text-[#f5f1ff] outline-none transition focus:border-[#b89cff] focus:ring-2 focus:ring-[#302647]"
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-[#b9b0d2]">
                    Center / Location
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowCenterModal(true)}
                    className="rounded-lg border border-[#483b63] bg-[#221a34] px-3 py-1.5 text-xs font-semibold text-[#b9b0d2] transition hover:bg-[#302647]"
                  >
                    + Add Center
                  </button>
                </div>

                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9f8bc8]" />
                  <select
                    value={form.centerId}
                    onChange={(e) => handleChange("centerId", e.target.value)}
                    className="w-full appearance-none rounded-xl border border-[#483b63] bg-[#191427] py-3 pl-10 pr-4 text-sm text-[#f5f1ff] outline-none transition focus:border-[#b89cff] focus:ring-2 focus:ring-[#302647]"
                  >
                    <option value="">
                      {centersLoading ? "Loading centers..." : "Select center"}
                    </option>

                    {centers.map((center) => (
                      <option key={center.id} value={center.id}>
                        {center.name}{" "}
                        {center.location ? `- ${center.location}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="mt-1 text-xs text-[#9487b8]">
                  If the center is not available, click Add Center to create it.
                </p>

                {errors.centerId && (
                  <p className="mt-1 text-xs text-red-600">{errors.centerId}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#8d73ea] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a88fff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Saving Head..." : "Save Head"}
              </button>
            </form>
          </div>

          {/* Trainer List */}
          <div className="rounded-2xl border border-[#3b3052] bg-[#191426]/95 p-6 shadow-[0_18px_48px_rgba(3,2,8,0.45)]">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#f5f1ff]">
                  Existing Head's
                </h2>
                <p className="text-xs text-[#b9b0d2]">
                  Search and filter head accounts by name or email.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9f8bc8]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search heads"
                    className="w-full rounded-xl border border-[#483b63] bg-[#191427] py-2.5 pl-10 pr-4 text-sm text-[#f5f1ff] outline-none focus:border-[#b89cff] focus:ring-2 focus:ring-[#302647]"
                  />
                </div>

                <select
                  value={selectedCenterFilter}
                  onChange={(e) => setSelectedCenterFilter(e.target.value)}
                  className="w-full rounded-xl border border-[#483b63] bg-[#191427] px-4 py-2.5 text-sm text-[#f5f1ff] outline-none focus:border-[#b89cff] focus:ring-2 focus:ring-[#302647]"
                >
                  <option value="">All Centers</option>
                  {centers.map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#3b3052]">
              <div className="max-h-[520px] overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-[#8d73ea] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">
                        Head Name
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Center
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {listLoading ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-10 text-center text-[#b9b0d2]"
                        >
                          Loading trainers...
                        </td>
                      </tr>
                    ) : trainers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-10 text-center text-[#b9b0d2]"
                        >
                          No trainers found.
                        </td>
                      </tr>
                    ) : (
                      trainers.map((trainer, index) => (
                        <tr
                          key={trainer.id}
                          className={`${
                            index % 2 === 0 ? "bg-[#1b1527]" : "bg-[#261d39]"
                          } transition hover:bg-[#0f0b19]`}
                        >
                          <td className="px-4 py-3 text-[#f5f1ff]">
                            {trainer.name || "-"}
                          </td>
                          <td className="px-4 py-3 text-[#b9b0d2]">
                            {trainer.email || "-"}
                          </td>
                          <td className="px-4 py-3 text-[#b9b0d2]">
                            {trainer.center || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showCenterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#3b3052] bg-[#1b1527] p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#f5f1ff]">
                  Add New Center
                </h2>
                <p className="mt-1 text-sm text-[#b9b0d2]">
                  Create a center and it will be added to the head's center dropdown.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCenterModal}
                className="rounded-lg bg-[#191427] p-2 text-[#b9b0d2] transition hover:bg-[#221a34]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {(centerSuccess || centerApiError) && (
              <div className="mb-4 space-y-2">
                {centerSuccess && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {centerSuccess}
                  </div>
                )}

                {centerApiError && (
                  <div className="rounded-xl border border-red-200 bg-[#191427] px-4 py-3 text-sm text-red-700">
                    {centerApiError}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleCreateCenter} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#b9b0d2]">
                  Center Name
                </label>
                <input
                  type="text"
                  value={centerForm.name}
                  onChange={(e) => handleCenterChange("name", e.target.value)}
                  placeholder="Example: Pune"
                  className="w-full rounded-xl border border-[#483b63] bg-[#191427] px-4 py-3 text-sm text-[#f5f1ff] outline-none transition focus:border-[#b89cff] focus:ring-2 focus:ring-[#302647]"
                />
                {centerErrors.name && (
                  <p className="mt-1 text-xs text-red-600">
                    {centerErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#b9b0d2]">
                  Location
                </label>
                <input
                  type="text"
                  value={centerForm.location}
                  onChange={(e) =>
                    handleCenterChange("location", e.target.value)
                  }
                  placeholder="Example: Maharashtra"
                  className="w-full rounded-xl border border-[#483b63] bg-[#191427] px-4 py-3 text-sm text-[#f5f1ff] outline-none transition focus:border-[#b89cff] focus:ring-2 focus:ring-[#302647]"
                />
                {centerErrors.location && (
                  <p className="mt-1 text-xs text-red-600">
                    {centerErrors.location}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCenterModal}
                  className="rounded-xl border border-[#483b63] bg-[#1b1527] px-4 py-2.5 text-sm font-semibold text-[#b9b0d2] transition hover:bg-[#191427]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={centerLoading}
                  className="rounded-xl bg-[#8d73ea] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a88fff] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {centerLoading ? "Saving..." : "Save Center"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddTrainer;
