<template>
  <Transition name="jmodal">
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
      <slot />
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])
</script>
