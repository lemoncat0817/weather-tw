<template>
    <div class="home" style="overflow-x: hidden;" :class="{ 'homeDark': layOutSettingStore.dark }">
        <div class="background">
            <img class="cloud" src="@/assets/home/cloud.png" alt="" />
            <img class="cloud2" src="@/assets/home/cloud2.png" alt="" />
            <img class="cloud3" src="@/assets/home/cloud3.png" alt="" />
            <img class="cloud4" src="@/assets/home/cloud4.png" alt="" />
            <img class="cloud5" src="@/assets/home/cloud5.png" alt="" />
            <img class="cloud6" src="@/assets/home/cloud6.png" alt="" />
            <img class="sun" src="@/assets/home/sun.png" alt="" />
            <img class="animal" src="@/assets/home/animal.png" alt="" />
            <img class="animal1" src="@/assets/home/animal1.png" alt="" />
            <img class="animal2" src="@/assets/home/animal2.png" alt="" />
            <img class="animal3" src="@/assets/home/animal3.png" alt="" />
            <img class="animal4" src="@/assets/home/animal4.png" alt="" />
            <div class="cat-container">
                <img class="cat" src="@/assets/home/cat.png" alt="catch the cat" />
            </div>
            <div class="box">
                <div class="text">
                    <div>本站可以查看台灣的氣象預報、觀測資料、警報</div>
                    <div> 當前時間: {{ time }}</div>
                    <div>開始查看或是抓住貓咪！！！</div>
                </div>
            </div>
        </div>
        <div class="welcome-text">
            <div class="hot-data" :class="{ 'hot-data-Dark': layOutSettingStore.dark }">熱門資料</div>
            <div class="hot-data-content" :class="{ 'hot-data-content-Dark': layOutSettingStore.dark }">
                <div @click="goTo('/weatherForecast/thirtySixHours')">今明36小時內天氣預報</div>
                <div @click="goTo('/weatherForecast/allTaiwan')">全臺灣各鄉鎮市區預報</div>
                <div @click="goTo('/observationData/nowWeather')">當前天氣觀測資料</div>
                <div @click="goTo('/observationData/dailyRainfall')">地面測站-每日雨量資料</div>
            </div>
        </div>
    </div>

</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted } from 'vue'
// 引入時間格式化套件
import moment from 'moment'
// 引入router
import { useRouter } from 'vue-router'
const router = useRouter()
// 跳轉到其他頁面
const goTo = (path: string) => {
    router.push(path)
}
// 引入layoutsetting倉庫
import { useLayoutSettingStore } from '@/stores/layout/layoutSetting'
const layOutSettingStore = useLayoutSettingStore()
const time = ref(moment().format('YYYY-MM-DD HH:mm:ss'))
const timer = ref(0)
// 刷新頁面時開始計時
onMounted(() => {
    timer.value = setInterval(() => {
        time.value = moment().format('YYYY-MM-DD HH:mm:ss')
    }, 1000)
})
// 離開頁面時銷毀計時器
onBeforeUnmount(() => {
    clearInterval(timer.value)
})
</script>


