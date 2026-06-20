import axios from 'axios';
import { toast } from "react-toastify";

const API_URL = process.env.REACT_APP_FRONTEND_URL;

// Utility to get access token from cookies
const getToken = () =>
  document.cookie.split("; ").find(row => row.startsWith("accessToken="))?.split("=")[1];

const hierarchyService = {
    // getAllBanks: async (page, limit) => {
    //     try {
    //       const response = await axios.get(`${API_URL}/banks?page=${page}&pageSize=${limit}`);
    //       console.log("API Response:", response);
    //       return response.data;
    //     } catch (error) {
    //       console.error("Error fetching data:", error);
    //       toast.error(`Failed to fetch data: ${error.message}`);
    //       throw error;
    //     }
    //   },
  getAllHierarchyCategories: async (page = 1, pageSize = 10) => {
        try {
            const token = getToken();
            let url = `${API_URL}/hierarchy/?page=${page}&pageSize=${pageSize}`; 

            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("API Response:", response);
            return response.data;
        } catch (error) {
            console.error("Error fetching hierarchy:", error);
            toast.error(`Failed to fetch hierarchy: ${error.message}`);
            throw error;
        }
    },

  getHierarchyById: async (id) => {
    try {
        const token = getToken();
      const response = await axios.get(`${API_URL}/hierarchy/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
    });
      console.log("API Response:", response);
      return response.data;
    } catch (error) {
      console.error("Error fetching hierarchy:", error);
      toast.error(`Failed to fetch hierarchy: ${error.message}`);
      throw error;
    }
  },

  createHierarchy: async (category_name) => {
    try {
        const token = getToken();
      const response = await axios.post(`${API_URL}/hierarchy/create`, category_name, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
    });
      console.log("API Response:", response);
      //toast.success("Bank created successfully!");
      return response.data;
    } catch (error) {
      console.error("Error creating Hierarchy :", error);
      toast.error(`Failed to create Hierarchy  : ${error.message}`);
      throw error;
    }
  },

 updateHierarchy: async (id, category_name) => {
    try {
      const token = getToken();
      const response = await axios.put(`${API_URL}/hierarchy/${id}`, category_name, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("API Response:", response);
      return response.data;
    } catch (error) {
      console.error(`Error updating hierarchy ${id}:`, error);
      toast.error(`Failed to update hierarchy: ${error.message}`);
      throw error;
    }
  },

   deleteHierarchy: async (id) => {
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/hierarchy/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error(`Error deleting hierarchy ${id}:`, error);
      toast.error(`Failed to delete hierarchy: ${error.message}`);
      throw error;
    }
  },

  getAllHierarchyAssignments: async (page = 1, pageSize = 10) => {
        try {
            const token = getToken();
            // const response = await axios.get(`${API_URL}/hierarchy/get-hierarchy-assignments?page=${page}&pageSize=${pageSize}`, {
            //     headers: {
            //         Authorization: `Bearer ${token}`,
            //     },
            // });
            const response = await axios.get(`${API_URL}/hierarchy/get-hierarchy-assignments`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch hierarchy assignments');
            }

            console.log("API Response:", response);
            return response.data;
        } catch (error) {
            console.error("Error fetching hierarchy assignments:", error);
            toast.error(`Failed to fetch hierarchy assignments: ${error.message}`)
            throw error;
        }
    },

    getHierarchyByMemberId: async (id) => {
        try {
            const token = getToken();
           
            const response = await axios.get(`${API_URL}/hierarchy/summary/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch hierarchy for member');
            }

            console.log("API Response:", response);
            return response.data;
        } catch (error) {
            console.error("Error fetching hierarchy for member:", error);
            toast.error(`Failed to fetch hierarchy for member: ${error.message}`)
            throw error;
        }
    },

     assignNewHierarchy: async (payload) => {
        try {
            const token = getToken();
            const response = await axios.post(`${API_URL}/hierarchy/assign`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to assign new hierarchy');
            }

            console.log("API Response:", response);
            return response.data;
        } catch (error) {
            console.error("Error assigning new hierarchy:", error);
            toast.error(`Failed to assign new hierarchy: ${error.message}`);
            throw error;
        }
    },
    updateHierarchyAssignment: async (id,payload) => {
        try {
            const token = getToken();
            const response = await axios.put(`${API_URL}/hierarchy/assignment/${id}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update hierarchy');
            }

            console.log("API Response:", response);
            return response.data;
        } catch (error) {
            console.error("Error update hierarchy:", error);
            toast.error(`Failed to update hierarchy: ${error.message}`);
            throw error;
        }
    },

    async getFilteredHierarchyAssignments(params) {
        try {
            const { page = 1, limit = 10, date_from, date_to, hierarchy_name,member_id,branch_district } = params;

            const token =getToken(); // Use this.getToken()
            const logged_user = document.cookie
                .split('; ')
                .find((row) => row.startsWith('username='))
                ?.split('=')[1];

            const logged_user_role = document.cookie
                .split('; ')
                .find((row) => row.startsWith('role='))
                ?.split('=')[1];

            const response = await axios.get(`${API_URL}/hierarchy/getFilteredHierarchyAssignments`, { // Correct URL
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    page, // Add page and limit here
                    limit,
                    logged_user,
                    logged_user_role,
                    date_from,
                    date_to,
                    hierarchy_name,
                    member_id,
                    branch_district
                },
            });

            return response.data;
        } catch (error) {
            console.error('Error fetching filtered hierarchy assignments:', error);
            throw error;
        }
    },

    deleteHierarchyAssignment: async (id) => {
        try {
            const token = getToken();
            const response = await axios.delete(`${API_URL}/hierarchy/delete/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to delete hierarchy');
            }

            console.log("API Response:", response);
            return response.data;
        } catch (error) {
            console.error("Error delete hierarchy:", error);
            toast.error(`Failed to delete hierarchy: ${error.message}`);
            throw error;
        }
    },

};

export default hierarchyService;