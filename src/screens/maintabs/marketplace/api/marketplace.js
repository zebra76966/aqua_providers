// api/marketplace.js

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

// GET LISTINGS
export const fetchListings = async (token, params) => {
  const headers = getAuthHeaders(token);

  const query = new URLSearchParams({
    lat: params.lat,
    lon: params.lon,
    radius_km: 1000,
    category: params.category || "all",
  }).toString();

  const res = await fetch(`${baseUrl}/marketplace/listings/?${query}`, {
    method: "GET",
    headers,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch listings");
  return data.data;
};

// GET LISTING DETAILS
export const fetchListingDetails = async (id, token) => {
  const headers = getAuthHeaders(token);
  const res = await fetch(`${baseUrl}/marketplace/listings/${id}/`, {
    method: "GET",
    headers,
  });
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Failed to fetch listing");
  return data.data;
};

// CREATE LISTING (MULTIPART)
export const createListing = async (payload, token) => {
  const { title, description, base_price, category, subcategory, listing_address, lat, lon, thumbnail } = payload;

  const headers = getAuthHeaders(token, true);
  const formData = new FormData();

  formData.append("title", title);
  formData.append("description", description);
  formData.append("base_price", String(base_price));
  formData.append("category", category);
  formData.append("subcategory", subcategory);
  formData.append("listing_address", listing_address);

  if (lat != null) formData.append("lat", String(lat));
  if (lon != null) formData.append("lon", String(lon));

  if (thumbnail) {
    formData.append("thumbnail", {
      uri: thumbnail.uri,
      name: thumbnail.fileName || "thumbnail.jpg",
      type: thumbnail.mimeType || "image/jpeg",
    });
  }

  const res = await fetch(`${baseUrl}/marketplace/listings/create/`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create listing");
  return data;
};

// api/marketplace.js
export const fetchMarketplaceCategories = async (token) => {
  const headers = getAuthHeaders(token);
  const res = await fetch(`${baseUrl}/marketplace/categories/`, {
    method: "GET",
    headers,
  });

  const data = await res.json();
  if (!res.ok) throw new Error("Failed to fetch categories");
  return data.categories;
};

// PLACE BID
export const placeBid = async (listingId, amount, message, token) => {
  const headers = getAuthHeaders(token);
  const res = await fetch(`${baseUrl}/marketplace/listings/${listingId}/bid/`, {
    method: "POST",
    headers,
    body: JSON.stringify({ amount: String(amount), message }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to place bid");
  return data;
};

// GET BIDS
export const fetchBids = async (listingId, token) => {
  const headers = getAuthHeaders(token);
  const res = await fetch(`${baseUrl}/marketplace/listings/${listingId}/bids/`, {
    method: "GET",
    headers,
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Failed to fetch bids");
  return data.data;
};

// ACCEPT BID
export const acceptBid = async (bidId, token) => {
  const headers = getAuthHeaders(token);
  const res = await fetch(`${baseUrl}/marketplace/bids/${bidId}/accept/`, {
    method: "POST",
    headers,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to accept bid");
  return data;
};

// REJECT BID
export const rejectBid = async (bidId, token) => {
  const headers = getAuthHeaders(token);
  const res = await fetch(`${baseUrl}/marketplace/bids/${bidId}/reject/`, {
    method: "POST",
    headers,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to reject bid");
  return data;
};

// ADD THIS FUNCTION
export const fetchMyListings = async (token) => {
  const headers = getAuthHeaders(token);

  const res = await fetch(`${baseUrl}/marketplace/marketplace/listings/mine/`, {
    method: "GET",
    headers,
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Failed to fetch your listings");
  return data.data;
};

export const fetchSellerProfile = async (sellerId, token) => {
  const headers = getAuthHeaders(token);

  const res = await fetch(`${baseUrl}/marketplace/sellers/${sellerId}/profile/`, {
    method: "GET",
    headers,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch seller profile");
  return data.data;
};

export const fetchMySellerProfile = async (token) => {
  const headers = getAuthHeaders(token);

  const res = await fetch(`${baseUrl}/marketplace/sellers/profile/me/`, {
    method: "GET",
    headers,
  });

  const data = await res.json();
  console.log("My Profile", data?.data?.seller_id);
  if (!res.ok) throw new Error(data.message || "Failed to fetch seller profile");
  return data?.data?.seller_id;
};

export const updateMySellerProfile = async (payload, token) => {
  const headers = getAuthHeaders(token, true);

  const formData = new FormData();

  if (payload.expertise_tags) {
    formData.append("expertise_tags", payload.expertise_tags);
  }

  if (payload.profile_video) {
    formData.append("profile_video", {
      uri: payload.profile_video.uri,
      name: payload.profile_video.fileName || "video.mp4",
      type: payload.profile_video.mimeType || "video/mp4",
    });
  }

  const res = await fetch(`${baseUrl}/marketplace/sellers/me/profile/`, {
    method: "PATCH",
    headers,
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update seller profile");
  return data.data;
};

export const createSellerReview = async (sellerId, rating, comment, listingId, token) => {
  const headers = getAuthHeaders(token);

  const body = JSON.stringify({
    rating,
    comment,
    listing_id: listingId,
  });

  const res = await fetch(`${baseUrl}/marketplace/sellers/${sellerId}/reviews/`, {
    method: "POST",
    headers,
    body,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to submit review");

  return data;
};
