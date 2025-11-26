<template>
  <div class="dashboard-page">

    <h2 class="page-title">仪表盘概览</h2>

    <div class="stats-grid">

      <div class="stat-card primary-card">
        <div class="card-content">
          <p class="stat-label">今日预约</p>
          <h3 class="stat-value">（人数）{{ dashboardList?.appointmentStats?.totalAppointments || 0 }}</h3>
          <div class="divider"></div>
          <p class="stat-label">目前进度</p>
          <h3 class="stat-value">（已确认 {{ dashboardList?.appointmentStats?.confirmedAppointments || 0 }} 号）</h3>
        </div>
        <i class="card-icon appointment-icon"></i>
      </div>

      <div class="stat-card chart-card">
        <div class="chart-container">
          <span>完成率</span>
          <div class="pie-chart-placeholder">
            <div id="main2"></div>
          </div>
        </div>
      </div>

      <div class="stat-card wide-card">
        <h3 class="card-title">近五月学生预约趋势</h3>
        <div class="line-chart-placeholder">
          <div id="main1"></div>
        </div>
      </div>

      <div class="stat-card">
        <h3 class="card-title">系统用户数</h3>
        <p class="stat-value">{{ dashboardList?.userStats?.totalUsers || 0 }} <span class="trend up">▲ {{
          dashboardList?.userStats?.userGrowthRate?.toFixed(2) || 0.00
            }}%</span></p>
      </div>

      <div class="stat-card">
        <h3 class="card-title">待审核博文</h3>
        <p class="stat-value">{{ dashboardList?.contentStats?.pendingPosts || 0 }} 篇</p>
      </div>

    </div>


  </div>
</template>

