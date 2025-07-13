// -- 全局常量与状态 --
const ITEMS_PER_PAGE = 10;
const platformResults = new Map(); // 使用 Map 存储每个平台的结果和当前页码

// -- DOM 元素获取 --
const searchForm = document.getElementById("searchForm");
const resultsDiv = document.getElementById("results");
const errorDiv = document.getElementById("error");
const progressBar = document.getElementById("progressBar");
const searchBtn = document.getElementById("searchBtn");
const searchBtnText = document.getElementById("searchBtnText");
const searchIcon = searchBtn?.querySelector("i");

/**
 * 页面加载后初始化
 */
window.addEventListener("DOMContentLoaded", () => {
  if (searchBtn) searchBtn.disabled = false;

  // --- 主要修改点 ---
  // 默认勾选“启用魔法”复选框
  const magicCheckbox = document.getElementById("magicAccess");
  if (magicCheckbox) {
    magicCheckbox.checked = true;
  }
  // --- 修改结束 ---

  // 初始化 quicklink 和 Artalk
  quicklink.listen({ priority: true });
  Artalk.init({
    el: "#Comments",
    pageKey: "https://searchgal.homes",
    server: "https://artalk.saop.cc",
    site: "Galgame 聚合搜索",
  });

  // 为表单和分页按钮绑定事件监听器
  if (searchForm) {
    searchForm.addEventListener("submit", handleSearchSubmit);
  }
  if (resultsDiv) {
    resultsDiv.addEventListener("click", handlePaginationClick);
  }
});

/**
 * 统一处理搜索表单提交
 * @param {Event} e 事件对象
 */
async function handleSearchSubmit(e) {
  e.preventDefault();
  clearUI();

  const formData = new FormData(searchForm);
  const gameName = formData.get("game").trim();
  const zypassword = formData.get("zypassword").trim();
  const searchMode = formData.get("searchMode");
  // 此处的逻辑无需改变，它会正确读取复选框的状态
  const magic = document.getElementById("magicAccess")?.checked || false;

  if (!gameName) {
    showError("游戏名称不能为空");
    return;
  }

  setLoadingState(true);

  const searchParams = {
    gameName,
    zypassword,
    magic,
    patchMode: searchMode === "patch",
  };

  try {
    let totalTasks = 0;
    let isFirstResult = true;

    await searchGameStream(searchParams, {
      onTotal: (total) => {
        totalTasks = total;
      },
      onProgress: (progress) => {
        if (progressBar && totalTasks > 0) {
          const percent = Math.min(
            100,
            Math.round((progress.completed / totalTasks) * 100)
          );
          progressBar.style.width = `${percent}%`;
        }
        if (searchBtnText) {
          searchBtnText.textContent = `进度: ${progress.completed} / ${totalTasks}`;
        }
      },
      onResult: (result) => {
        platformResults.set(result.name, {
          ...result,
          items: result.items || [],
          currentPage: 1,
        });
        const platformCard = createPlatformCard(result, isFirstResult);
        resultsDiv.appendChild(platformCard);
        isFirstResult = false;
      },
      onDone: () => {
        if (searchBtnText) searchBtnText.textContent = "搜索完成！";
        setTimeout(() => setLoadingState(false), 1200);
      },
      onError: (err) => {
        showError(err.message);
        setLoadingState(false);
      },
    });
  } catch (err) {
    showError(err.message || "发生未知错误");
    setLoadingState(false);
  }
}

/**
 * 【关键修复】处理分页按钮点击（事件委托）
 * @param {Event} e 点击事件
 */
function handlePaginationClick(e) {
  const button = e.target.closest(".prev-page-btn, .next-page-btn");
  if (!button || button.disabled) return;

  const platformName = button.dataset.platform;
  const platformData = platformResults.get(platformName);

  if (!platformData) {
    console.error(`错误：找不到平台 "${platformName}" 的数据。`);
    return;
  }

  const isNext = button.classList.contains("next-page-btn");
  const totalPages = Math.ceil(platformData.items.length / ITEMS_PER_PAGE);
  let newPage = platformData.currentPage + (isNext ? 1 : -1);

  if (newPage < 1 || newPage > totalPages) return;

  platformData.currentPage = newPage;
  platformResults.set(platformName, platformData);

  const oldCard = resultsDiv.querySelector(
    `div[data-platform="${platformName}"]`
  );
  if (oldCard) {
    const newCard = createPlatformCard(platformData, false);
    oldCard.replaceWith(newCard);
  }
}

