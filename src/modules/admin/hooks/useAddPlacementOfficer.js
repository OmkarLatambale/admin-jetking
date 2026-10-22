import { useEffect, useMemo, useState } from "react";
import { placementOfficerService } from "../services/placementOfficerService";

const initialForm = {
  officerName: "",
  email: "",
  phoneNumber: "",
  centerId: "",
};

export const useAddPlacementOfficer = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const [centers, setCenters] = useState([]);
  const [placementOfficers, setPlacementOfficers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [centersLoading, setCentersLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedCenterFilter, setSelectedCenterFilter] = useState("");

  const [showSuccess, setShowSuccess] = useState("");
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const newErrors = {};

    if (!form.officerName.trim()) {
      newErrors.officerName = "Placement officer name is required.";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!form.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required.";
    } else if (!/^\d{10}$/.test(form.phoneNumber)) {
      newErrors.phoneNumber = "Phone number must be 10 digits.";
    }

    if (!form.centerId) {
      newErrors.centerId = "Center is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const loadCenters = async () => {
    try {
      setCentersLoading(true);
      setApiError("");

      const data = await placementOfficerService.getCenters();
      setCenters(Array.isArray(data) ? data : []);
    } catch (error) {
      setApiError(error?.response?.data?.message || "Failed to load centers.");
    } finally {
      setCentersLoading(false);
    }
  };

  const loadPlacementOfficers = async () => {
    try {
      setListLoading(true);
      setApiError("");

      const response = await placementOfficerService.getPlacementOfficers();

      const normalizedList = Array.isArray(response?.data)
        ? response.data.map((officer) => ({
            id: officer.id,
            name: officer.name,
            email: officer.email,
            mobile_no: officer.mobile_no,
            role: officer.role,
            center_id: officer.center_id,
            center: officer.center_name,
            created_at: officer.created_at,
          }))
        : [];

      setPlacementOfficers(normalizedList);
    } catch (error) {
      setApiError(
        error?.response?.data?.message ||
          "Failed to load placement officers."
      );
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadCenters();
    loadPlacementOfficers();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

    if (apiError) {
      setApiError("");
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      name: form.officerName.trim(),
      email: form.email.trim(),
      mobile_no: form.phoneNumber,
      center_fk: Number(form.centerId),
    };

    try {
      setLoading(true);
      setApiError("");
      setShowSuccess("");

      const response =
        await placementOfficerService.createPlacementOfficer(payload);

      setShowSuccess(
        response?.message || "Placement officer created successfully."
      );

      resetForm();

      await loadPlacementOfficers();

      setTimeout(() => {
        setShowSuccess("");
      }, 3000);
    } catch (error) {
      const backendErrors = error?.response?.data?.error;

      if (backendErrors && typeof backendErrors === "object") {
        const errorMessages = Object.values(backendErrors).flat().join(" ");
        setApiError(errorMessages || "Failed to create placement officer.");
      } else {
        setApiError(
          error?.response?.data?.message ||
            "Failed to create placement officer."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredPlacementOfficers = useMemo(() => {
    return placementOfficers.filter((officer) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        !search ||
        officer?.name?.toLowerCase().includes(searchText) ||
        officer?.email?.toLowerCase().includes(searchText) ||
        officer?.mobile_no?.toLowerCase?.().includes(searchText);

      const matchesCenter =
        !selectedCenterFilter ||
        String(officer?.center_id) === String(selectedCenterFilter);

      return matchesSearch && matchesCenter;
    });
  }, [placementOfficers, search, selectedCenterFilter]);

  const addNewCenterToDropdown = (newCenter) => {
    if (!newCenter?.id) return;

    setCenters((prev) => {
      const centerAlreadyExists = prev.some(
        (center) => String(center.id) === String(newCenter.id)
      );

      if (centerAlreadyExists) return prev;

      return [...prev, newCenter];
    });

    setForm((prev) => ({
      ...prev,
      centerId: String(newCenter.id),
    }));

    if (errors.centerId) {
      setErrors((prev) => ({
        ...prev,
        centerId: "",
      }));
    }
  };

  return {
    form,
    errors,

    centers,
    placementOfficers: filteredPlacementOfficers,

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
  };
};
