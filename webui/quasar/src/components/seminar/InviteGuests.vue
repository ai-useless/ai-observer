<template>
  <div style='max-width: 960px;'>
    <q-card class='bg-gradient-blue no-border-radius'>
      <q-card-section>
        <div class='flex justify-center items-center' style='height: 240px;'>
          <div class='text-center'>
            <div class='text-white text-bold' style='font-size: 40px;'>
              {{ topic }}
            </div>
            <div class='text-white' style='font-size: 16px;'>
              选择您喜欢的AGI模拟器讨论您感兴趣的话题~
            </div>
            <q-btn class='action-btn text-grey-9 q-mt-lg border-gradient-bg-white full-width border-radius-16px' flat dense>
              随机安排模拟器开始讨论
            </q-btn>
          </div>
        </div>
      </q-card-section>
    </q-card>
    <div>
      <div class='flex items-center'>
        <div class='bg-gradient-blue' style='height: 4px; width: 48px;' />
        <h4 class='q-ml-md text-grey-9'>
          主持人
        </h4>
      </div>
      <GuestCardHorizontal
        :participator='host'
        :role='dbModel.Role.HOST'
      />
    </div>
    <div class='q-mb-lg'>
      <div class='flex items-center'>
        <div class='bg-gradient-blue' style='height: 4px; width: 48px;' />
        <h4 class='q-ml-md text-grey-9'>
          嘉宾
        </h4>
      </div>
      <div class='row q-col-gutter-md'>
        <div
          v-for='(guest, index) of guests'
          :key='index'
          class='col-12 col-sm-6 col-md-4'
        >
          <GuestCardVertical
            :participator='guest'
            :role='dbModel.Role.GUEST'
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { model, seminar, simulator } from 'src/localstores'
import { computed, onMounted, ref } from 'vue'
import { dbModel } from 'src/model'
import { useRouter } from 'vue-router'

import GuestCardVertical from './GuestCardVertical.vue'
import GuestCardHorizontal from './GuestCardHorizontal.vue'

const participatorCount = ref(7)
const participators = ref([] as dbModel.Participator[])

const host = computed(() => participators.value[0])
const guests = computed(() => participators.value.slice(1))
const topic = computed(() => seminar.Seminar.topic())

const router = useRouter()

onMounted(() => {
  if (!topic.value || !topic.value.length) {
    void router.push({ path: '/' })
    return
  }

  participatorCount.value = Math.floor(Math.random() * 4) + 6
  for (let i = 0; i < participatorCount.value; i++) {
    participators.value.push(undefined as unknown as dbModel.Participator)
  }

  simulator.Simulator.getSimulators()
  model.Model.getModels()
})

</script>
