<template>
    <div class="sidebarLogoBox" @click="gohome">
        <img src="@/assets/logo/logo.png" alt="logo">
        <h1>氣象知多少</h1>
    </div>
</template>

<script setup lang="ts">
// 引入並使用路由
import { useRouter } from 'vue-router'
const router = useRouter()
const gohome = () => {
    router.push('/')
}
</script>


<style scoped lang="scss">
.sidebarLogoBox {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border-bottom: 1px solid #e6e6e6;

    img {
        width: 60px;
        height: 60px;
        margin-right: 5px;
    }

    h1 {
        font-size: 26px;
        font-weight: bold;
        background: linear-gradient(#e66465, #9198e5);
        border-radius: 15px;
        padding: 5px;
        color: wheat;
    }
}
</style>