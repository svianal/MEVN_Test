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

    <!-- Paginación y selección de registros -->
    <div class="flex justify-between items-center mb-4">
      <!-- Selección de registros por página -->
      <div>
        <label class="text-sm font-medium mr-2">Mostrar:</label>
        <select v-model.number="itemsPerPage" @change="currentPage = 1" :class="inputClass">
          <option value="10">10</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>

      <!-- Paginación -->
      <div class="flex items-center space-x-2 text-sm">
        <button 
          @click="currentPage--" 
          :disabled="currentPage === 1"
          class="px-2 py-1 border rounded disabled:opacity-50"
        >
          Anterior
        </button>

        <span>Página {{ currentPage }} de {{ totalPages }}</span>

        <button 
          @click="currentPage++" 
          :disabled="currentPage === totalPages"
          class="px-2 py-1 border rounded disabled:opacity-50"
        >
          Siguiente
        </button>
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
              <button @click="openViewModal(appointment)" class="text-blue-600 hover:underline">Ver</button>
              <button @click="openFormModal(appointment)" class="text-green-600 hover:underline">Editar</button>
              <button @click="deleteAppointment(appointment._id)" class="text-red-600 hover:underline">Eliminar</button>
            </td>
          </tr>
          <tr v-if="paginatedAppointments.length === 0">
            <td colspan="6" class="text-center py-4 text-gray-500">No hay citas</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal para ver cita -->
    <div v-if="viewModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white rounded-lg shadow-lg w-11/12 md:w-1/2 p-6 relative">
        <button @click="closeViewModal" class="absolute top-3 right-3 text-gray-500 hover:text-gray-700">✖</button>
        <h3 class="text-xl font-semibold mb-4">Detalle de la Cita</h3>
        <div class="space-y-2 text-sm">
          <p><strong>Paciente:</strong> {{ selectedAppointment.patientName }}</p>
          <p><strong>Doctor:</strong> {{ selectedAppointment.doctorName }}</p>
          <p><strong>Fecha:</strong> {{ formatDate(selectedAppointment.date) }}</p>
          <p><strong>Hora:</strong> {{ selectedAppointment.startTime }} - {{ selectedAppointment.endTime }}</p>
          <p><strong>Motivo:</strong> {{ selectedAppointment.reason }}</p>
          <p><strong>Estado:</strong>
            <span :class="['px-2 py-1 rounded-full text-white text-xs font-semibold', statusBadgeClass(selectedAppointment.status)]">
              {{ statusLabel(selectedAppointment.status) }}
            </span>
          </p>
          <p><strong>Creado:</strong> {{ formatDateTime(selectedAppointment.createdAt) }}</p>
          <p><strong>Actualizado:</strong> {{ formatDateTime(selectedAppointment.updatedAt) }}</p>
        </div>
      </div>
    </div>

    <!-- Modal para crear/editar cita -->
    <div v-if="formModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white rounded-lg shadow-lg w-11/12 md:w-1/2 p-6 relative">
        <button @click="closeFormModal" class="absolute top-3 right-3 text-gray-500 hover:text-gray-700">✖</button>
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
import { ref, computed, onMounted, watch } from 'vue';
import AppointmentForm from './AppointmentForm.vue';

const appointments = ref([]);
const filters = ref({ startDate: '', endDate: '', doctorName: '', status: '' });
const doctors = ref([]);

const inputClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

// Modales
const viewModalOpen = ref(false);
const selectedAppointment = ref({});
const formModalOpen = ref(false);
const formAppointment = ref(null);

// Paginación
const currentPage = ref(1);
const itemsPerPage = ref(10);

const fetchAppointments = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/appointments');
    const data = await res.json();
    appointments.value = data;
    doctors.value = [...new Set(data.map(a => a.doctorName))];
  } catch (err) {
    console.error(err);
  }
};

// Filtrado usando strings "YYYY-MM-DD"
const filteredAppointments = computed(() => {
  return appointments.value.filter(a => {
    const start = filters.value.startDate;
    const end = filters.value.endDate;
    const matchesDate = (!start || a.date >= start) && (!end || a.date <= end);
    const matchesDoctor = !filters.value.doctorName || a.doctorName === filters.value.doctorName;
    const matchesStatus = !filters.value.status || a.status === filters.value.status;
    return matchesDate && matchesDoctor && matchesStatus;
  });
});

// Paginación
const paginatedAppointments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredAppointments.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredAppointments.value.length / itemsPerPage.value));
});

// Reset page al cambiar filtros
watch(filters, () => { currentPage.value = 1; }, { deep: true });

const openViewModal = (appointment) => { selectedAppointment.value = appointment; viewModalOpen.value = true; };
const closeViewModal = () => { viewModalOpen.value = false; selectedAppointment.value = {}; };
const openFormModal = (appointment = null) => { formAppointment.value = appointment; formModalOpen.value = true; };
const closeFormModal = () => { formModalOpen.value = false; formAppointment.value = null; };

// Recargar toda la lista al guardar una cita
const onFormSaved = async () => {
  await fetchAppointments(); // <--- recarga la tabla automáticamente
  closeFormModal();
};

// Recargar lista al eliminar
const deleteAppointment = async (id) => {
  if (!confirm('¿Eliminar esta cita?')) return;
  try {
    await fetch(`http://localhost:3000/api/appointments/${id}`, { method: 'DELETE' });
    await fetchAppointments(); // <--- recarga la tabla automáticamente
  } catch (err) {
    console.error(err);
  }
};

// 🔹 Formateo de fechas usando strings
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};
const formatDateTime = (dateStr) => new Date(dateStr).toLocaleString('es-ES', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });

const statusBadgeClass = (status) => {
  switch (status) {
    case 'scheduled': return 'bg-yellow-500';
    case 'completed': return 'bg-green-500';
    case 'cancelled': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};
const statusLabel = (status) => {
  switch (status) {
    case 'scheduled': return 'Programada';
    case 'completed': return 'Completada';
    case 'cancelled': return 'Cancelada';
    default: return status;
  }
};

onMounted(fetchAppointments);
</script>
