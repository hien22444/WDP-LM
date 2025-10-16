import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";

const client = axios.create({ baseURL: API_BASE_URL, withCredentials: true });
client.interceptors.request.use((config) => {
  const accessToken = Cookies.get("accessToken");
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

export const getMyTutorProfile = async () => {
  const res = await client.get(`/tutors/me`);
  return res.data.profile;
};

export const updateTutorBasic = async (payload) => {
  const res = await client.patch(`/tutors/me/basic`, payload);
  return res.data.profile;
};

export const updateTutorExpertise = async (payload) => {
  const res = await client.patch(`/tutors/me/expertise`, payload);
  return res.data.profile;
};

export const updateTutorPreferences = async (payload) => {
  const res = await client.patch(`/tutors/me/preferences`, payload);
  return res.data.profile;
};

export const saveAvailability = async (availability) => {
  const res = await client.put(`/tutors/me/availability`, { availability });
  return res.data.profile;
};

export const submitTutorProfile = async () => {
  const res = await client.post(`/tutors/me/submit`, {});
  return res.data;
};

export const uploadIdDocuments = async (files) => {
  const form = new FormData();
  for (const f of files) form.append('files', f);
  const res = await client.post(`/tutors/me/upload-id`, form);
  return res.data;
};

export const uploadDegreeDocuments = async (files) => {
  const form = new FormData();
  for (const f of files) form.append('files', f);
  const res = await client.post(`/tutors/me/upload-degree`, form);
  return res.data;
};

export const searchTutors = async (params = {}) => {
  const res = await client.get(`/tutors/search`, { params });
  return res.data;
};

export const getTutorCourses = async (tutorId) => {
  const res = await client.get(`/tutors/${tutorId}/courses`);
  return res.data;
};

const tutorService = {
  getMyTutorProfile,
  updateTutorBasic,
  updateTutorExpertise,
  updateTutorPreferences,
  saveAvailability,
  submitTutorProfile,
  uploadIdDocuments,
  uploadDegreeDocuments,
  searchTutors,
  getTutorCourses
};

export default tutorService;


