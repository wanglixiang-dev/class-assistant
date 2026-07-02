<script setup lang="ts">
defineProps<{
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
}>();

const emit = defineEmits<{
  cancel: [];
  confirm: [];
}>();
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="dialog-backdrop" role="presentation">
      <section class="confirm-dialog" role="dialog" aria-modal="true" :aria-label="title">
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        <div class="dialog-actions">
          <button class="secondary-button" type="button" @click="emit('cancel')">取消</button>
          <button class="danger-button" type="button" @click="emit('confirm')">{{ confirmText || "确认" }}</button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