<style scoped lang="scss">
.home {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 16px;
    background: #c1edff;


    .background {
        margin-top: 5vh;
        position: relative;
        width: 100%;
        height: 60vh;

        .box {
            position: absolute;
            height: 25%;
            width: 95%;
            top: 40%;
            left: 28%;
            z-index: 2;

            .text {
                position: absolute;
                display: flex;
                flex-direction: column;
                align-items: center;


                div {
                    font-size: 2em;
                    margin: 8px 0;
                    font-weight: bold;
                    font-family: Arial, sans-serif;
                    text-transform: uppercase;
                    text-shadow: 5px 5px 10px rgba(0, 0, 0, 0.5);
                    animation: breath 5s ease-in-out infinite;
                }
            }
        }

        .cloud {
            position: absolute;
            width: 10%;
            height: 10%;
            top: 10%;
            left: 10%;
            transform: translate(-50%, -50%);
            z-index: 1;
            animation: move 2s ease-in-out infinite;
        }

        .cloud2 {
            position: absolute;
            width: 10%;
            height: 10%;
            top: 10%;
            left: 70%;
            transform: translate(-50%, -50%);
            z-index: 1;
            animation: move 2s ease-in-out infinite;
        }

        .cloud3 {
            position: absolute;
            width: 10%;
            height: 10%;
            top: 25%;
            left: 5%;
            transform: translate(-50%, -50%);
            z-index: 1;
            animation: move 2s ease-in-out infinite;
        }

        .cloud4 {
            position: absolute;
            width: 10%;
            height: 10%;
            top: 25%;
            left: 85%;
            transform: translate(-50%, -50%);
            z-index: 1;
            animation: move 2s ease-in-out infinite;
        }

        .cloud5 {
            position: absolute;
            width: 10%;
            height: 10%;
            top: 5%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1;
            animation: move 2s ease-in-out infinite;
        }

        .cloud6 {
            position: absolute;
            width: 15%;
            height: 15%;
            top: 5%;
            left: 25%;
            transform: translate(-50%, -50%);
            z-index: 1;
            animation: move 2s ease-in-out infinite;
        }

        .sun {
            width: 10%;
            height: 20%;
            position: absolute;
            top: 10%;
            left: 95%;
            transform: translate(-50%, -50%);
            z-index: 1;
        }

        .animal {
            width: 10%;
            height: 25%;
            position: absolute;
            top: 70%;
            left: 67%;
            transform: translate(-50%, -50%);
            z-index: 1;
            animation: swing 3s ease-in-out infinite;
        }

        .animal1 {
            width: 10%;
            height: 25%;
            position: absolute;
            top: 70%;
            left: 55%;
            transform: translate(-50%, -50%);
            z-index: 1;
            animation: swing 3s ease-in-out infinite;
        }

        .animal2 {
            width: 10%;
            height: 25%;
            position: absolute;
            top: 70%;
            left: 45%;
            transform: translate(-50%, -50%);
            z-index: 1;
            animation: swing 3s ease-in-out infinite;
        }

        .animal3 {
            width: 8%;
            height: 25%;
            position: absolute;
            top: 70%;
            left: 35%;
            transform: translate(-50%, -50%);
            z-index: 1;
            animation: swing 3s ease-in-out infinite;
        }

        .animal4 {
            width: 10%;
            height: 30%;
            position: absolute;
            top: 65%;
            left: 25%;
            transform: translate(-50%, -50%);
            z-index: 1;
            animation: swing 3s ease-in-out infinite;
        }


        .cat-container {
            top: 20%;
            left: 45%;
            position: absolute;
            width: 8%;
            height: 20%;
            overflow: hidden;
            z-index: 3;
            border-right: 1px solid #666;
            border-bottom: 1px solid #666;
            cursor: pointer;

            &:hover {
                .cat {
                    left: 200px;
                }
            }

            .cat {
                position: absolute;
                top: 0;
                left: -100px;
                transition: left 1s linear;
            }
        }
    }

    .welcome-text {
        width: 40vw;
        height: calc(100% - 60vh);
        display: flex;

        .hot-data {
            width: 50%;
            height: 80%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #C4DDFF;
            font-size: 30px;
            border-top-left-radius: 20px;
            border-bottom-left-radius: 20px;
            font-weight: bold;
        }

        .hot-data-content {
            width: 50%;
            height: 80%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #fff;
            border-top-right-radius: 20px;
            border-bottom-right-radius: 20px;
            font-size: 20px;

            div {
                margin: 5px;
                border-radius: 20px;
                border: 1px solid #666;
                padding: 5px;
                width: 80%;
                height: 20%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;

                &:hover {
                    background: #666;
                    color: #fff
                }
            }
        }

        .hot-data-Dark {
            border: 1px solid #666;
            background: none;
            border-top-right-radius: 20px solid #666;
            border-bottom-right-radius: 20px solid #666;
        }

        .hot-data-content-Dark {
            border: 1px solid #666;
            background: none;
            border-top-right-radius: 20px solid #666;
            border-bottom-right-radius: 20px solid #666;
        }
    }


}

.homeDark {
    background: none;
}



// 定義搖擺動畫
@keyframes swing {
    0% {
        transform: rotate(-30deg);
    }

    25% {
        transform: rotate(0deg);
    }


    50% {
        transform: rotate(15deg);
    }

    75% {
        transform: rotate(0deg);
    }


    100% {
        transform: rotate(-30deg);
    }
}

