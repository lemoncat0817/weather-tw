<template>
    <div class="layoutHeaderBox" :class="{ 'layoutHeaderBoxDark': layOutSettingStore.dark }">
        <div class="layoutHeaderleft">
            <Breadcrumb class="breadcrumb" />
            <el-popover placement="right-start" :width="340" trigger="hover">
                <template #reference>
                    <el-button icon="More" type="success" class="breadcrumbBtn"
                        style="margin-left: 10px; width: 30px; border-radius: 50%;"></el-button>
                </template>
                <template #default>
                    <Breadcrumb />
                </template>
            </el-popover>
        </div>
        <div class="layoutHeadercenter">
            <Menu />
        </div>
        <div class="layoutHeaderright">
            <div class="setting">
                <div class="selectColor">
                    <div style="margin-right: 10px;">主題顏色</div>
                    <el-color-picker :teleported="false" @change="setColor" v-model="layOutSettingStore.color"
                        size="default" show-alpha :predefine="predefineColors" />
                </div>
                <div class="darkMode">
                    <div>深色模式</div>
                    <el-switch @change="changeDark" v-model="layOutSettingStore.dark"
                        style="margin-left: 10px; --el-switch-on-color: black; --el-switch-off-color: red;"
                        active-action-icon="Moon" inactive-action-icon="Sunny" size="large" />
                </div>
            </div>
            <div class="mark">
                <div>此網站為練習用途而製作</div>
                <div>天氣相關資料來源皆由中央氣象局提供</div>
            </div>
            <el-popover placement="bottom" :width="260" trigger="click">
                <template #reference>
                    <el-button class="popoverBtn" icon="Setting" type="danger"
                        style="width: 30px;border-radius: 50%;"></el-button>
                </template>
                <template #default>
                    <div class="popoverSetting">
                        <div class="popoverSelectColor">
                            <div style="margin-right: 10px;">主題顏色</div>
                            <el-color-picker :teleported="false" @change="setColor" v-model="layOutSettingStore.color"
                                size="default" show-alpha :predefine="predefineColors" />
                        </div>
                        <div class="popoverDarkMode">
                            <div>深色模式</div>
                            <el-switch @change="changeDark" v-model="layOutSettingStore.dark"
                                style="margin-left: 10px; --el-switch-on-color: black; --el-switch-off-color: red;"
                                active-action-icon="Moon" inactive-action-icon="Sunny" size="large" />
                        </div>
                    </div>
                    <div class="popoverMark">
                        <div>此網站為練習用途而製作</div>
                        <div>天氣相關資料來源</div>
                        <div>皆由中央氣象局提供</div>
                    </div>
                </template>
            </el-popover>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
// 引入面包屑
import Breadcrumb from './breadcrumb/index.vue'
// 引入菜單
import Menu from './menu/index.vue'
// 引入倉庫
import { useLayoutSettingStore } from '@/stores/layout/layoutSetting'
const layOutSettingStore = useLayoutSettingStore()
// 修改顏色
const setColor = () => {
    const html = document.documentElement
    html.style.setProperty('--el-color-primary', layOutSettingStore.color)
    html.style.setProperty('--el-color-warning', layOutSettingStore.color)
    html.style.setProperty('--el-color-danger', layOutSettingStore.color)
    html.style.setProperty('--el-color-success', layOutSettingStore.color)
    html.style.setProperty('--el-color-info', layOutSettingStore.color)
}
// 深色模式
const changeDark = () => {
    const html: any = document.documentElement
    layOutSettingStore.dark ? (html.className = 'dark') : (html.className = '')
}
// 預定的顏色
const predefineColors = ref([
    '#ff4500',
    '#ff8c00',
    '#ffd700',
    '#90ee90',
    '#00ced1',
    '#1e90ff',
    '#c71585',
    'rgba(255, 69, 0, 0.68)',
    'rgb(255, 120, 0)',
    'hsv(51, 100, 98)',
    'hsva(120, 40, 94, 0.5)',
    'hsl(181, 100%, 37%)',
    'hsla(209, 100%, 56%, 0.73)',
    '#c7158577',
])
onMounted(() => {
    setColor()
    changeDark()
})
</script>


<style scoped lang="scss">
.layoutHeaderBox {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e6e6e6;

    .layoutHeaderleft {
        width: 320px;
    }

    .layoutHeadercenter {
        width: calc(100% - 750px);
    }

    .layoutHeaderright {
        width: 290px;
        margin-right: 20px;

        .setting {
            display: flex;
            align-items: center;
            justify-content: center;

            .selectColor {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 10px;
            }

            .darkMode {
                display: flex;
                align-items: center;
                justify-content: center;
            }
        }

        .mark {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            border: 0.5px solid gray;
            padding: 5px;
            margin: 3px 0px;
            border-radius: 10px;
        }
    }
}

.layoutHeaderBoxDark {
    border-bottom: 1px solid #393737;
}

.popoverSetting {
    display: flex;
    align-items: center;
    justify-content: center;


    .popoverSelectColor {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .popoverDarkMode {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
    }
}

.popoverMark {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    border: 0.5px solid gray;
    padding: 5px;
    margin: 3px 0px;
    border-radius: 10px;
}



// RWD
// 821px以上
@media screen and (min-width: 821px) {
    .layoutHeadercenter {
        display: none;
    }

    .breadcrumbBtn {
        display: none;
    }

    .popoverBtn {
        display: none;
    }
}

// 821px~920px
@media screen and (min-width: 821px) and (max-width:920px) {
    .layoutHeaderBox {

        .layoutHeaderright {
            width: 240px;
            margin-right: 10px;
            font-size: 13px;

            .mark {
                div {
                    margin-top: 3px;
                }
            }
        }
    }
}

// 820px以下
@media screen and (max-width:820px) {
    .layoutHeaderBox {
        .layoutHeaderleft {
            width: 50px;

            .breadcrumb {
                display: none;
            }
        }

        .layoutHeadercenter {
            width: calc(100% - 70px);
        }

        .layoutHeaderright {
            width: 20px;

            .setting {
                display: none;
            }

            .mark {
                display: none;
            }
        }
    }
}
</style>