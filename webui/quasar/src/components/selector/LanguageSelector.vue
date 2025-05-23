<template>
  <div class='full-width'>
    <q-card class='q-pb-sm border-radius-16px' style='max-width: 90%; width: 320px'>
      <q-card-section class='text-grey-9'>
        <div class='text-h6 text-center'>
          选择方言
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-input
          rounded
          dense
          v-model='languageSearch'
          placeholder='搜索方言...'
          outlined
        >
          <template #prepend>
            <q-icon name='search' size='24px' />
          </template>
        </q-input>
      </q-card-section>

      <q-card-section dense style='height: 250px;' class='q-pa-none q-pb-md'>
        <q-scroll-area class='fit'>
          <q-list>
            <q-item
              v-for='(_language, index) in filteredLanguages'
              :key='index'
              clickable
              @click='selectLanguage(_language)'
              :active='selectedLanguage === _language'
              active-class='text-blue-2'
              class='q-px-lg'
            >
              <q-item-section>
                <div>{{ _language }}</div>
              </q-item-section>
              <q-item-section side>
                <q-icon
                  name='check'
                  :color='selectedLanguage === _language ? "primary" : "transparent"'
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
      </q-card-section>

      <q-separator />

      <q-card-actions align='right'>
        <q-btn
          label='取消'
          class='full-width border-gradient-bg-white text-grey-9'
          flat
          rounded
          @click='onCancelClick'
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script setup lang='ts'>
import { dbBridge } from 'src/bridge'
import { computed, ref, defineEmits, defineModel } from 'vue'

const _languages = ref(dbBridge._Language.languages())
const selectedLanguage = defineModel<string>('selected')
const languageSearch = ref('')

const filteredLanguages = computed(() => {
  if (!languageSearch.value?.length) {
    return _languages.value
  }
  return _languages.value.filter(language =>
    language.toLowerCase().includes(languageSearch.value.toLowerCase())
  )
})

const emit = defineEmits<{(ev: 'selected', language: string): void,
  (ev: 'cancel'): void
}>()

const selectLanguage = (language: string) => {
  selectedLanguage.value = language
  emit('selected', language)
}

const onCancelClick = () => {
  emit('cancel')
}

</script>
