<template>
  <component :is="linkProps(to).is" v-bind="linkProps(to).props">
    <slot />
  </component>
</template>

<script>
import { isExternal } from '@/utils/validate'

export default {
  name: 'AppLink',
  props: {
    to: {
      type: String,
      required: true
    }
  },
  methods: {
    linkProps(to) {
      if (isExternal(to)) {
        return {
          is: 'a',
          props: {
            href: to,
            target: '_blank',
            rel: 'noopener'
          }
        }
      }
      return {
        is: 'router-link',
        props: {
          to: to
        }
      }
    }
  }
}
</script>