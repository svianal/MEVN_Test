<template>
  <div class="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
    <h2 class="text-xl font-semibold mb-4">
      {{ isEditMode ? 'Editar Cita' : 'Nueva Cita' }}
    </h2>

    <!-- Alertas -->
    <div
      v-if="alert.message"
      :class="[
        'mb-4 p-3 rounded',
        alert.type === 'error'
          ? 'bg-red-100 text-red-700'
          : 'bg-green-100 text-green-700',
      ]"
    >
      {{ alert.message }}
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Paciente -->
      <div>
        <label class="block text-sm font-medium mb-1">Paciente</label>
        <input
          type="text"
          v-model="form.patientName"
          @input="validateField('patientName')"
          :class="inputClass"
        />
        <p v-if="errors.patientName" class="text-red-600 text-sm mt-1">
          {{ errors.patientName }}
        </p>
      </div>

      <!-- Doctor -->
      <div>
        <label class="block text-sm font-medium mb-1">Doctor</label>
        <input
          type="text"
          v-model="form.doctorName"
          @input="validateField('doctorName')"
          list="doctors-list"
          :class="inputClass"
          placeholder="Seleccionar o escribir doctor"
        />
        <datalist id="doctors-list">
          <option v-for="doc in doctors" :key="doc" :value="doc" />
        </datalist>
        <p v-if="errors.doctorName" class="text-red-600 text-sm mt-1">
          {{ errors.doctorName }}
        </p>
      </div>

      <!-- Fecha -->
      <div>
        <label class="block text-sm font-medium mb-1">Fecha</label>
        <input
          type="date"
          v-model="form.date"
          @change="validateField('date')"
          :min="today"
          :class="inputClass"
        />
        <p v-if="errors.date" class="text-red-600 text-sm mt-1">
          {{ errors.date }}
        </p>
      </div>

      <!-- Hora inicio -->
      <div>
        <label class="block text-sm font-medium mb-1">Hora inicio</label>
        <input
          type="time"
          v-model="form.startTime"
          @change="validateField('startTime')"
          :class="inputClass"
        />
        <p v-if="errors.startTime" class="text-red-600 text-sm mt-1">
          {{ errors.startTime }}
        </p>
      </div>

      <!-- Hora fin -->
      <div>
        <label class="block text-sm font-medium mb-1">Hora fin</label>
        <input
          type="time"
          v-model="form.endTime"
          @change="validateField('endTime')"
          :class="inputClass"
        />
        <p v-if="errors.endTime" class="text-red-600 text-sm mt-1">
          {{ errors.endTime }}
        </p>
      </div>

      <!-- Motivo -->
      <div>
        <label class="block text-sm font-medium mb-1">Motivo</label>
        <textarea
          v-model="form.reason"
          @input="validateField('reason')"
          rows="3"
          :class="[inputClass, 'resize-none']"
        ></textarea>
        <p v-if="errors.reason" class="text-red-600 text-sm mt-1">
          {{ errors.reason }}
        </p>
      </div>

      <!-- Estado -->
      <div>
        <label class="block text-sm font-medium mb-1">Estado</label>
        <select
          v-model="form.status"
          @change="validateField('status')"
          :class="inputClass"
        >
          <option value="">Seleccionar estado</option>
          <option value="scheduled">Programada</option>
          <option value="completed">Completada</option>
          <option value="cancelled">Cancelada</option>
        </select>
        <p v-if="errors.status" class="text-red-600 text-sm mt-1">
          {{ errors.status }}
        </p>
      </div>

      <!-- Botones -->
      <div class="flex justify-end space-x-3 mt-4">
        <button
          type="button"
          @click="cancel"
          class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {{ isEditMode ? 'Actualizar' : 'Guardar' }}
        </button>
      </div>
    </form>

    <!-- Modal conflictos -->
    <ConflictAlert
      v-if="showConflictModal"
      :conflicts="conflicts"
      @cancel="showConflictModal = false"
      @view="viewConflictAppointment"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import ConflictAlert from './ConflictAlert.vue'
import {
  createAppointment,
  updateAppointment,
} from '@/services/appointmentsService'

const props = defineProps({
  appointment: { type: Object, default: null },
})

const emit = defineEmits(['saved', 'cancel'])

const isEditMode = ref(!!props.appointment)
const doctors = ref(['Dr. Pérez', 'Dr. García', 'Dr. López'])

const today = ref(new Date().toISOString().split('T')[0])

const form = reactive({
  patientName: '',
  doctorName: '',
  date: '',
  startTime: '',
  endTime: '',
  reason: '',
  status: 'scheduled',
})

const errors = reactive({})
const alert = reactive({ message: '', type: 'error' })

const inputClass =
  'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

// Conflictos
const conflicts = ref([])
const showConflictModal = ref(false)

onMounted(() => {
  if (isEditMode.value && props.appointment) {
    Object.assign(form, props.appointment)
  }
})

const validateField = (field) => {
  switch (field) {
    case 'patientName':
      errors.patientName = form.patientName ? '' : 'El nombre del paciente es obligatorio'
      break
    case 'doctorName':
      errors.doctorName = form.doctorName ? '' : 'El doctor es obligatorio'
      break
    case 'date':
      if (!form.date) errors.date = 'La fecha es obligatoria'
      else if (form.date < today.value) errors.date = 'No se puede seleccionar una fecha pasada'
      else errors.date = ''
      break
    case 'startTime':
      errors.startTime = form.startTime ? '' : 'Hora inicio obligatoria'
      if (form.startTime && form.endTime && form.startTime >= form.endTime)
        errors.startTime = 'Hora inicio debe ser menor que hora fin'
      break
    case 'endTime':
      errors.endTime = form.endTime ? '' : 'Hora fin obligatoria'
      if (form.startTime && form.endTime && form.startTime >= form.endTime)
        errors.endTime = 'Hora fin debe ser mayor que hora inicio'
      break
    case 'reason':
      errors.reason = form.reason ? '' : 'El motivo es obligatorio'
      break
    case 'status':
      errors.status = form.status ? '' : 'El estado es obligatorio'
      break
  }
}

const validateForm = () => {
  ;['patientName', 'doctorName', 'date', 'startTime', 'endTime', 'reason', 'status'].forEach(validateField)
  return Object.values(errors).every(e => !e)
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    let response

    if (isEditMode.value) {
      response = await updateAppointment(form._id, form)
    } else {
      response = await createAppointment(form)
    }

    alert.message = isEditMode.value ? 'Cita actualizada' : 'Cita creada'
    alert.type = 'success'
    emit('saved', response.data)
  } catch (error) {
    if (error.response?.status === 409) {
      conflicts.value = error.response.data.conflicts || []
      showConflictModal.value = true
      return
    }
    alert.message = 'Error al guardar la cita'
    alert.type = 'error'
  }
}

const cancel = () => emit('cancel')

const viewConflictAppointment = (appointment) => {
  showConflictModal.value = false
  emit('saved', appointment)
}
</script>