/**
 * 根据平台结果数据创建 HTML 卡片元素
 * @param {object} result - 单个平台的结果数据
 * @param {boolean} withAnimation - 是否应用入场动画
 * @returns {HTMLElement}
 */
function createPlatformCard(result, withAnimation = true) {
  const currentPage = result.currentPage || 1;
  const colorMap = {
    lime: {
      bg: "bg-lime-100",
      text: "text-lime-700",
      icon: "text-lime-400",
      border: "border-lime-200",
    },
    white: {
      bg: "bg-gray-50",
      text: "text-gray-500",
      icon: "text-gray-300",
      border: "border-gray-100",
    },
    gold: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      icon: "text-yellow-400",
      border: "border-yellow-200",
    },
    red: {
      bg: "bg-red-100",
      text: "text-red-700",
      icon: "text-red-400",
      border: "border-red-200",
    },
    default: {
      bg: "bg-gradient-to-br from-indigo-100 via-white to-pink-50",
      text: "text-indigo-700",
      icon: "text-indigo-400",
      border: "border-gray-100",
    },
  };
  const colorKey =
    result.color && colorMap[result.color] ? result.color : "default";
  const color = colorMap[colorKey];

  let home = "",
    domain = "";
  if (result.items && result.items.length > 0) {
    try {
      const url = new URL(result.items[0].url);
      home = url.origin;
      domain = url.hostname;
    } catch {}
  }

  const tags = {
    gold: '<span class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-yellow-400 text-white align-middle">需要魔法</span>',
    lime: '<span class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-lime-400 text-white align-middle">无需登录</span>',
    red: '<span class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-red-400 text-white align-middle">错误</span>',
    white:
      '<span class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-gray-300 text-gray-700 align-middle">需要登录</span>',
    default:
      '<span class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-indigo-200 text-indigo-700 align-middle">综合</span>',
  };
  const tag = tags[colorKey] || "";

  let itemsHtml = "";
  if (result.items && result.items.length > 0) {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const paginatedItems = result.items.slice(start, end);

    itemsHtml = `<ol class="divide-y divide-gray-100" data-items>
            ${paginatedItems
              .map((item) => {
                let decodedPath = "";
                try {
                  const urlObj = new URL(item.url);
                  decodedPath = decodeURIComponent(
                    urlObj.pathname + (urlObj.search || "")
                  );
                } catch {}
                const displayName =
                  item.name === ".bzEmpty" || !item.name
                    ? "未知文件"
                    : item.name;
                return `<li class="group transition hover:bg-indigo-50 flex flex-col px-5 py-3">
                    <a href="${item.url}" target="_blank" class="font-medium text-gray-800 group-hover:text-indigo-700 text-sm flex items-center gap-1" title="访问具体页面">
                        <span class="truncate">${displayName}</span>
                        <i class="fas fa-arrow-up-right-from-square text-gray-300 group-hover:text-indigo-400 ml-1"></i>
                    </a>
                    <span class="text-xs text-gray-400 mt-0.5 ml-1 break-all block w-full">${decodedPath}</span>
                </li>`;
              })
              .join("")}
        </ol>`;
  } else if (!result.error) {
    itemsHtml = '<div class="px-5 py-3 text-gray-400 italic">暂无结果</div>';
  }

  let paginationHtml = "";
  if (result.items.length > ITEMS_PER_PAGE) {
    const totalPages = Math.ceil(result.items.length / ITEMS_PER_PAGE);
    const prevDisabled = currentPage === 1;
    const nextDisabled = currentPage === totalPages;
    paginationHtml = `<div class="px-5 py-3 flex justify-center gap-2">
            <button class="prev-page-btn bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 focus:ring-2 focus:ring-indigo-300 ${
              prevDisabled ? "opacity-50 cursor-not-allowed" : ""
            }" data-platform="${result.name}" ${
      prevDisabled ? "disabled" : ""
    }>上一页</button>
            <span class="text-gray-600 self-center">第 ${currentPage} 页 / 共 ${totalPages} 页</span>
            <button class="next-page-btn bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 focus:ring-2 focus:ring-indigo-300 ${
              nextDisabled ? "opacity-50 cursor-not-allowed" : ""
            }" data-platform="${result.name}" ${
      nextDisabled ? "disabled" : ""
    }>下一页</button>
        </div>`;
  }

  const cardHtml = `
        <div class="flex items-center gap-2 px-5 py-3 bg-white/80 border-b ${
          color.border
        }">
            <i class="fas fa-dice-d6 ${color.icon}"></i>
            <a href="${home}" target="_blank" class="flex items-center gap-2 group/link outline-none focus:ring-2 focus:ring-indigo-300 rounded" title="访问站点首页">
                <span class="text-lg font-bold ${
                  color.text
                } group-hover/link:text-indigo-800">${result.name}${tag}</span>
                <span class="text-xs text-gray-400 group-hover/link:text-indigo-400 ml-2">${domain}</span>
            </a>
        </div>
        ${
          result.error
            ? `<div class="px-5 py-3 text-red-500 font-semibold flex items-center gap-2"><i class='fas fa-exclamation-circle'></i> ${result.error}</div>`
            : ""
        }
        ${itemsHtml}
        ${paginationHtml}
    `;

  const cardElement = document.createElement("div");
  cardElement.dataset.platform = result.name;
  cardElement.className = `mb-6 rounded-xl shadow-lg rounded-t-2xl ${
    color.bg
  } border ${color.border} overflow-hidden ${
    withAnimation ? "animate__animated animate__fadeInUp" : ""
  }`;
  cardElement.innerHTML = cardHtml;

  return cardElement;
}

