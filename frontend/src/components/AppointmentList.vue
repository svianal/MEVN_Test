<template>
  <div class="p-6 bg-white rounded-lg shadow-md">
    <!-- Encabezado -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">Lista de Citas</h2>
      <button
        @click="openFormModal()"
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Nueva Cita
      </button>
    </div>

    <!-- Filtros -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      <div>
        <label class="block text-sm font-medium mb-1">Desde:</label>
        <input type="date" v-model="filters.startDate" :class="inputClass" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Hasta:</label>
        <input type="date" v-model="filters.endDate" :class="inputClass" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Doctor:</label>
        <select v-model="filters.doctorName" :class="inputClass">
          <option value="">Todos</option>
          <option v-for="doc in doctors" :key="doc" :value="doc">{{ doc }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Estado:</label>
        <select v-model="filters.status" :class="inputClass">
          <option value="">Todos</option>
          <option value="scheduled">Programada</option>
          <option value="completed">Completada</option>
          <option value="cancelled">Cancelada</option>
        </select>
      </div>
    </div>

    <!-- Tabla -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Paciente</th>
            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Doctor</th>
            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Fecha</th>
            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Hora</th>
            <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Estado</th>
            <th class="px-4 py-2 text-center text-sm font-medium text-gray-700">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="appointment in paginatedAppointments" :key="appointment._id">
            <td class="px-4 py-2 text-sm">{{ appointment.patientName }}</td>
            <td class="px-4 py-2 text-sm">{{ appointment.doctorName }}</td>
            <td class="px-4 py-2 text-sm">{{ formatDate(appointment.date) }}</td>
            <td class="px-4 py-2 text-sm">{{ appointment.startTime }} - {{ appointment.endTime }}</td>
            <td class="px-4 py-2 text-sm">
              <span
                :class="['px-2 py-1 rounded-full text-white text-xs font-semibold', statusBadgeClass(appointment.status)]"
              >
                {{ statusLabel(appointment.status) }}
              </span>
            </td>
            <td class="px-4 py-2 text-center space-x-2">
              <button @click="openViewModal(appointment._id)" class="text-blue-600 hover:underline">Ver</button>
              <button @click="openFormModal(appointment)" class="text-green-600 hover:underline">Editar</button>
              <button @click="handleDelete(appointment._id)" class="text-red-600 hover:underline">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Ver -->
    <div v-if="viewModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white rounded-lg shadow-lg w-11/12 md:w-1/2 p-6 relative">
        <button @click="viewModalOpen = false" class="absolute top-3 right-3">X</button>

        <h3 class="text-xl font-semibold mb-4">Detalle de la Cita</h3>

        <div v-if="selectedAppointment" class="space-y-2 text-sm">
          <p><strong>Paciente:</strong> {{ selectedAppointment.patientName }}</p>
          <p><strong>Doctor:</strong> {{ selectedAppointment.doctorName }}</p>
          <p><strong>Fecha:</strong> {{ formatDate(selectedAppointment.date) }}</p>
          <p><strong>Hora:</strong> {{ selectedAppointment.startTime }} - {{ selectedAppointment.endTime }}</p>
          <p><strong>Motivo:</strong> {{ selectedAppointment.reason }}</p>
          <p><strong>Estado:</strong> {{ statusLabel(selectedAppointment.status) }}</p>
        </div>
      </div>
    </div>

    <!-- Modal crear / editar -->
    <div v-if="formModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white rounded-lg shadow-lg w-11/12 md:w-1/2 p-6 relative">
        <button @click="closeFormModal" class="absolute top-3 right-3">X</button>
        <AppointmentForm
          :appointment="formAppointment"
          @saved="onFormSaved"
          @cancel="closeFormModal"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import AppointmentForm from './AppointmentForm.vue'
import {
  getAppointments,
  getAppointmentById,
  deleteAppointment
} from '@/services/appointmentsService'

const appointments = ref([])
const doctors = ref([])
const filters = ref({ startDate: '', endDate: '', doctorName: '', status: '' })

const formModalOpen = ref(false)
const formAppointment = ref(null)

const viewModalOpen = ref(false)
const selectedAppointment = ref(null)

const currentPage = ref(1)
const itemsPerPage = ref(10)

const fetchAppointments = async () => {
  const { data } = await getAppointments()
  appointments.value = data
  doctors.value = [...new Set(data.map(a => a.doctorName))]
}

const openViewModal = async (id) => {
  const { data } = await getAppointmentById(id)
  selectedAppointment.value = data
  viewModalOpen.value = true
}

const openFormModal = (appointment = null) => {
  formAppointment.value = appointment
  formModalOpen.value = true
}

const closeFormModal = () => {
  formModalOpen.value = false
  formAppointment.value = null
}

const onFormSaved = async () => {
  await fetchAppointments()
  closeFormModal()
}

const handleDelete = async (id) => {
  if (!confirm('¿Eliminar esta cita?')) return
  await deleteAppointment(id)
  await fetchAppointments()
}

const filteredAppointments = computed(() =>
  appointments.value.filter(a =>
    (!filters.value.startDate || a.date >= filters.value.startDate) &&
    (!filters.value.endDate || a.date <= filters.value.endDate) &&
    (!filters.value.doctorName || a.doctorName === filters.value.doctorName) &&
    (!filters.value.status || a.status === filters.value.status)
  )
)

const paginatedAppointments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredAppointments.value.slice(start, start + itemsPerPage.value)
})

watch(filters, () => (currentPage.value = 1), { deep: true })

const formatDate = d => d ? d.split('-').reverse().join('/') : ''

const statusLabel = s =>
  s === 'scheduled' ? 'Programada' :
  s === 'completed' ? 'Completada' :
  s === 'cancelled' ? 'Cancelada' : s

const statusBadgeClass = s =>
  s === 'scheduled' ? 'bg-yellow-500' :
  s === 'completed' ? 'bg-green-500' :
  s === 'cancelled' ? 'bg-red-500' : 'bg-gray-500'

onMounted(fetchAppointments)
</script>
