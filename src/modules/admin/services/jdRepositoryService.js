const API_BASE = import.meta.env.VITE_API_URL;
const API_ORIGIN = new URL(API_BASE).origin;

const getAuthHeaders = (extraHeaders = {}) => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  ...extraHeaders,
});

const parseJsonResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
};

const extractErrorMessage = (payload, fallbackMessage) => {
  if (!payload) return fallbackMessage;

  if (typeof payload.error === "string") return payload.error;
  if (typeof payload.detail === "string") return payload.detail;

  for (const value of Object.values(payload)) {
    if (Array.isArray(value) && value.length > 0) {
      return value[0];
    }
    if (typeof value === "string") {
      return value;
    }
  }

  return fallbackMessage;
};

class JdRepositoryApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "JdRepositoryApiError";
    this.status = status;
  }
}

export const parseJdDocument = async (file) => {
  const formData = new FormData();
  formData.append("jd", file);

  const response = await fetch(`${API_BASE}interviews/parse-jd/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new JdRepositoryApiError(
      extractErrorMessage(payload, "Failed to parse JD document."),
      response.status
    );
  }

  return payload;
};

export const confirmJdDraft = async (jdId, data) => {
  const response = await fetch(`${API_BASE}interviews/job-descriptions/${jdId}/confirm`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new JdRepositoryApiError(
      extractErrorMessage(payload, "Failed to publish JD."),
      response.status
    );
  }

  return payload;
};

export const updateJobDescriptionStatus = async (jdId, status) => {
  const response = await fetch(`${API_BASE}interviews/job-descriptions/${jdId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ status }),
  });

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new JdRepositoryApiError(
      extractErrorMessage(payload, "Failed to update JD status."),
      response.status
    );
  }

  return payload;
};

export const fetchJobDescriptions = async (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  const url = `${API_BASE}interviews/job-descriptions${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new JdRepositoryApiError(
      extractErrorMessage(payload, "Failed to load job descriptions."),
      response.status
    );
  }

  return payload;
};

export const fetchJobDescriptionDetail = async (jdId) => {
  const response = await fetch(`${API_BASE}interviews/job-descriptions/${jdId}`, {
    headers: getAuthHeaders(),
  });

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new JdRepositoryApiError(
      extractErrorMessage(payload, "Failed to load job description."),
      response.status
    );
  }

  return payload;
};

export const fetchJdDocumentBlob = async (documentUrl, download = false) => {
  const suffix = download ? `${documentUrl.includes("?") ? "&" : "?"}download=1` : "";
  const resolvedUrl = documentUrl.startsWith("http")
    ? `${documentUrl}${suffix}`
    : `${API_ORIGIN}${documentUrl}${suffix}`;

  const response = await fetch(resolvedUrl, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const payload = await parseJsonResponse(response);
    throw new JdRepositoryApiError(
      extractErrorMessage(payload, "Failed to open JD document."),
      response.status
    );
  }

  return response.blob();
};

export const scheduleInterviewWithJd = async (payload) => {
  const response = await fetch(`${API_BASE}interviews/schedule`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new JdRepositoryApiError(
      extractErrorMessage(data, "Failed to schedule interview."),
      response.status
    );
  }

  return data;
};
