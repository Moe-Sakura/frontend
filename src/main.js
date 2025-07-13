// -- 全局常量与状态 --
const ITEMS_PER_PAGE = 10;
const platformResults = new Map();

// -- DOM 元素获取 --
const searchForm = document.getElementById("searchForm");
const resultsDiv = document.getElementById("results");
const errorDiv = document.getElementById("error");
const progressBar = document.getElementById("progressBar");
const searchBtn = document.getElementById("searchBtn");
const searchBtnText = document.getElementById("searchBtnText");
const searchIcon = searchBtn?.querySelector("i");
const customApiInput = document.getElementById("customApi");

let siteNavigationDiv;
let toggleNavButton;
let navLinksContainer;
let isNavCollapsed = false; // Track navigation state for mobile
let isMobileView = false; // Track if we are in mobile view
let siteNavOriginalTop = 0; // Store the original top position of the navigation bar

/**
 * 页面加载后初始化
 */
window.addEventListener("DOMContentLoaded", () => {
  if (searchBtn) searchBtn.disabled = false;

  const magicCheckbox = document.getElementById("magicAccess");
  if (magicCheckbox) {
    magicCheckbox.checked = true;
  }

  quicklink.listen({ priority: true });
  Artalk.init({
    el: "#Comments",
    pageKey: "https://searchgal.homes",
    server: "https://artalk.saop.cc",
    site: "Galgame 聚合搜索",
  });

  siteNavigationDiv = document.createElement("div");
  siteNavigationDiv.id = "siteNavigation";
  // Initial class names, will be adjusted by updateNavigationLayout
  siteNavigationDiv.className =
    "z-20 flex flex-col items-center animate__animated animate__fadeInUp animate__faster hidden rounded-t-xl";
  document.body.appendChild(siteNavigationDiv); // Still append to body for flexible positioning

  navLinksContainer = document.createElement("div");
  // Added max-h-40 overflow-y-auto for scrollability
  navLinksContainer.className =
    "nav-links-container flex flex-wrap gap-2 justify-center w-full max-h-40 overflow-y-auto";
  siteNavigationDiv.appendChild(navLinksContainer);

  toggleNavButton = document.createElement("button");
  toggleNavButton.id = "toggleNavButton";
  toggleNavButton.className =
    "absolute -top-7 right-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-t-lg text-xs hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 z-30 opacity-75 hover:opacity-100 transition-opacity animate__animated animate__fadeInUp animate__faster hidden";
  toggleNavButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
  siteNavigationDiv.appendChild(toggleNavButton);

  siteNavigationDiv.addEventListener("click", (e) => {
    const targetLink = e.target.closest('a[href^="#"]');
    if (targetLink) {
      e.preventDefault();
      const targetId = targetLink.getAttribute("href").substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const viewportHeight = window.innerHeight;
        const scrollOffset = viewportHeight * 0.25;

        const elementPosition =
          targetElement.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: elementPosition - scrollOffset,
          behavior: "smooth",
        });
      }
    }
  });

  toggleNavButton.addEventListener("click", () => {
    isNavCollapsed = !isNavCollapsed; // Toggle collapse state
    updateNavigationLayout(); // Update layout based on new state
  });

  // Initial layout update and event listeners
  updateNavigationLayout();
  updateSiteNavigation();

  if (searchForm) {
    searchForm.addEventListener("submit", handleSearchSubmit);
  }
  if (resultsDiv) {
    resultsDiv.addEventListener("click", handlePaginationClick);
  }

  // Recalculate navigation width/position on window resize and layout change
  window.addEventListener(
    "resize",
    debounce(() => {
      updateNavigationLayout(); // Update layout (fixed/absolute, bottom/top)
      updateSiteNavigationWidth(); // Update width
    }, 200)
  );

  // Scroll event listener for desktop fixed navigation
  window.addEventListener("scroll", debounce(handleScroll, 10));
});

/**
 * 处理页面滚动事件，用于桌面端导航栏固定
 */
