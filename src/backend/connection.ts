import axios from "axios";

export const baseConn = axios.create({
   baseURL: process.env.NEXT_PUBLIC_BASEURL,
});