@keyframes move {
    0% {
        transform: translateX(-30px);
    }

    50% {
        transform: translateX(30px);
    }

    100% {
        transform: translateX(-30px);
    }
}

@keyframes cat {
    0% {
        transition: left 2s linear;
    }



    100% {
        transition: right 2s linear;
    }
}

@keyframes breath {

    from {
        color: red
    }

    25% {
        color: green;
    }

    50% {
        color: blue;
    }

    to {
        color: red;
    }
}

// RWD
//1440px以下
@media screen and (max-width:1440px) {
    .home {
        font-size: 12px;

        .welcome-text {
            .hot-data-content {
                font-size: 15px;
            }
        }

    }
}

// 980px~1280px
@media screen and (min-width: 980px) and (max-width:1280px) {
    .home {
        font-size: 12px;

        .background {
            .box {
                font-size: 10px;
                position: absolute;
                height: 25%;
                width: 95%;
                top: 40%;
                left: 28%;
                z-index: 2;
            }
        }

        .welcome-text {
            .hot-data-content {
                font-size: 15px;
            }
        }

    }
}

// 820px~980px
@media screen and (min-width: 820px) and (max-width:980px) {
    .home {
        font-size: 11px;

        .background {
            .box {
                font-size: 10px;
                position: absolute;
                height: 25%;
                width: 95%;
                top: 40%;
                left: 25%;
                z-index: 2;
            }
        }

        .welcome-text {
            .hot-data-content {
                font-size: 15px;
            }
        }
    }
}

// 680px~820px
@media screen and (min-width: 680px) and (max-width:820px) {
    .home {
        font-size: 12px;

        .background {
            .box {
                font-size: 10px;
                position: absolute;
                height: 25%;
                width: 95%;
                top: 40%;
                left: 25%;
                z-index: 2;
            }
        }

        .welcome-text {
            width: 60%;

            .hot-data-content {
                font-size: 15px;
            }
        }
    }
}

// 580px~680px
@media screen and (min-width: 580px) and (max-width:680px) {
    .home {
        font-size: 9px;

        .background {
            .box {
                font-size: 10px;
                position: absolute;
                height: 25%;
                width: 95%;
                top: 40%;
                left: 25%;
                z-index: 2;
                font-size: 10px;
            }
        }

        .welcome-text {
            width: 65%;

            .hot-data-content {
                font-size: 15px;
            }
        }
    }
}

// 480px~580px
@media screen and (min-width: 480px) and (max-width:580px) {
    .home {
        font-size: 9px;

        .background {
            .box {
                font-size: 10px;
                position: absolute;
                height: 25%;
                width: 95%;
                top: 40%;
                left: 20%;
                z-index: 2;
                font-size: 10px;
            }
        }

        .welcome-text {
            width: 65%;

            .hot-data-content {
                font-size: 15px;
            }
        }
    }
}

// 414px~480px
@media screen and (min-width: 414px) and (max-width:480px) {
    .home {
        font-size: 8px;

        .background {
            .box {
                font-size: 10px;
                position: absolute;
                height: 25%;
                width: 95%;
                top: 40%;
                left: 10%;
                z-index: 2;
                font-size: 8px;

            }
        }

        .welcome-text {
            width: 65%;

            .hot-data-content {
                font-size: 15px;
            }
        }
    }
}

// 414px以下
@media screen and (max-width:414px) {
    .home {
        font-size: 6px;

        .welcome-text {
            width: 65%;

            .hot-data {
                font-size: 20px;
            }

            .hot-data-content {
                font-size: 14px;
            }
        }

        .background {
            .box {
                font-size: 10px;
                position: absolute;
                height: 25%;
                width: 95%;
                top: 40%;
                left: 5%;
                z-index: 2;
            }
        }

    }
}

// 高度720以下
@media screen and (max-height:768px) {
    .home {
        .welcome-text {
            .hot-data-content {
                font-size: 12px;

                div {
                    width: 150px;
                    margin: 0;
                }
            }
        }
    }
}

// 高度480以下
@media screen and (max-height:480px) {
    .home {
        .welcome-text {
            .hot-data {
                height: 50vh;
            }

            .hot-data-content {
                height: 50vh;

                div {
                    width: 150px;
                    margin: 0;
                }
            }
        }
    }
}
</style>
