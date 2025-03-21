console.log("check.js loaded");
// 检测课程详情界面
function CheckCoursesTable() {
  console.log("CheckCoursesTable_start");
  let tableEs = getCoursesTable_1();

  if(!tableEs) {
    tableEs = getCoursesTable_2();
  };

  if (!tableEs) {
    console.log("未找到课程表格");
    return;
  };

  const { thead, tbody } = tableEs;
  
  addScoreAndEvaluateColumn(thead, tbody, false);

  // 处理补选/重修界面搜索，翻页等操作只更新tbody内部节点而导致的不重载的问题
  // 方法：监听tbody的变化，重新加载tbody
  const debouncedTbodyObserverCallback = debounce(tbodyObserverCallback(thead, tbody), 500);
  const tbodyObserver = new MutationObserver(debouncedTbodyObserverCallback);
  tbodyObserver.observe(tbody, config)


  console.log("CheckCoursesTable_end");
}

// 获取课程表格的thead和tbody元素，适配常规情况
function getCoursesTable_1() {
  // 先定位 id 为 mainTable 的 table
  let mtable = document.querySelector("#mainTable");
  if (!mtable) {
    console.log("未找到 id 为 mainTable 的 table");
    return null;
  }

  // 再定位 class 为 grid 的 div
  let div = mtable.querySelector(".grid");
  if (!div) {
    console.log("未找到 class 为 grid 的 div");
    return null;
  }

  // 从 div 中获取 class 为 gridhead 的 <thead> 节点
  let thead = div.querySelector("thead.gridhead");
  if (!thead) {
    console.log("未找到 <thead> 节点");
    return null;
  }

  // 如果 <thead> 已经有 class，则不再处理
  if (thead.classList.contains("comment-thead")) {
    console.log("已经处理过 <thead> 节点");
    return null;
  }

  // 给 thead 添加 class
  thead.classList.add("comment-thead");

  // 获取 <thead> 所属的 <table>
  let table = thead.closest("table");
  if (!table) {
    console.log("未找到包含 <thead> 的 <table>");
    return null;
  }

  // 在该 <table> 内查找 <tbody> 节点
  let tbody = table.querySelector("tbody");
  if (!tbody) {
    console.log("未找到 <tbody> 节点");
    return null;
  }

  console.log("成功获取课程表格的 thead 和 tbody");
  return { thead, tbody };
}

// 获取课程表格的thead和tbody元素，适配学期选课界面和教务系统页面刷新后的异常情况
function getCoursesTable_2() {
  // 先定位 class 为 grid 的 div
  let div = document.querySelector(".grid");
  if (!div) {
    console.log("未找到 class 为 grid 的 div");
    return null;
  }

  // 从 div 中获取 class 为 gridtable 的 <table> 节点
  let table = div.querySelector(".gridtable");
  if (!table) {
    console.log("未找到 class 为 gridtable 的 <table> 节点");
    // 从 div 中获取第一个 直接子<table> 节点
    const tables = div.querySelectorAll("table")
    for (let i = 0; i < tables.length; i++) {
      if (tables[i].parentNode == div) {
        table = tables[i];
        break;
      }
    }
  }
  if(!table) {
    console.log("未找到 <table> 节点");
    return null;
  }

  // 从 table 中获取 <thead> 节点
  let thead = table.querySelector("thead");
  if (!thead) {
    console.log("未找到 <thead> 节点");
    return null;
  }
  // 如果 <thead> 已经有 class，则不再处理
  if (thead.classList.contains("comment-thead")) {
    console.log("已经处理过 <thead> 节点");
    return null;
  }

  // 给 thead 添加 class
  thead.classList.add("comment-thead");

  // 在该 <table> 内查找 <tbody> 节点
  let tbody = table.querySelector("tbody");

  if (!tbody) {
    console.log("未找到 <tbody> 节点");
    return null;
  }

  console.log("成功获取课程表格的 thead 和 tbody");
  return { thead, tbody };
}

// 防抖函数：在等待时间内如果再次调用，则重新计时
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// 页面观察者的回调函数
const pageObserverCallback = (mutationsList, observer) => {
    CheckCoursesTable();
};

// 表格观察者的回调函数
const tbodyObserverCallback = (thead, tbody) => (mutationsList, observer) => {
  addScoreAndEvaluateColumn(thead, tbody, true);
};

// 创建防抖后的回调函数，设置等待时间为 500 毫秒
const debouncedPageObserverCallback = debounce(pageObserverCallback, 500);


// 创建 MutationObserver 实例并传入防抖后的回调函数
const pageObserver = new MutationObserver(debouncedPageObserverCallback);

// 配置观察选项
const config = { childList: true, subtree: true };

// 开始观察目标节点
pageObserver.observe(document.body, config);
