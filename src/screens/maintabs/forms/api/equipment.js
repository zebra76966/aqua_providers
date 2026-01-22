import { baseUrl } from "../../../../config";
const getAuthHeaders = (token, isMultipart = false) => {
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

export const fetchEquipmentTypes = async (token) => {
  const res = await fetch(`${baseUrl}/tanks/equipment/types/`, {
    headers: getAuthHeaders(token),
  });

  const data = await res.json();
  console.log("eqp", data?.data?.equipment_types);
  if (!res.ok) throw new Error("Failed to fetch equipment types");
  return data?.data?.equipment_types; // assuming array like ["filter", "heater", ...]
};

export const createEquipment = async (payload, token) => {
  const { tank, equipment_type, equipment_name, brand, wattage, model_number, notes, image } = payload;

  const formData = new FormData();
  formData.append("tank", String(tank));
  formData.append("equipment_type", equipment_type);
  formData.append("equipment_name", equipment_name);
  formData.append("brand", brand);
  formData.append("wattage", wattage);
  formData.append("model_number", model_number);
  formData.append("notes", notes || "");

  if (image) {
    formData.append("image", {
      uri: image.uri,
      name: image.fileName || "equipment.jpg",
      type: image.mimeType || "image/jpeg",
    });
  }

  const res = await fetch(`${baseUrl}/tanks/equipment/create/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to create equipment");
  return data;
};