/**
 * 重置/清空UI界面
 */
function clearUI() {
  resultsDiv.innerHTML = "";
  errorDiv.textContent = "";
  if (progressBar) {
    progressBar.style.width = "0%";
    progressBar.style.opacity = "0";
  }
  platformResults.clear();
}

/**
 * 显示错误信息
 * @param {string} message 错误消息
 */
function showError(message) {
  errorDiv.textContent = message;
}

/**
 * 设置UI的加载状态
 * @param {boolean} isLoading 是否正在加载
 */
function setLoadingState(isLoading) {
  if (!searchBtn || !searchIcon) return;

  const originalIconClass = searchIcon.dataset.originalClass || "fas fa-search";
  if (isLoading) {
    if (!searchIcon.dataset.originalClass) {
      searchIcon.dataset.originalClass = searchIcon.className;
    }
    searchBtn.disabled = true;
    searchBtn.classList.add("active");
    searchIcon.className = "fas fa-spinner fa-spin";
    if (searchBtnText) searchBtnText.textContent = "正在初始化...";
    if (progressBar) {
      progressBar.style.opacity = "1";
      progressBar.classList.remove("hidden");
    }
  } else {
    searchBtn.disabled = false;
    searchBtn.classList.remove("active");
    searchIcon.className = originalIconClass;
    if (searchBtnText) searchBtnText.textContent = "开始搜索";
    if (progressBar) {
      setTimeout(() => {
        progressBar.style.opacity = "0";
      }, 800);
    }
  }
}

/**
 * 调用后端流式搜索API
 * @param {object} params - 搜索参数
 * @param {string} params.gameName - 游戏名
 * @param {boolean} [params.magic=false] - 是否开启魔法搜索
 * @param {string} [params.zypassword=''] - Zypassword
 * @param {boolean} [params.patchMode=false] - 是否为补丁搜索模式
 * @param {object} callbacks - 回调函数集合
 * @param {function} callbacks.onTotal - 接收到总数时调用
 * @param {function} callbacks.onProgress - 接收到进度时调用
 * @param {function} callbacks.onResult - 接收到单个结果时调用
 * @param {function} callbacks.onDone - 全部完成时调用
 * @param {function} callbacks.onError - 发生错误时调用
 */
async function searchGameStream(
  { gameName, magic = false, zypassword = "", patchMode = false },
  { onTotal, onProgress, onResult, onDone, onError }
) {
  const site = "api.searchgal.homes";
  const protocol = "https";
  const url = patchMode
    ? `${protocol}://${site}/search-patch`
    : `${protocol}://${site}/search-gal`;

  const formData = new FormData();
  formData.append("game", gameName);
  formData.append("magic", String(magic));
  if (zypassword) {
    formData.append("zypassword", zypassword);
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP 错误！状态码: ${response.status}`
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (line.trim() === "") continue;
        try {
          const data = JSON.parse(line);
          if (data.total && onTotal) {
            onTotal(data.total);
          } else if (data.progress) {
            if (onProgress) onProgress(data.progress);
            if (data.result && onResult) onResult(data.result);
          } else if (data.done && onDone) {
            onDone();
            return;
          }
        } catch (e) {
          console.error("无法解析JSON行:", line, e);
        }
      }
    }
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      throw error;
    }
  }
}
