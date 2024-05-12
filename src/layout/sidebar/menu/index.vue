<template>
    <el-menu :default-active="route.path" text-color="#666" active-text-color="#000" unique-opened>
        <template v-for="item in constantRoutes" :key="item.path">
            <!-- 路由沒有子路由 -->
            <template v-if="!item.children && !item.meta.hidden">
                <el-menu-item :index="item.path" @click="goRoute" :class="{ 'darkMode': layOutSettingStore.dark }">
                    <el-icon>
                        <component :is="item.meta.icon" v-if="item.meta.icon" />
                    </el-icon>
                    <span>{{ item.meta.title }}</span>
                </el-menu-item>
            </template>
            <!-- 有路由但只有一個 -->
            <template v-if="item.children && item.children.length === 1">
                <el-menu-item v-for="children in item.children" :key="children.path" :index="children.path"
                    @click="goRoute" :class="{ 'darkMode': layOutSettingStore.dark }">
                    <el-icon>
                        <component :is="children.meta.icon" v-if="children.meta.icon" />
                    </el-icon>
                    <span>{{ children.meta.title }}</span>
                </el-menu-item>
            </template>
            <!-- 有路由且有多個 -->
            <template v-if="item.children && item.children.length > 1">
                <el-sub-menu :index="item.path" :class="{ 'darkMode': layOutSettingStore.dark }">
                    <template #title>
                        <el-icon :class="{ 'darkMode': layOutSettingStore.dark }">
                            <component :is="item.meta.icon" v-if="item.meta.icon" />
                        </el-icon>
                        <span :class="{ 'darkMode': layOutSettingStore.dark }">{{ item.meta.title }}</span>
                    </template>
                    <el-menu-item v-for="children in item.children" :key="children.path" :index="children.path"
                        @click="goRoute" :class="{ 'darkModeIn': layOutSettingStore.dark }">
                        <el-icon>
                            <component :is="children.meta.icon" v-if="children.meta.icon" />
                        </el-icon>
                        <span>{{ children.meta.title }}</span>
                    </el-menu-item>
                </el-sub-menu>
            </template>
        </template>
    </el-menu>
</template>


<script setup lang="ts">
import { constantRoutes } from "@/router/routes"
import { useRoute, useRouter } from "vue-router"
// 引入layoutsetting倉庫
import { useLayoutSettingStore } from '@/stores/layout/layoutSetting'
const layOutSettingStore = useLayoutSettingStore()

const route = useRoute()
const router = useRouter()

const goRoute = (e: any) => {
    router.push(e.index)
}

</script>


<style scoped lang="scss">
.el-menu {
    border-right: none;

    .el-menu-item {
        border-radius: 20px;
        font-weight: bold;
    }

    .el-menu-item.is-active {
        background: rgb(240, 240, 240);
        color: green;
    }

    .el-menu-item:hover {
        background-color: rgb(250, 250, 250);
    }

    .el-sub-menu {
        border-radius: 20px;
        font-weight: bold;
    }

    .el-sub-menu.is-active {
        border-radius: 20px;
        font-weight: bold;
        background-color: rgb(240, 240, 240);
    }

    .el-sub-menu:hover {
        background-color: rgb(250, 250, 250);
    }

    .darkMode {
        color: white;
    }

    .darkMode:hover {
        background: #212121;
    }

    .darkMode.is-active {
        background: #212121;
        color: yellowgreen;
    }

    .darkModeIn {
        color: white;
    }

    .darkModeIn:hover {
        background: #767474;
    }

    .darkModeIn.is-active {
        background: #56565671;
        color: yellowgreen;
    }
}
</style>