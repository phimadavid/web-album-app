import axios from "axios";

export const fetchUsers = async (id: number) => {
   const response = await axios.get(`/api/users?id=${id}`);
   return response.data.data;
};
