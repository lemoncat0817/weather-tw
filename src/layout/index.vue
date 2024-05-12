<template>
    <div class="layout">
        <div class="layoutleft">
            <Sidebar />
        </div>
        <div class="layoutright">
            <Header class="layoutrightHeader" />
            <Main class="layoutrightMain" />
        </div>
    </div>
</template>

<script setup lang="ts">
import Header from './header/index.vue'
import Main from './main/index.vue'
import Sidebar from './sidebar/index.vue'
</script>


<style scoped lang="scss">
.layout {
    width: 100vw;
    height: 100vh;
    display: flex;
    overflow: hidden;

    .layoutleft {
        width: 250px;
        height: 100vh;
    }

    .layoutright {
        width: calc(100vw - 250px);
        height: 100vh;
        display: flex;
        flex-direction: column;

        .layoutrightHeader {
            width: 100%;
            height: 100px;
        }

        .layoutrightMain {
            width: 100%;
            height: calc(100vh - 100px);
            overflow: auto;
        }
    }
}

// RWD
@media screen and (max-width: 820px) {
    .layout {
        .layoutleft {
            display: none;
        }

        .layoutright {
            width: 100vw;
        }
    }
}
</style>