function handleScroll() {
  if (!siteNavigationDiv || isMobileView) return;

  const currentScrollY = window.scrollY;

  // If the scroll position is past the original top of the navigation
  if (currentScrollY > siteNavOriginalTop) {
    // Add fixed class if not already fixed
    if (!siteNavigationDiv.classList.contains("fixed-nav")) {
      // Save current computed width to prevent reflow issues when changing to fixed
      siteNavigationDiv.style.width = siteNavigationDiv.offsetWidth + "px";
      siteNavigationDiv.classList.add(
        "fixed-nav",
        "fixed",
        "top-0",
        "left-1/2",
        "-translate-x-1/2",
        "bg-gray-100/95",
        "shadow-lg",
        "rounded-b-xl",
        "animate__animated",
        "animate__fadeInDown",
        "animate__faster"
      );
      siteNavigationDiv.classList.remove(
        "absolute",
        "rounded-t-xl",
        "rounded-none",
        "shadow"
      ); // Remove absolute positioning and other rounded styles
      siteNavigationDiv.style.top = ""; // Clear inline top from absolute positioning
      siteNavigationDiv.style.left = ""; // Clear inline left from absolute positioning

      // Add margin to resultsDiv to prevent content jump
      resultsDiv.style.marginTop = `${siteNavigationDiv.offsetHeight + 24}px`;
    }
  } else {
    // Revert to original absolute position if scrolled back up
    if (siteNavigationDiv.classList.contains("fixed-nav")) {
      siteNavigationDiv.classList.remove(
        "fixed-nav",
        "fixed",
        "top-0",
        "left-1/2",
        "-translate-x-1/2",
        "bg-gray-100/95",
        "shadow-lg",
        "rounded-b-xl",
        "animate__animated",
        "animate__fadeInDown",
        "animate__faster"
      );
      siteNavigationDiv.classList.add("absolute", "rounded-b-xl", "shadow"); // Add back original absolute styles
      // Restore original position
      updateSiteNavigationWidth(); // This will recalculate and set top/left
      resultsDiv.style.marginTop = `${siteNavigationDiv.offsetHeight + 24}px`; // Ensure correct margin
    }
  }
}

/**
 * 根据屏幕宽度调整导航栏布局 (fixed/absolute, top/bottom)
 */
function updateNavigationLayout() {
  if (!siteNavigationDiv || !resultsDiv) return;

  const breakpoint = 768; // Tailwind's 'md' breakpoint
  isMobileView = window.innerWidth < breakpoint;

  // Reset all position-related classes first
  siteNavigationDiv.classList.remove(
    "fixed",
    "absolute",
    "bottom-0",
    "top-0",
    "left-1/2",
    "-translate-x-1/2",
    "rounded-t-xl",
    "rounded-b-xl",
    "fixed-nav",
    "bg-white/95",
    "bg-gray-100/90",
    "shadow",
    "shadow-lg",
    "shadow-inner", // Also remove shadow-inner here for a clean reset
    "border",
    "border-gray-100",
    "animate__fadeInDown",
    "animate__faster",
    "p-0",
    "p-2",
    "py-1",
    "px-2", // Reset all padding classes
    "min-h-7", // Reset height class
    "mb-2" // Remove potential mobile margin for clean reset
  );
  siteNavigationDiv.style.left = ""; // Clear inline style set by desktop positioning
  siteNavigationDiv.style.top = ""; // Clear inline style set by desktop positioning
  siteNavigationDiv.style.width = ""; // Clear inline width

  if (isMobileView) {
    siteNavigationDiv.classList.add(
      "fixed",
      "bottom-0",
      "left-1/2",
      "-translate-x-1/2",
      "rounded-t-xl",
      "bg-white/95",
      "mb-2" // Add margin-bottom for mobile
    );
    toggleNavButton.classList.remove("hidden");
    resultsDiv.style.marginTop = ""; // Clear desktop specific margin

    if (isNavCollapsed) {
      navLinksContainer.classList.add("hidden");
      navLinksContainer.classList.remove(
        "animate__animated",
        "animate__fadeIn"
      );
      toggleNavButton.innerHTML = '<i class="fas fa-chevron-up"></i>';
      // Mobile collapsed: Small padding, no shadow, no border
      siteNavigationDiv.classList.add("py-1", "px-2", "min-h-7"); // Changed p-0 to py-1 px-2
    } else {
      navLinksContainer.classList.remove("hidden");
      navLinksContainer.classList.add("animate__animated", "animate__fadeIn");
      toggleNavButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
      // Mobile expanded: Padding, shadow, border
      siteNavigationDiv.classList.add(
        "p-2",
        "shadow-inner",
        "border",
        "border-gray-100"
      );
    }
    // Ensure that fixed-nav class is not present in mobile view
    siteNavigationDiv.classList.remove("fixed-nav");
  } else {
    // Desktop view: absolute positioning relative to resultsDiv
    siteNavigationDiv.classList.add(
      "absolute",
      "rounded-b-xl",
      "bg-gray-100/90",
      "shadow",
      "border",
      "border-gray-100"
    );
    toggleNavButton.classList.add("hidden"); // No toggle button on desktop
    navLinksContainer.classList.remove("hidden", "animate__fadeIn"); // Always expanded on desktop
    siteNavigationDiv.classList.add("p-2", "shadow-inner"); // Always show padding/shadow on desktop
    isNavCollapsed = false; // Reset mobile collapse state for desktop

    // This will be handled by handleScroll for fixed positioning after scroll
    // Initially, it's positioned absolutely above resultsDiv
    updateSiteNavigationWidth();
  }
  // Update original top position after layout changes for scroll handling
  siteNavOriginalTop =
    siteNavigationDiv.getBoundingClientRect().top + window.scrollY;
}

