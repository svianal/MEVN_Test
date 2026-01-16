<template>
  <div
    v-if="conflicts.length"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div class="bg-white rounded-lg shadow-lg w-11/12 md:w-2/3 p-6 relative">
      <h3 class="text-xl font-semibold mb-4 text-red-600">Conflictos detectados</h3>
      <p class="mb-4 text-sm text-gray-700">
        La cita que intentas programar se solapa con las siguientes citas existentes:
      </p>

      <div class="overflow-x-auto max-h-96">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Paciente</th>
              <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Doctor</th>
              <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Fecha / Hora</th>
              <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Motivo</th>
              <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Estado</th>
              <th class="px-4 py-2 text-center text-sm font-medium text-gray-700">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="conflict in conflicts" :key="conflict._id">
              <td class="px-4 py-2 text-sm">{{ conflict.patientName }}</td>
              <td class="px-4 py-2 text-sm">{{ conflict.doctorName }}</td>
              <td class="px-4 py-2 text-sm">
                {{ formatDate(conflict.date) }} <br />
                {{ conflict.startTime }} - {{ conflict.endTime }}
              </td>
              <td class="px-4 py-2 text-sm">{{ conflict.reason }}</td>
              <td class="px-4 py-2 text-sm">
                <span
                  :class="['px-2 py-1 rounded-full text-white text-xs font-semibold', statusBadgeClass(conflict.status)]"
                >
                  {{ statusLabel(conflict.status) }}
                </span>
              </td>
              <td class="px-4 py-2 text-center">
                <button
                  @click="$emit('view', conflict)"
                  class="text-blue-600 hover:underline text-sm"
                >
                  Ver
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-end space-x-3 mt-6">
        <button
          @click="$emit('cancel')"
          class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  conflicts: { type: Array, default: () => [] }
});

// Formatear fecha "YYYY-MM-DD" a formato legible
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
};

// Mostrar estado legible
const statusLabel = (status) => {
  switch (status) {
    case 'scheduled': return 'Programada';
    case 'completed': return 'Completada';
    case 'cancelled': return 'Cancelada';
    default: return status;
  }
};

// Clases para los badges de estado
const statusBadgeClass = (status) => {
  switch (status) {
    case 'scheduled': return 'bg-yellow-500';
    case 'completed': return 'bg-green-500';
    case 'cancelled': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};
</script>

<style scoped>
div::-webkit-scrollbar {
  width: 6px;
}
div::-webkit-scrollbar-thumb {
  background-color: rgba(107, 114, 128, 0.5);
  border-radius: 3px;
}
</style>
