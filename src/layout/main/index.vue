<template>
    <router-view v-slot="{ Component }">
        <transition name="fade">
            <component :is="Component" />
        </transition>
    </router-view>    
</template>

<script setup lang="ts">

</script>


<style scoped lang="scss">
.fade-enter-from {
    opacity: 0;
    transform: scale(.5);
}

.fade-enter-active {
    transition: all .8s;
}

.fade-enter-to {
    opacity: 1;
    transform: scale(1);
}
</style>