/**
 * 统一处理搜索表单提交
 * @param {Event} e 事件对象
 */
async function handleSearchSubmit(e) {
  e.preventDefault();
  platformResults.clear();
  clearUI();

  resultsDiv.classList.add(
    "animate__animated",
    "animate__fadeOut",
    "animate__faster"
  );
  resultsDiv.addEventListener(
    "animationend",
    function handler() {
      this.classList.remove(
        "animate__animated",
        "animate__fadeOut",
        "animate__faster"
      );
      this.removeEventListener("animationend", handler);

      const formData = new FormData(searchForm);
      const gameName = formData.get("game").trim();
      const zypassword = formData.get("zypassword").trim();
      const searchMode = formData.get("searchMode");
      const magic = document.getElementById("magicAccess")?.checked || false;
      const customApi = customApiInput ? customApiInput.value.trim() : "";

      if (!gameName) {
        showError("游戏名称不能为空");
        setLoadingState(false);
        return;
      }

      setLoadingState(true);

      const searchParams = {
        gameName,
        zypassword,
        magic,
        patchMode: searchMode === "patch",
        customApi,
      };

      let totalTasks = 0;

      searchGameStream(searchParams, {
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
          const platformCard = createPlatformCard(result, true);
          resultsDiv.appendChild(platformCard);
          updateSiteNavigation();
        },
        onDone: () => {
          if (searchBtnText) searchBtnText.textContent = "搜索完成！";
          setTimeout(() => setLoadingState(false), 1200);
          updateNavigationLayout(); // Re-evaluate layout after results are done
          // After results are done and nav layout is updated, set original top for scroll
          siteNavOriginalTop =
            siteNavigationDiv.getBoundingClientRect().top + window.scrollY;
          handleScroll(); // Check if it should be fixed immediately after search
        },
        onError: (err) => {
          showError(err.message);
          setLoadingState(false);
        },
      }).catch((err) => {
        showError(err.message || "发生未知错误");
        setLoadingState(false);
      });
    },
    { once: true }
  );
}

/**
 * 处理分页按钮点击（事件委托）
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
    newCard.classList.add(
      "animate__animated",
      "animate__fadeIn",
      "animate__faster"
    );
    newCard.addEventListener(
      "animationend",
      function handler() {
        this.classList.remove(
          "animate__animated",
          "animate__fadeIn",
          "animate__faster"
        );
        this.removeEventListener("animationend", handler);
      },
      { once: true }
    );
  }
}

/**
 * 动态设置导航栏宽度和桌面端定位
 */
