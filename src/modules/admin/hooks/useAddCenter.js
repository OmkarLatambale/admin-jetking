import { useState } from "react";
import { addCenterService } from "../services/addCenterService";

const initialCenterForm = {
  name: "",
  location: "",
};

export const useAddCenter = ({ onCenterCreated } = {}) => {
  const [centerForm, setCenterForm] = useState(initialCenterForm);
  const [centerErrors, setCenterErrors] = useState({});
  const [centerLoading, setCenterLoading] = useState(false);
  const [centerApiError, setCenterApiError] = useState("");
  const [centerSuccess, setCenterSuccess] = useState("");

  const validateCenter = () => {
    const newErrors = {};

    if (!centerForm.name.trim()) {
      newErrors.name = "Center name is required.";
    }

    if (!centerForm.location.trim()) {
      newErrors.location = "Location is required.";
    }

    setCenterErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCenterChange = (field, value) => {
    setCenterForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (centerErrors[field]) {
      setCenterErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

    if (centerApiError) {
      setCenterApiError("");
    }
  };

  const resetCenterForm = () => {
    setCenterForm(initialCenterForm);
    setCenterErrors({});
    setCenterApiError("");
  };

  const handleCreateCenter = async (e) => {
    e.preventDefault();

    if (!validateCenter()) return;

    const payload = {
      name: centerForm.name.trim(),
      location: centerForm.location.trim(),
    };

    try {
      setCenterLoading(true);
      setCenterApiError("");
      setCenterSuccess("");

      const response = await addCenterService.createCenter(payload);

      const createdCenter = response?.center;

      if (!createdCenter?.id) {
        throw new Error("Invalid center response.");
      }

      setCenterSuccess(response?.message || "Center created successfully.");

      if (typeof onCenterCreated === "function") {
        onCenterCreated(createdCenter);
      }

      resetCenterForm();

      setTimeout(() => {
        setCenterSuccess("");
      }, 3000);
    } catch (error) {
      const backendError =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to create center.";

      if (typeof backendError === "object") {
        const errorMessages = Object.values(backendError).flat().join(" ");
        setCenterApiError(errorMessages || "Failed to create center.");
      } else {
        setCenterApiError(backendError);
      }
    } finally {
      setCenterLoading(false);
    }
  };

  return {
    centerForm,
    centerErrors,
    centerLoading,
    centerApiError,
    centerSuccess,

    handleCenterChange,
    handleCreateCenter,
    resetCenterForm,
  };
};