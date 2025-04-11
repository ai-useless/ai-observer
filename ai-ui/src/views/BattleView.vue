<template>
  <div class="home">
    <AIBattle/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AIBattle from '@/components/AI-Battle.vue'; // @ is an alias to /src

export default defineComponent({
  name: 'ForumView',
  components: {
    AIBattle,
  },
});
</script>
