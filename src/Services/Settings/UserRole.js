/** @format */

import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/roles`;

// Utility to get access token from cookies
const getToken = () =>
  document.cookie
    .split("; ")
    .find((row) => row.startsWith("accessToken="))
    ?.split("=")[1];

export const fetchAllUserRoles = async (page = 1) => {
  const accessToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("accessToken="))
    ?.split("=")[1];

  const res = await axios.get(`${API_URL}/all`, {
    params: { page },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return res.data;
};

export const deleteNewsFeedById = async (id) => {
  try {
    const accessToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("accessToken="))
      ?.split("=")[1];

    const res = await axios.delete(`${API_URL}/delete/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return res.data;
  } catch (error) {
    console.error("Delete failed:", error);
    return { success: false };
  }
};

export const fetchNewsFeedsByDate = async (from, to) => {
  const accessToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("accessToken="))
    ?.split("=")[1];

  const res = await axios.get(`${API_URL}/search-by-date`, {
    params: { from, to },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return res.data;
};

export const createUserRoles = async (formData) => {
  try {
    const token = getToken();
    const response = await axios.post(`${API_URL}/create-role`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("API Response:", response);
    return response.data;
  } catch (error) {
    console.error("Error creating user role:", error);
    toast.error(`Failed to create user role: ${error.message}`);
    throw error;
  }
};
export const updateUserRoles = async (Id, formData) => {
  try {
    const token = getToken();
    const response = await axios.put(
      `${API_URL}/update/${Id}`, // no trailing slash in API_URL
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("API Response:", response);
    return response.data;
  } catch (error) {
    console.error("Error updating user role:", error.response?.data || error);
    toast.error(`Failed to update user role: ${error.message}`);
    throw error;
  }
};

export const updateUserActiveStatusRoles = async (Id, formData) => {
  try {
    const token = getToken();
    const response = await axios.put(
      `${API_URL}/status/${Id}`, // no trailing slash in API_URL
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("API Response:", response);
    return response.data;
  } catch (error) {
    console.error(
      "Error updating user role Active status:",
      error.response?.data || error
    );
    toast.error(`Failed to update user role Active status: ${error.message}`);
    throw error;
  }
};

export const createUserRolePermissions = async (formData) => {
  try {
    const token = getToken();
    const response = await axios.post(`${API_URL}/add-permissions`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("API Response:", response);
    return response.data;
  } catch (error) {
    console.error("Error creating user role Permission:", error);
    toast.error(`Failed to create user role Permission: ${error.message}`);
    throw error;
  }
};