<script setup>
import { GetDashboard, GetConsultant } from '@/api/dashboard';
import { onMounted, ref, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'
import { useUserStore } from '@/stores/user.js'; // 导入 Pinia store
const userStore = useUserStore();
// 初始化为 null 或空对象，确保 safe navigation (?.) 正常工作
const dashboardList = ref(null);


/**
 * 根据用户角色获取对应的仪表盘数据
 */
const fetchDashboardData = async () => {
  try {
    let res;
    // 根据角色判断调用哪个 API
    if (userStore.role === 'ADMIN') {
        console.log('Fetching Admin Dashboard data...');
        // 调用 admin API
        res = await GetDashboard();
    } else if (userStore.role === 'CONSULTANT') {
        console.log('Fetching Consultant Dashboard data...');
        // 调用 consultant API (已在 dashboard.js 定义)
        res = await GetConsultant();
    } else {
        console.warn('Unknown user role, cannot fetch dashboard data.');
        dashboardList.value = {}; // 避免报错
        return;
    }

    console.log('Dashboard API Response:', res);

    // 假设 res 是 API 返回的 data 字段内容
    dashboardList.value = res;

    // 数据加载完成后初始化图表
    await initChartAfterDataLoaded();
  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    dashboardList.value = {}; // 确保错误时仍有空对象防止模板报错
  }
}


// -------------------- 辅助函数和 Echarts 逻辑 --------------------

// 计算预约完成率的辅助函数
const calculateCompletionRate = () => {
  // 使用 API 返回的 appointmentCompletionRate
  let completionRate = dashboardList.value?.appointmentStats?.appointmentCompletionRate;

  // 【修复之前提到的 TypeError】确保 appointmentStats 存在，避免 TypeError
  const stats = dashboardList.value?.appointmentStats;
  if (!stats) {
      return 0; // 如果数据不存在，直接返回 0
  }

  if (completionRate === undefined || completionRate === null || isNaN(completionRate)) {
    // 如果 API 未提供，则根据 confirmedAppointments / totalAppointments 自行计算
    // 【修正】移除重复且危险的 const stats = dashboardList.value.appointmentStats;
    const total = stats.totalAppointments || 0;
    const confirmed = stats.confirmedAppointments || 0;

    if (total > 0) {
      completionRate = (confirmed / total) * 100;
    } else {
      completionRate = 0;
    }
  }

  // 确保 completionRate 是有效的数字，并限制在 0-100 范围内
  completionRate = Number(completionRate);
  completionRate = Math.max(0, Math.min(100, isNaN(completionRate) ? 0 : completionRate));

  return completionRate;
}

// 数据加载完成后初始化图表
const initChartAfterDataLoaded = async () => {
  // 使用 nextTick (或 setTimeout 0) 确保 DOM 已更新
  await new Promise(resolve => setTimeout(resolve, 0));
  const completionRate = calculateCompletionRate();
  initChart1(completionRate);

  // 【新增】初始化折线图
  // 假设趋势数据在 dashboardList.value.trendData 中，如果 API 没有，则使用空数组
  initChart2(dashboardList.value?.trendData || []);
}


// 圆形图 (Gauge Chart) 逻辑
let myChart1 = null
const initChart1 = (data) => {
  const chartDom = document.getElementById('main2');
  if (!chartDom) {
    console.warn('图表 DOM 元素不存在');
    return;
  }

  let chartValue = data;
  if (data === undefined || data === null || isNaN(data)) {
    console.warn('预约完成率数据无效，使用默认值 0');
    chartValue = 0;
  } else {
    chartValue = Number(data);
    chartValue = Math.max(0, Math.min(100, chartValue));
  }

  if (!myChart1) {
    myChart1 = echarts.init(chartDom);
  }

  const gaugeData = [
    {
      value: chartValue,
      title: {
        offsetCenter: ['0%', '-30%']
      },
      detail: {
        valueAnimation: true,
        offsetCenter: ['0%', '-20%']
      }
    },
  ];

  const option = {
    series: [
      {
        type: 'gauge',
        startAngle: 90,
        endAngle: -270,
        min: 0,
        max: 100,
        pointer: {
          show: false
        },
        progress: {
          show: true,
          overlap: false,
          roundCap: true,
          clip: false,
          itemStyle: {
            borderWidth: 1,
            borderColor: '#464646'
          }
        },
        axisLine: {
          lineStyle: {
            width: 10
          }
        },
        splitLine: {
          show: false,
          distance: 0,
          length: 10
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          show: false,
          distance: 50
        },
        data: gaugeData,
        title: {
          fontSize: 14
        },
        detail: {
          width: 50,
          height: 14,
          fontSize: 14,
          color: 'inherit',
          borderColor: 'inherit',
          borderRadius: 20,
          borderWidth: 1,
          formatter: '{value}%'
        }
      }
    ]
  };
  myChart1.setOption(option);
}

// 【新增】折线图 (Line Chart) 逻辑
let myChart2 = null
const initChart2 = (trendData) => {
    const chartDom = document.getElementById('main1');
    // 【健壮性检查】检查 DOM 元素是否存在且尺寸非零
    if (!chartDom || chartDom.clientWidth === 0 || chartDom.clientHeight === 0) {
        console.warn('折线图 DOM 元素不存在或尺寸为零，跳过初始化。');
        return;
    }

    if (!myChart2) {
      myChart2 = echarts.init(chartDom);
    }

    // 假设 trendData 结构为 [{ month: '2023-01', appointments: 5 }, ...]
    const categories = Array.isArray(trendData) ? trendData.map(d => d.month || '未知') : [];
    const seriesData = Array.isArray(trendData) ? trendData.map(d => d.appointments || 0) : [];

    const option = {
        title: { text: '近五月预约趋势', left: 'center', show: false },
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories
        },
        yAxis: { type: 'value' },
        series: [{
            name: '预约数',
            type: 'line',
            data: seriesData,
            smooth: true
        }],
    };
    myChart2.setOption(option);
}

// 监听窗口大小变化
const onResize = () => {
    if (myChart1) {
        myChart1.resize();
    }
    if (myChart2) {
        myChart2.resize();
    }
}

