<template>
    <div class="home-content-container">
        <div class="clock-widget">
            <div class="clock-face">
                <div class="hand hour-hand"></div>
            </div>
        </div>

        <div class="welcome-section">
            <h1 class="clearsky-text">clear sky</h1>
            <div class="weather-widget">
                <div class="sun-icon"></div>
                <div class="cloud-icon"></div>
            </div>
            <p class="mood-prompt">今天心情怎么样?</p>
        </div>
        
        <div class="content-placeholder">
            </div>
    </div>
</template>

<script setup>
// 逻辑保持不变
</script>

<style scoped>
/* * 注意：将原 HomePage.vue 中所有关于 .clock-widget, 
 * .welcome-section, .clearsky-text, .weather-widget, 
 * .mood-prompt 的样式全部移动到这里。
*/

/* --- 样式移动自原 HomePage.vue --- */

/* 闹钟 Widget 样式 */
.clock-widget {
    position: absolute;
    top: 50px;
    right: 50px;
}

.clock-face {
    width: 100px;
    height: 100px;
    border: 5px solid #3b5998;
    border-radius: 50%;
    position: relative;
    background-color: white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
/* ... 闹钟指针和中心点样式 ... */
.hand {
    position: absolute;
    background-color: #3b5998;
    transform-origin: bottom center;
    left: 50%;
    margin-left: -2px; /* 居中 */
    bottom: 50%;
    border-radius: 2px;
}
.hour-hand {
    width: 4px;
    height: 30px;
    transform: rotate(45deg); 
}
.clock-face::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 8px;
    height: 8px;
    background-color: #e74c3c;
    border-radius: 50%;
    transform: translate(-50%, -50%);
}

/* clear sky 字体样式 */
.welcome-section {
    text-align: center;
    padding-top: 50px;
}

.clearsky-text {
    font-size: 80px;
    font-family: 'Times New Roman', Times, serif; 
    font-weight: normal;
    color: #2c3e50;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    letter-spacing: 5px;
    margin-bottom: 20px;
}

/* 天气和心情提示 */
.weather-widget {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
}

.sun-icon {
    width: 50px;
    height: 50px;
    background-color: #ffc107; 
    border-radius: 50%;
}

.cloud-icon {
    width: 80px;
    height: 40px;
    background-color: #a0c4ff; 
    border-radius: 20px;
    position: relative;
    top: -5px;
}
.cloud-icon::before {
    content: '';
    position: absolute;
    width: 40px;
    height: 40px;
    background-color: #a0c4ff;
    border-radius: 50%;
    left: 10px;
    top: -20px;
}
.cloud-icon::after {
    content: '';
    position: absolute;
    width: 50px;
    height: 50px;
    background-color: #a0c4ff;
    border-radius: 50%;
    right: 5px;
    top: -30px;
}

.mood-prompt {
    font-size: 24px;
    color: #7f8c8d;
    font-style: italic;
    margin-bottom: 40px;
}

.content-placeholder {
    /* 底部内容占位符 */
    min-height: 400px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    padding: 20px;
}
</style>