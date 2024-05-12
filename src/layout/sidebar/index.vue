<template>
    <div class="layoutsidebarBox">
        <Logo class="layoutsidebarlogo" :class="{ 'layoutsidebarlogoDark': layOutSettingStore.dark }" />
        <Menu class="layoutsidebarmenu" :class="{ 'layoutsidebarmenuDark': layOutSettingStore.dark }" />
    </div>
</template>

<script setup lang="ts">
// 引入Logo組件
import Logo from './logo/index.vue'
// 引入Menu組件
import Menu from './menu/index.vue'
// 引入layoutsetting倉庫
import { useLayoutSettingStore } from '@/stores/layout/layoutSetting'
const layOutSettingStore = useLayoutSettingStore()

</script>


<style scoped lang="scss">
.layoutsidebarBox {
    width: 100%;
    height: 100vw;
    display: flex;
    flex-direction: column;

    .layoutsidebarlogo {
        width: 100%;
        height: 100px;
    }

    .layoutsidebarlogoDark {
        width: 100%;
        height: 100px;
        background: #121212;
        border-bottom: 1px solid #393737;
    }

    .layoutsidebarmenu {
        margin-top: 35px;
        width: 100%;
        height: calc(100vh - 100px);
    }

    .layoutsidebarmenuDark {
        height: calc(100vh - 100px);
        background: #121212;
    }
}

// RWD
@media screen and (max-width: 820px) {
    .layoutsidebarBox {
        display: none;
        width: 0;
    }
}
</style>