function updateSiteNavigationWidth() {
  if (!siteNavigationDiv) return;

  const firstCard = resultsDiv.querySelector("[data-platform]");
  if (firstCard) {
    const cardWidth = firstCard.offsetWidth;
    siteNavigationDiv.style.width = `${cardWidth}px`;

    if (!isMobileView && !siteNavigationDiv.classList.contains("fixed-nav")) {
      // Desktop specific positioning AND not yet fixed
      const resultsRect = resultsDiv.getBoundingClientRect();
      const siteNavRect = siteNavigationDiv.getBoundingClientRect();

      const desiredTop = resultsRect.top + window.scrollY;

      // Calculate left to center it horizontally within resultsDiv's max-width
      const resultsDivLeftOffset = resultsDiv.getBoundingClientRect().left;
      const windowWidth = window.innerWidth;
      const resultsDivCenter =
        resultsDivLeftOffset + resultsDiv.offsetWidth / 2;
      const navLeft = resultsDivCenter - siteNavigationDiv.offsetWidth / 2;

      siteNavigationDiv.style.left = `${navLeft}px`;
      siteNavigationDiv.style.top = `${
        desiredTop - siteNavigationDiv.offsetHeight
      }px`; // Place above resultsDiv
      siteNavigationDiv.classList.add("bg-gray-100/90", "shadow"); // Ensure desktop styling
      siteNavigationDiv.classList.remove(
        "bottom-0",
        "left-1/2",
        "-translate-x-1/2",
        "rounded-t-xl",
        "bg-white/95"
      );

      resultsDiv.style.marginTop = `${siteNavigationDiv.offsetHeight + 24}px`; // Add some margin below nav
    } else if (isMobileView) {
      // Mobile view: fixed bottom, centered
      // Ensure no lingering desktop positioning
      siteNavigationDiv.style.left = "";
      siteNavigationDiv.style.top = "";
      siteNavigationDiv.classList.add(
        "fixed",
        "bottom-0",
        "left-1/2",
        "-translate-x-1/2",
        "rounded-t-xl",
        "bg-white/95"
      );
      siteNavigationDiv.classList.remove(
        "top-0",
        "absolute",
        "rounded-b-xl",
        "shadow",
        "bg-gray-100/90",
        "fixed-nav"
      );
      resultsDiv.style.marginTop = ""; // Remove desktop margin
    }
  } else {
    siteNavigationDiv.style.width = "";
    siteNavigationDiv.style.left = "";
    siteNavigationDiv.style.top = "";
    siteNavigationDiv.classList.add("hidden"); // Hide if no cards
    resultsDiv.style.marginTop = ""; // Ensure margin is reset if no cards
  }
  // Update the original top position whenever navigation layout or width changes
  siteNavOriginalTop =
    siteNavigationDiv.getBoundingClientRect().top + window.scrollY;
}

/**
 * 更新导航链接并控制可见性
 */
