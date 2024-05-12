<template>
    <el-menu :default-active="route.path" text-color="#666" active-text-color="#000" mode="horizontal"
        background-color="white">
        <template v-for="item in constantRoutes" :key="item.path">
            <!-- 路由沒有子路由 -->
            <template v-if="!item.children && !item.meta.hidden">
                <el-menu-item :index="item.path" @click="goRoute">
                    <el-icon>
                        <component :is="item.meta.icon" v-if="item.meta.icon" />
                    </el-icon>
                    <span>{{ item.meta.title }}</span>
                </el-menu-item>
            </template>
            <!-- 有路由但只有一個 -->
            <template v-if="item.children && item.children.length === 1">
                <el-menu-item v-for="children in item.children" :key="children.path" :index="children.path"
                    @click="goRoute">
                    <el-icon>
                        <component :is="children.meta.icon" v-if="children.meta.icon" />
                    </el-icon>
                    <span>{{ children.meta.title }}</span>
                </el-menu-item>
            </template>
            <!-- 有路由且有多個 -->
            <template v-if="item.children && item.children.length > 1">
                <el-sub-menu :index="item.path">
                    <template #title>
                        <el-icon>
                            <component :is="item.meta.icon" v-if="item.meta.icon" />
                        </el-icon>
                        <span>{{ item.meta.title }}</span>
                    </template>
                    <el-menu-item v-for="children in item.children" :key="children.path" :index="children.path"
                        @click="goRoute">
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
    border-bottom: none;
    background: none;

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


}

// RWD
// 820px以下
@media screen and (max-width: 820px) {
    .el-menu {
        width: 800px;
        margin: 15px;

        .el-menu-item {
            font-size: 12px;
            height: 60px;

        }

        .el-sub-menu {
            font-size: 12px;
            width: 170px;
            height: 60px;
        }

    }

}

// 666px以下
@media screen and (max-width: 666px) {
    .el-menu {

        .el-menu-item {
            font-size: 12px;
            height: 50px;
            width: 100px;
        }

        .el-sub-menu {
            font-size: 12px;
            width: 150px;
            height: 50px;
        }
    }
}

// 610px以下
@media screen and (max-width: 610px) {
    .el-menu {

        .el-menu-item {
            font-size: 12px;
            height: 50px;
            width: 80px;
        }

        .el-sub-menu {
            font-size: 12px;
            width: 120px;
            height: 50px;
        }
    }
}

// 504px以下
@media screen and (max-width: 504px) {
    .el-menu {
        width: 300px;
    }
}
</style>