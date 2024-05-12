<template>
    <div class="breadcrumb">
        <el-breadcrumb separator-icon="CaretRight" style="margin-left: 20px;">
            <el-breadcrumb-item class="breadcrumbItem" v-show="item.meta.icon"
                v-for="(item, index) in currentroute.matched" :key="index" :to="item.path">
                <el-icon>
                    <component :is="item.meta.icon" v-if="item.meta.icon" />
                </el-icon>
                <span> {{ item.meta.title }}</span>
            </el-breadcrumb-item>
        </el-breadcrumb>
    </div>
</template>

<script setup lang="ts">
// 獲取當前路由
import { useRoute } from 'vue-router'
const currentroute = useRoute()
</script>


<style scoped lang="scss">
.breadcrumbItem {
    font-size: 13px;
}

</style>
