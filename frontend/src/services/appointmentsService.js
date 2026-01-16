import axios from 'axios'

const API_URL = 'http://localhost:3000/api/appointments'

export const getAppointments = (params = {}) => {
  return axios.get(API_URL, { params })
}

export const getAppointmentById = (id) => {
  return axios.get(`${API_URL}/${id}`)
}

export const createAppointment = (data) => {
  return axios.post(API_URL, data)
}

export const updateAppointment = (id, data) => {
  return axios.put(`${API_URL}/${id}`, data)
}

export const deleteAppointment = (id) => {
  return axios.delete(`${API_URL}/${id}`)
}