function updateSiteNavigation() {
  if (!siteNavigationDiv || !navLinksContainer || !toggleNavButton) return;

  navLinksContainer.innerHTML = "";

  const colorMap = {
    lime: {
      text: "text-lime-800",
      bg: "bg-lime-200",
      hoverBg: "hover:bg-lime-300",
    },
    white: {
      text: "text-gray-800",
      bg: "bg-gray-200",
      hoverBg: "hover:bg-gray-300",
    },
    gold: {
      text: "text-yellow-800",
      bg: "bg-yellow-200",
      hoverBg: "hover:bg-yellow-300",
    },
    red: {
      text: "text-red-800",
      bg: "bg-red-200",
      hoverBg: "hover:bg-red-300",
    },
    default: {
      text: "text-indigo-800",
      bg: "bg-indigo-200",
      hoverBg: "hover:bg-indigo-300",
    },
  };

  const sortedPlatformNames = Array.from(platformResults.keys()).sort();

  if (sortedPlatformNames.length === 0) {
    siteNavigationDiv.classList.remove("animate__fadeInUp");
    siteNavigationDiv.classList.add("animate__fadeOutDown");
    siteNavigationDiv.addEventListener(
      "animationend",
      function handler() {
        this.classList.add("hidden");
        this.classList.remove("animate__fadeOutDown");
        this.removeEventListener("animationend", handler);
      },
      { once: true }
    );

    toggleNavButton.classList.add("hidden");
    isNavCollapsed = false;
    resultsDiv.style.marginTop = ""; // Reset margin if nav hidden
    return;
  } else {
    siteNavigationDiv.classList.remove("hidden");
    siteNavigationDiv.classList.add("animate__fadeInUp");
    siteNavigationDiv.classList.remove("animate__fadeOutDown");
  }

  sortedPlatformNames.forEach((name) => {
    const platform = platformResults.get(name);
    const link = document.createElement("a");
    link.href = `#${name}`;

    const colorKey =
      platform.color && colorMap[platform.color] ? platform.color : "default";
    const colorClasses = colorMap[colorKey];

    link.className = `text-sm px-3 py-1 rounded-full transition-all duration-200 ease-in-out
                          ${colorClasses.text} ${colorClasses.bg} ${colorClasses.hoverBg}
                          hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400`;
    link.textContent = platform.name;
    navLinksContainer.appendChild(link);
  });

  // Apply layout based on device
  updateNavigationLayout();
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
                                    <span class="flex-1 min-w-0 break-words">${displayName}</span>
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
    paginationHtml = `<div class="px-5 py-3 flex justify-center gap-2 items-center">
                <button class="prev-page-btn bg-indigo-500 text-white p-2 rounded-full hover:bg-indigo-600 focus:ring-2 focus:ring-indigo-300 transition-all duration-200 ease-in-out ${
                  prevDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-110 active:scale-90"
                }" data-platform="${result.name}" ${
      prevDisabled ? "disabled" : ""
    }><i class="fas fa-chevron-left text-sm"></i></button>
                <span class="text-sm font-semibold text-indigo-700 px-3 py-1 bg-indigo-100 rounded-full shadow-sm">
                  ${currentPage} / ${totalPages}
                </span>
                <button class="next-page-btn bg-indigo-500 text-white p-2 rounded-full hover:bg-indigo-600 focus:ring-2 focus:ring-indigo-300 transition-all duration-200 ease-in-out ${
                  nextDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-110 active:scale-90"
                }" data-platform="${result.name}" ${
      nextDisabled ? "disabled" : ""
    }><i class="fas fa-chevron-right text-sm"></i></button>
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
                    } group-hover/link:text-indigo-800">${
    result.name
  }${tag}</span>
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
  cardElement.id = result.name;
  cardElement.className = `mb-6 rounded-xl shadow-lg rounded-t-2xl ${
    color.bg
  } border ${color.border} overflow-hidden ${
    withAnimation ? "animate__animated animate__fadeInUp animate__faster" : ""
  }`;
  cardElement.innerHTML = cardHtml;

  return cardElement;
}

/**
 * 重置/清空UI界面
 */
function clearUI() {
  resultsDiv.innerHTML = "";

  siteNavigationDiv.classList.remove("animate__fadeInUp");
  siteNavigationDiv.classList.add("animate__fadeOutDown");
  siteNavigationDiv.addEventListener(
    "animationend",
    function handler() {
      this.classList.add("hidden");
      this.classList.remove("animate__fadeOutDown");
      this.removeEventListener("animationend", handler);
    },
    { once: true }
  );

  // Reset nav bar state for next search
  isNavCollapsed = false;
  updateNavigationLayout(); // Re-apply default layout (e.g., desktop expanded)

  siteNavigationDiv.style.width = "";
  resultsDiv.style.marginTop = ""; // Clear margin on clearUI
  siteNavigationDiv.classList.remove("fixed-nav"); // Ensure fixed-nav class is removed

  errorDiv.textContent = "";
  if (progressBar) {
    progressBar.style.width = "0%";
    progressBar.style.opacity = "0";
    progressBar.classList.remove("animate__fadeIn", "animate__fadeOut");
  }
}

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.classList.add(
    "animate__animated",
    "animate__shakeX",
    "animate__faster"
  );
  errorDiv.addEventListener(
    "animationend",
    function handler() {
      this.classList.remove(
        "animate__animated",
        "animate__shakeX",
        "animate__faster"
      );
      this.removeEventListener("animationend", handler);
    },
    { once: true }
  );
}

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
      progressBar.classList.remove("hidden", "animate__fadeOut");
      progressBar.classList.add("animate__animated", "animate__fadeIn");
    }
  } else {
    searchBtn.disabled = false;
    searchBtn.classList.remove("active");
    searchIcon.className = originalIconClass;
    if (searchBtnText) searchBtnText.textContent = "开始搜索";
    if (progressBar) {
      progressBar.classList.remove("animate__fadeIn");
      progressBar.classList.add("animate__fadeOut");
      progressBar.addEventListener(
        "animationend",
        function handler() {
          this.style.opacity = "0";
          this.classList.remove("animate__animated", "animate__fadeOut");
          this.removeEventListener("animationend", handler);
        },
        { once: true }
      );
    }
  }
}

async function searchGameStream(
  {
    gameName,
    magic = false,
    zypassword = "",
    patchMode = false,
    customApi = "",
  },
  { onTotal, onProgress, onResult, onDone, onError }
) {
  const defaultSite = "api.searchgal.homes";
  const protocol = "https";

  let baseUrl = "";

  if (customApi) {
    try {
      const urlObj = new URL(customApi);
      baseUrl = urlObj.origin;
    } catch (e) {
      onError(new Error("自定义 API 地址无效。请确保其是有效的 URL。"));
      return;
    }
  } else {
    baseUrl = `${protocol}://${defaultSite}`;
  }

  const url = patchMode ? `${baseUrl}/search-patch` : `${baseUrl}/search-gal`;

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

function debounce(func, delay) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}
