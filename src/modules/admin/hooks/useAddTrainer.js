import { useEffect, useMemo, useState } from "react";
import { trainerService } from "../services/trainerService";

const initialForm = {
  trainerName: "",
  email: "",
  phoneNumber: "",
  centerId: "",
};

export const useAddTrainer = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [centers, setCenters] = useState([]);
  const [trainers, setTrainers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [centersLoading, setCentersLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedCenterFilter, setSelectedCenterFilter] = useState("");

  const [showSuccess, setShowSuccess] = useState("");
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const newErrors = {};

    if (!form.trainerName.trim()) {
      newErrors.trainerName = "Trainer name is required.";
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

  const loadTrainers = async () => {
    try {
      setListLoading(true);
      setApiError("");
      const data = await trainerService.getTrainers();
      setTrainers(Array.isArray(data) ? data : []);
    } catch (error) {
      setApiError(
        error?.response?.data?.message || "Failed to load trainers."
      );
    } finally {
      setListLoading(false);
    }
  };

  const loadCenters = async () => {
    try {
      setCentersLoading(true);
      const data = await trainerService.getCenters();
      setCenters(Array.isArray(data) ? data : []);
    } catch (error) {
      setApiError(
        error?.response?.data?.message || "Failed to load centers."
      );
    } finally {
      setCentersLoading(false);
    }
  };

  useEffect(() => {
    loadTrainers();
    loadCenters();
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
  };

  const resetForm = () => {
    setForm(initialForm);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      name: form.trainerName,
      email: form.email,
      mobile_no: form.phoneNumber,
      center_fk: Number(form.centerId),
    };

    try {
      setLoading(true);
      setApiError("");
      setShowSuccess("");

      await trainerService.createTrainer(payload);

      setShowSuccess("Trainer account created successfully.");
      resetForm();
      await loadTrainers();

      setTimeout(() => setShowSuccess(""), 3000);
    } catch (error) {
      const backendErrors = error?.response?.data?.error;

      if (backendErrors) {
        // Convert object errors to readable string
        const errorMessages = Object.values(backendErrors)
          .flat()
          .join(" ");

        setApiError(errorMessages);
      } else {
        setApiError("Failed to create trainer.");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredTrainers = useMemo(() => {
    return trainers.filter((trainer) => {
      const matchesSearch =
        !search ||
        trainer?.name?.toLowerCase().includes(search.toLowerCase()) ||
        trainer?.email?.toLowerCase().includes(search.toLowerCase());

      const matchesCenter =
        !selectedCenterFilter ||
        centers.find(
          (center) =>
            String(center.id) === String(selectedCenterFilter) &&
            center.name === trainer.center
        );

      return matchesSearch && matchesCenter;
    });
  }, [trainers, search, selectedCenterFilter, centers]);

  const addNewCenterToDropdown = (newCenter) => {
    if (!newCenter?.id) return;

    setCenters((prev) => {
      const alreadyExists = prev.some(
        (center) => String(center.id) === String(newCenter.id)
      );

      if (alreadyExists) return prev;

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
    trainers: filteredTrainers,

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