// -------------------- 生命周期钩子 --------------------

onMounted(() => {
  // 首次加载时调用数据获取函数
  fetchDashboardData();
  // 【新增】监听页面 resize，以便图表能响应式调整
  window.addEventListener('resize', onResize);
});

// 监听 dashboardList 变化，当数据更新时重新初始化图表
watch(
  () => dashboardList.value?.appointmentStats,
  (newStats) => {
    if (newStats) {
      const completionRate = calculateCompletionRate();
      setTimeout(() => {
        initChart1(completionRate);
        initChart2(dashboardList.value?.trendData || []); // 【新增】
      }, 0);
    }
  },
  { deep: true, immediate: false }
);

// 组件卸载时清理资源
onBeforeUnmount(() => {
  if (myChart1) {
    myChart1.dispose();
    myChart1 = null;
  }
  if (myChart2) { // 【新增】清理 myChart2
    myChart2.dispose();
    myChart2 = null;
  }
  // 【新增】移除 resize 监听器
  window.removeEventListener('resize', onResize);
});

</script>

<style scoped>
/* ************************************************* */
/* *************** 仪表盘页面样式 ****************** */
/* ************************************************* */

.dashboard-page {
  padding: 20px;
  background-color: #f7f9fc;
  min-height: 100%;
}

.page-title {
  font-size: 24px;
  color: #3b5998;
  margin-bottom: 25px;
  font-weight: 600;
  border-bottom: 2px solid #e0e6ed;
  padding-bottom: 10px;
}

/* --- 统计卡片布局 --- */
.stats-grid {
  display: grid;
  /* 调整列布局以适应截图中的大卡片 */
  grid-template-columns: 2fr 1fr 3fr;
  grid-template-rows: auto auto;
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background-color: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 18px;
  color: #333;
  margin-bottom: 15px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #3b5998;
  margin-top: 5px;
}

/* 截图中的第一张卡片样式 */
.primary-card {
  background-color: #e6f7ff;
  /* 淡蓝色背景 */
  border: 1px solid #91d5ff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.primary-card .stat-value {
  font-size: 36px;
  color: #1890ff;
}

.primary-card .stat-label {
  font-size: 14px;
  color: #69c0ff;
  margin-bottom: 5px;
}

.primary-card .divider {
  height: 1px;
  background-color: #bae7ff;
  margin: 10px 0;
}

.primary-card .appointment-icon {
  width: 60px;
  height: 60px;
  background-color: #1890ff;
  border-radius: 50%;
  opacity: 0.1;
}

/* 趋势图卡片样式 */
.wide-card {
  grid-column: 3 / span 1;
  /* 占据第三列 */
}

/* --- 圆环图占位样式 --- */
.chart-card {
  display: flex;
  justify-content: center;
  align-items: center;
}

.pie-chart-placeholder {
  width: 150px;
  height: 150px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.pie-ring {
  width: 100%;
  height: 100%;
  border: 15px solid #e0e6ed;
  border-radius: 50%;
  position: absolute;
  /* 模拟蓝色进度 */
  border-top-color: #3b5998;
  transform: rotate(45deg);
}

.pie-text {
  font-size: 14px;
  color: #3b5998;
  position: relative;
}

/* --- 折线图占位样式 --- */
.line-chart-placeholder {
  height: 200px;
  background-color: #f7f9fc;
  border: 1px dashed #d9d9d9;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
}

/* 【新增/修正】确保折线图容器有明确尺寸 */
#main1 {
    width: 100%;
    height: 100%;
}

/* --- 底部详细部分 --- */
.detail-section {
  background-color: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 18px;
  color: #333;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.list-placeholder {
  min-height: 200px;
  color: #999;
  display: flex;
  justify-content: center;
  align-items: center;
}

#main2 {
  width: 200px;
  height: 400px;
}
</style>
