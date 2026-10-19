<script>

export default {
  name: 'info-modal',
  props: {
    modelValue: { type: Boolean, required: true },
    hasActions: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  data () {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      modalWidth: 200,
      modalHeight: 200
    }
  },
  computed: {
    modalStyle () {
      return {
        'max-height': `calc(${this.height}px - 5%)`,
        'max-width': `calc(${this.width}px - 5%)`,
        left: `calc(50% - ${this.modalWidth / 2}px)`,
        top: `calc(50% - ${this.modalHeight / 2}px)`
      }
    }
  },
  mounted () {
    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize)
      // Init tracking the current size of the modal
      this.onResize()
    })
  },
  updated () {
    this.onResize()
  },
  beforeUnmount () {
    window.removeEventListener('resize', this.onResize)
  },
  methods: {
    closeModal () {
      this.$emit('update:modelValue', false)
    },
    onResize () {
      this.height = window.innerHeight
      this.width = window.innerWidth
      const modal = this.$refs.modal
      // The ref can be cleared while the modal moves between teleport targets.
      if (modal) {
        this.modalWidth = modal.clientWidth
        this.modalHeight = modal.clientHeight
      }
    }
  }
}
</script>

<template>
  <div>
    <div v-show="modelValue" class="info-modal">
      <div class="info-modal-backdrop" @click="closeModal"></div>
      <div class="info-modal-container" :style="{...modalStyle}" ref="modal" @wheel.stop>
        <button class="close-modal-btn" role="button" data-cy-tooltip="close" @click="closeModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
          </svg>
        </button>
        <div class="row-heading modal-header">
          <slot name="title"></slot>
        </div>
        <div class="modal-content"><slot name="content"></slot></div>
        <div v-if="hasActions" class="modal-buttons">
            <slot name="buttons"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "@/themeVariables";

.info-modal {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10;
}
.info-modal-backdrop{
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #000000;
    opacity: 0.1;
    z-index: 999999;
}
.info-modal-container {
  position: absolute;
  text-align: left;
  bottom: 10%;
  right: 10%;
  width: fit-content;
  height: fit-content;
  overflow: auto;
  padding: 0;
  border-radius: var(--radius);
  border: 1px solid var(--divider);
  box-shadow: 0px 5px 20px -10px #000000;
  background: var(--background);
  color: var(--text-secondary);
  z-index: 1000000;

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0;
    padding: 1rem 3rem .5rem 1rem;
  }

  .modal-buttons {
    border: none;
    display: flex;
    padding: 1rem;
    justify-content: flex-end
  }

  .close-modal-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: transparent;
    color: hsl(var(--primary));
    cursor: pointer;
    padding: 0.4em;
    display: flex;
    align-items: center;

    &:hover{
      background: hsl(var(--muted));
    }
  }

  .modal-content {
    display: flex;
    flex-direction: column;
    overflow: auto;
  }
}
</style>

<style>
.modal-content > * {
  padding: 0.5rem 1rem;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--divider);
}
.modal-content > *:last-child{
  border-bottom: none;
}
</style>
