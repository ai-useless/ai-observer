<template>
  <div>
    <q-fab
      color='red-8'
      vertical-actions-align='left'
      direction='up'
      padding='8px 16px'
    >
      <q-fab-action color='primary' icon='mail' />
      <q-fab-action color='secondary' icon='alarm' />
      <template #icon>
        <q-icon name='bi-chevron-up' size='16px' />
      </template>
      <template #label>
        <div class='row'>
          <span>Expand guests</span>
          <q-icon name='bi-person-circle' style='margin-left: 8px;' />
        </div>
      </template>
    </q-fab>
  </div>
</template>

<script setup lang='ts'>
</script>
