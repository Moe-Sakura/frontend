// -- 全局常量与状态 --
const ITEMS_PER_PAGE = 10;
const platformResults = new Map();
const SEARCH_COOLDOWN_MS = 30 * 1000; // 30 seconds cooldown
let lastSearchTime = 0; // Timestamp of the last search submission
let bgmBestMatches = []; // Array to store best matches from VNDB
let vndbInfo = {}; // Object to store detailed info from VNDB
let cooldownInterval = null; // Timer for cooldown countdown
let isFirstSearch = true; // Track if it's the first search to control animations

// -- DOM 元素获取 --
const searchForm = document.getElementById("searchForm");
const resultsDiv = document.getElementById("results");
const errorDiv = document.getElementById("error");
const progressBar = document.getElementById("progressBar");
const searchBtn = document.getElementById("searchBtn");
const searchBtnText = document.getElementById("searchBtnText");
const searchIcon = searchBtn?.querySelector("i");
const customApiInput = document.getElementById("customApi");
const scrollableContent = document.getElementById("scrollable-content");
const vndbInfoPanel = document.getElementById("vndb-info-panel");
const vndbImage = document.getElementById("vndb-image");
const vndbDescription = document.getElementById("vndb-description");
const vndbTitle = document.getElementById("vndb-title");
const backgroundLayer = document.getElementById("background-layer");
let originalBackgroundImage = "";

let siteNavigationDiv;
let toggleNavButton;
let navLinksContainer;
let isNavCollapsed = false; // Track navigation state for mobile (now largely ignored for mobile)
let isNavManuallyHidden = false; // Track if user has manually hidden the navigation
let isMobileView = false; // Track if we are in mobile view
let siteNavOriginalTop = 0; // Store the original top position of the navigation bar (less relevant for fixed bottom)
let scrollbarWidth = 0; // Store calculated scrollbar width

// Scroll to top functionality
const scrollToTopBtn = document.getElementById("scrollToTopBtn");
const scrollToCommentsBtn = document.getElementById("scrollToCommentsBtn"); // Get the comments button
const lockViewBtn = document.getElementById("lock-view-btn");

window.addEventListener("scroll", () => {
  if (window.scrollY > 200) {
    // Show buttons after scrolling down 200px
    scrollToTopBtn.classList.add("flex");
    scrollToTopBtn.classList.remove("hidden");
    scrollToCommentsBtn.classList.add("flex"); // Show comments button
    scrollToCommentsBtn.classList.remove("hidden");
    lockViewBtn.classList.add("flex");
    lockViewBtn.classList.remove("hidden");
  } else {
    scrollToTopBtn.classList.add("hidden");
    scrollToTopBtn.classList.remove("flex");
    scrollToCommentsBtn.classList.add("hidden"); // Hide comments button
    scrollToCommentsBtn.classList.remove("flex");
    lockViewBtn.classList.add("hidden");
    lockViewBtn.classList.remove("flex");
  }
});

// Initialize button visibility on page load (in case user refreshes scrolled down)
// This also handles the case where the user might load the page already scrolled
document.addEventListener("DOMContentLoaded", () => {
  if (window.scrollY > 200) {
    scrollToTopBtn.classList.add("flex");
    scrollToTopBtn.classList.remove("hidden");
    scrollToCommentsBtn.classList.add("flex");
    scrollToCommentsBtn.classList.remove("hidden");
    lockViewBtn.classList.add("flex");
    lockViewBtn.classList.remove("hidden");
  } else {
    scrollToTopBtn.classList.add("hidden");
    scrollToTopBtn.classList.remove("flex");
    scrollToCommentsBtn.classList.add("hidden");
    scrollToCommentsBtn.classList.remove("flex");
    lockViewBtn.classList.add("hidden");
    lockViewBtn.classList.remove("flex");
  }
});

scrollToTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

// Smooth scroll to comments
scrollToCommentsBtn.addEventListener("click", (e) => {
  e.preventDefault(); // Prevent default anchor jump
  const commentsSection = document.getElementById("Comments");
  if (commentsSection) {
    commentsSection.scrollIntoView({
      behavior: "smooth",
    });
  }
});

lockViewBtn.addEventListener("click", () => {
  if (siteNavigationDiv) {
    isNavManuallyHidden = !isNavManuallyHidden; // Toggle the state
    siteNavigationDiv.classList.toggle("hidden", isNavManuallyHidden); // Apply state
  }
});

/**
 * 页面加载后初始化
 */
window.addEventListener("DOMContentLoaded", () => {
  // Store the original background image
  // The original background is no longer set on load.
  if (backgroundLayer) {
      backgroundLayer.style.backgroundImage = 'none';
  }

  // 从 URL 获取 API 参数并填充输入框
  const urlParams = new URLSearchParams(window.location.search);
  const apiUrl = urlParams.get("api");
  if (apiUrl && customApiInput) {
    customApiInput.value = decodeURIComponent(apiUrl);
  }

  if (searchBtn) searchBtn.disabled = false;

  const magicCheckbox = document.getElementById("magicAccess");
  if (magicCheckbox) {
    magicCheckbox.checked = true;
  }

  quicklink.listen({ priority: true });
  Artalk.init({
    el: "#Comments",
    pageKey: "https://searchgal.homes", // Original domain from user's file
    server: "https://artalk.saop.cc",
    site: "Galgame 聚合搜索",
  });

  siteNavigationDiv = document.createElement("div");
  siteNavigationDiv.id = "siteNavigation";
  // Initial classes are minimal, updateNavigationLayout will set full classes
  siteNavigationDiv.className =
    "z-20 flex flex-col items-center animate__animated animate__fadeInUp animate__faster";
  document.body.appendChild(siteNavigationDiv);

  navLinksContainer = document.createElement("div");
  // Changed to fixed height, horizontal scroll, no wrap
  // Increased horizontal padding (px-2 to px-4) to prevent focus ring clipping
  navLinksContainer.className =
    "nav-links-container flex flex-nowrap overflow-x-auto gap-2 items-center w-full h-12 px-4";
  siteNavigationDiv.appendChild(navLinksContainer);

  toggleNavButton = document.createElement("button");
  toggleNavButton.id = "toggleNavButton";
  // Always hidden as mobile collapse is removed
  toggleNavButton.className = "hidden"; // Always hidden
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

  // Calculate scrollbar width once
  scrollbarWidth = getScrollbarWidth();

  // Initial layout update and event listeners
  updateNavigationLayout();
  updateSiteNavigation(); // Call to set initial visibility
  adjustBodyPaddingForScrollbar(); // Adjust padding on initial load

  if (searchForm) {
    searchForm.addEventListener("submit", handleSearchSubmit);
  }
  if (resultsDiv) {
    resultsDiv.addEventListener("click", handlePaginationClick);
  }

  window.addEventListener(
    "resize",
    debounce(() => {
      scrollbarWidth = getScrollbarWidth(); // Recalculate scrollbar width on resize
      adjustBodyPaddingForScrollbar(); // Adjust padding after resize
      updateNavigationLayout(); // Update layout (fixed/absolute, bottom/top)
      updateSiteNavigationWidth(); // Update width
    }, 200)
  );

  window.addEventListener("scroll", debounce(handleScroll, 10));

  fetchAndDisplayVersion(); // Fetch and display version on page load

  const lockViewBtn = document.getElementById('lock-view-btn');
  if (lockViewBtn) {
    lockViewBtn.addEventListener('click', () => {
      document.body.classList.toggle('locked-mode');
      lockViewBtn.blur();
    });
  }
});

/**
 * Calculates the width of the scrollbar.
 * @returns {number} The width of the scrollbar in pixels.
 */
function getScrollbarWidth() {
  // Create a temporary div to measure scrollbar width
  const outer = document.createElement("div");
  outer.style.visibility = "hidden";
  outer.style.overflow = "scroll"; // Force scrollbar
  outer.style.msOverflowStyle = "scrollbar"; // For IE11
  document.body.appendChild(outer);

  const inner = document.createElement("div");
  outer.appendChild(inner);

  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

  outer.parentNode.removeChild(outer);

  return scrollbarWidth;
}

/**
 * Adjusts body padding to prevent content shifting when scrollbar appears/disappears.
 */
function adjustBodyPaddingForScrollbar() {
  if (isMobileView) {
    // Do not adjust for mobile, as scrollbars are often overlaid
    document.body.style.paddingRight = "";
    return;
  }

  const hasScrollbar = document.body.scrollHeight > window.innerHeight;
  const currentPaddingRight =
    parseInt(getComputedStyle(document.body).paddingRight, 10) || 0;

  if (hasScrollbar && currentPaddingRight === 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  } else if (!hasScrollbar && currentPaddingRight === scrollbarWidth) {
    document.body.style.paddingRight = "";
  }
}

/**
 * 处理页面滚动事件 (不再用于桌面导航栏固定，仅用于滚动条调整)
 */
function handleScroll() {
  adjustBodyPaddingForScrollbar();
}

/**
 * 根据屏幕宽度调整导航栏布局 (fixed bottom)
 */
function updateNavigationLayout() {
  if (!siteNavigationDiv || !resultsDiv) return;

  const breakpoint = 768; // Tailwind's 'md' breakpoint
  isMobileView = window.innerWidth < breakpoint;

  // Clear all existing classes to ensure a clean slate
  siteNavigationDiv.className = "";

  // Apply base classes for fixed bottom, centered, full width, padding
  siteNavigationDiv.classList.add(
    "z-20",
    "flex",
    "flex-col",
    "items-center",
    "animate__animated",
    "animate__fadeInUp",
    "animate__faster",
    "fixed",
    "bottom-0", // Stays at the very bottom
    "w-full", // Full width
    "px-2" // Consistent padding - changed from 'p-2' to 'px-2' to avoid top/bottom padding affecting height calculation for resultsDiv margin
  );

  // Apply responsive max-width and rounding
  if (isMobileView) {
    siteNavigationDiv.classList.add("rounded-t-xl", "max-w-md");
    // If we are in mobile view, find and remove the vndb-info-panel if it exists
    const panel = document.getElementById("vndb-info-panel");
    if (panel) {
      panel.remove();
    }
  } else {
    // For desktop, remove max-width and make it truly full viewport width
    siteNavigationDiv.classList.remove("max-w-4xl"); // Remove previous max-width
    siteNavigationDiv.classList.add("rounded-t-xl"); // Keep rounded top for desktop
  }

  // Ensure toggle button is hidden and nav links are always visible
  toggleNavButton.classList.add("hidden");
  navLinksContainer.classList.remove("hidden", "animate__fadeIn");

  // Update resultsDiv margin to account for fixed bottom navigation
  updateSiteNavigationWidth();

  siteNavOriginalTop =
    siteNavigationDiv.getBoundingClientRect().top + window.scrollY; // Still update, though less critical
  adjustBodyPaddingForScrollbar();
}

/**
 * 统一处理搜索表单提交
 * @param {Event} e 事件对象
 */
async function handleSearchSubmit(e) {
  e.preventDefault();

  const currentTime = Date.now();
  if (lastSearchTime && currentTime - lastSearchTime < SEARCH_COOLDOWN_MS) {
    const timeLeft = Math.ceil(
      (SEARCH_COOLDOWN_MS - (currentTime - lastSearchTime)) / 1000
    );
    showError(`请等待 ${timeLeft} 秒后再搜索。`);
    return;
  }

  platformResults.clear();
  bgmBestMatches = []; // Reset best matches on new search
  vndbInfo = {}; // Reset VNDB info
  
  // Reset animation state if it's active
  if (document.body.classList.contains("vndb-mode")) {
    if (!isFirstSearch) {
      // On subsequent searches, hide the info panel instantly.
      // The background will fade out via the class removal below.
      if (vndbInfoPanel) {
        vndbInfoPanel.classList.add("hidden");
      }
      if (vndbTitle) vndbTitle.classList.add("hidden"); // Hide title instantly
      if (vndbDescription) vndbDescription.classList.add("hidden"); // Hide description instantly
    }
    document.body.classList.remove("vndb-mode");
    if (backgroundLayer) {
      backgroundLayer.style.backgroundImage = "none";
    }
  }

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

      // Set last search time AFTER the check and BEFORE setting loading state
      // This ensures cooldown is applied even if the search takes time to initialize.
      lastSearchTime = Date.now();
      setLoadingState(true);

      const searchParams = {
        gameName,
        zypassword,
        magic,
        patchMode: searchMode === "patch",
        customApi,
      };

      let totalTasks = 0;

      // Start the main search stream. It will run in the background.
      searchGameStream(searchParams, {
        onTotal: (total) => {
          totalTasks = total;
          fetchVndbData(gameName).then(vndbResult => {
            console.log("[DEBUG] VNDB fetch completed. Processing result.");
            console.log("[DEBUG] Received from VNDB:", vndbResult);

            if (vndbResult && vndbResult.names && vndbResult.names.length > 0) {
              bgmBestMatches = vndbResult.names;
              vndbInfo = {
                mainName: vndbResult.mainName,
                mainImageUrl: vndbResult.mainImageUrl,
                screenshotUrl: vndbResult.screenshotUrl,
                description: vndbResult.description,
              };
              // Now that we have the names, immediately re-highlight any existing cards.
              console.log("[DEBUG] Applying highlights based on VNDB names:", bgmBestMatches);
              highlightBestMatches();

              // --- Fetch External Links ---
              if (vndbInfo.mainName) {
                fetchVndbExtLinks(vndbInfo.mainName);
              }

              // --- Trigger Animation (only if panel exists) ---
              if (vndbInfoPanel) {
                if (vndbInfo.mainImageUrl && vndbImage) {
                  vndbImage.src = vndbInfo.mainImageUrl;
                  vndbImage.classList.remove("hidden");
                } else if (vndbImage) {
                  vndbImage.classList.add("hidden");
                }

                if (vndbInfo.description && vndbDescription) {
                  vndbDescription.textContent = vndbInfo.description;
                  vndbDescription.classList.remove("hidden");
                } else if (vndbDescription) {
                  vndbDescription.classList.add("hidden");
                }

                if (vndbInfo.mainName && vndbTitle) {
                  vndbTitle.textContent = vndbInfo.mainName;
                  vndbTitle.classList.remove("hidden");
                } else if (vndbTitle) {
                  vndbTitle.classList.add("hidden");
                }

                if (vndbInfo.screenshotUrl && backgroundLayer) {
                  const img = new Image();
                  img.onload = () => {
                    backgroundLayer.style.backgroundImage = `url(${vndbInfo.screenshotUrl})`;
                    document.body.classList.add("vndb-mode");
                  };
                  img.src = vndbInfo.screenshotUrl;
                } else {
                  backgroundLayer.style.backgroundImage = "none";
                  document.body.classList.remove("vndb-mode");
                }

                // Show panel only if there is something to display
                const hasContent =
                  vndbInfo.mainImageUrl ||
                  vndbInfo.description ||
                  vndbInfo.mainName;
                vndbInfoPanel.classList.toggle("hidden", !hasContent);
              }
              isFirstSearch = false;

            } else {
              console.log("[DEBUG] No exact match from VNDB or empty names list. Skipping highlight.");
            }
          }).catch(err => {
            console.error("An error occurred during the VNDB fetch:", err);
            // Don't show error to user for this, as it's an enhancement
          });
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
          const platformData = {
            ...result,
            items: result.items || [],
            currentPage: 1,
          };
          platformResults.set(result.name, platformData);
          // The card is created here. It will be highlighted if bgmBestMatches is already populated.
          const platformCard = createPlatformCard(platformData, true);
          resultsDiv.appendChild(platformCard);
          updateSiteNavigation(); // Update navigation visibility and content
        },
        onDone: () => {
          if (searchBtnText) searchBtnText.textContent = "搜索完成！";
          setTimeout(() => setLoadingState(false), 1200);
          updateNavigationLayout();
          siteNavOriginalTop =
            siteNavigationDiv.getBoundingClientRect().top + window.scrollY;
          handleScroll();
          adjustBodyPaddingForScrollbar(); // Adjust padding after content is rendered
        },
        onError: (err) => {
          showError(err.message);
          setLoadingState(false);
        },
      }).catch((err) => {
        // This catch is for the searchGameStream promise itself
        console.error("Error in searchGameStream:", err);
        if (searchBtn.disabled) {
          setLoadingState(false);
          showError(err.message || "流式搜索发生未知错误");
        }
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
  adjustBodyPaddingForScrollbar(); // Adjust padding after pagination
}

/**
 * 动态设置导航栏宽度和桌面端定位
 */
function updateSiteNavigationWidth() {
  if (!siteNavigationDiv) return;

  const firstCard = resultsDiv.querySelector("[data-platform]");
  if (firstCard) {
    // The width is now primarily controlled by Tailwind's 'w-full' and removed 'max-w-*' for desktop
    siteNavigationDiv.style.width = ""; // Ensure no inline width overrides Tailwind
    siteNavigationDiv.style.left = ""; // Ensure no inline left overrides Tailwind centering
    siteNavigationDiv.style.transform = ""; // Ensure no inline transform overrides Tailwind centering

    // Set marginBottom for resultsDiv as nav is at the bottom
    resultsDiv.style.marginBottom = `${siteNavigationDiv.offsetHeight}px`; // Removed +24
    resultsDiv.style.marginTop = ""; // Clear any lingering top margin
  } else {
    siteNavigationDiv.style.width = "";
    siteNavigationDiv.style.left = "";
    siteNavigationDiv.style.top = "";
    siteNavigationDiv.classList.add("hidden");
    resultsDiv.style.marginTop = "";
    resultsDiv.style.marginBottom = ""; // Clear margin if nav is hidden
  }
  // siteNavOriginalTop is less relevant now as nav is always fixed at bottom
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

  // Unified visibility control for siteNavigationDiv
  if (sortedPlatformNames.length === 0) {
    siteNavigationDiv.classList.add("hidden");
    toggleNavButton.classList.add("hidden");
    isNavCollapsed = false; // Reset collapse state
    resultsDiv.style.marginBottom = ""; // Reset margin if nav hidden
    console.log(
      "updateSiteNavigation: No results, hiding nav. platformResults.size:",
      platformResults.size
    );
    return;
  } else {
    if (!isNavManuallyHidden) {
      siteNavigationDiv.classList.remove("hidden");
    }
    siteNavigationDiv.classList.add("animate__fadeInUp"); // Re-add entrance animation
    siteNavigationDiv.classList.remove("animate__fadeOutDown"); // Ensure fadeOut is removed
    console.log(
      "updateSiteNavigation: Results present, showing nav. platformResults.size:",
      platformResults.size
    );
  }

  sortedPlatformNames.forEach((name) => {
    const platform = platformResults.get(name);
    const link = document.createElement("a");
    link.href = `#${name}`;

    const colorKey =
      platform.color && colorMap[platform.color] ? platform.color : "default";
    const colorClasses = colorMap[colorKey];

    link.className = `text-sm px-3 py-1 rounded-full transition-all duration-200 ease-in-out whitespace-nowrap
                          ${colorClasses.text} ${colorClasses.bg} ${colorClasses.hoverBg}
                          hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400`;
    link.textContent = platform.name;
    navLinksContainer.appendChild(link);
  });

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
      // This 'item' is not defined in this scope. It should be result.items[0] if you intend to get from the first item.
      // Given the logic, this block might not be correctly extracting home/domain for the platform as a whole.
      // If the intention is to show a home/domain for the platform based on its results,
      // you might need to find a representative URL or re-evaluate.
      // For now, I'll assume 'item' was meant to be the first item in 'result.items' if available.
      const url = new URL(result.items[0].url); // Assuming first item's URL for platform domain
      home = url.origin;
      domain = url.hostname;
    } catch (e) {
      // console.error("Error parsing URL for platform home/domain:", e);
      home = "#"; // Fallback if URL parsing fails
      domain = "未知域名";
    }
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
                    
                    // Check if the current item's name is one of the best matches, ONLY on the first page.
                    const isBestMatch = result.currentPage === 1 && bgmBestMatches.some(matchName => displayName.includes(matchName));
                    const bestMatchClass = isBestMatch ? 'best-match-highlight' : '';

                    return `<li class="group transition hover:bg-indigo-50 flex flex-col px-5 py-3 ${bestMatchClass}">
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
                <button class="prev-page-btn bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-indigo-600 focus:ring-2 focus:ring-indigo-300 transition-all duration-200 ease-in-out ${
                  prevDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-110 active:scale-90"
                }" data-platform="${result.name}" ${
      prevDisabled ? "disabled" : ""
    }><i class="fas fa-chevron-left text-sm"></i></button>
                <span class="text-sm font-semibold text-indigo-700 px-3 py-1 bg-indigo-100 rounded-full shadow-sm">
                  ${currentPage} / ${totalPages}
                </span>
                <button class="next-page-btn bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-indigo-600 focus:ring-2 focus:ring-indigo-300 transition-all duration-200 ease-in-out ${
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
                <a href="${home}" target="_blank" class="flex items-center gap-2 group/link outline-none focus:ring-2 focus:ring-indigo-300 rounded" title="访问具体页面">
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
 * Highlights search result items that are considered "best matches".
 */
function highlightBestMatches() {
  if (bgmBestMatches.length === 0) return;

  // Iterate over each platform card that is currently on its first page
  platformResults.forEach((platformData, platformName) => {
    if (platformData.currentPage === 1) {
      const platformCard = resultsDiv.querySelector(`div[data-platform="${platformName}"]`);
      if (platformCard) {
        const listItems = platformCard.querySelectorAll("li[class*='group']");
        listItems.forEach(item => {
          const titleElement = item.querySelector('a > span');
          if (titleElement) {
            const title = titleElement.textContent;
            const isMatch = bgmBestMatches.some(matchName => title.includes(matchName));
            if (isMatch) {
              item.classList.add('best-match-highlight');
            } else {
              item.classList.remove('best-match-highlight');
            }
          }
        });
      }
    }
  });
}

/**
 * 重置/清空UI界面
 */
function clearUI() {
  resultsDiv.innerHTML = "";

  // Clear external link buttons
  const extLinksContainer = document.getElementById("ext-links-container");
  if (extLinksContainer) extLinksContainer.innerHTML = "";

  isNavCollapsed = false;
  updateNavigationLayout(); // This will call updateSiteNavigation which will hide the nav if platformResults is empty

  siteNavigationDiv.style.width = "";
  resultsDiv.style.marginTop = "";
  resultsDiv.style.marginBottom = ""; // Clear bottom margin as well
  siteNavigationDiv.classList.remove("fixed-nav"); // Ensure fixed-nav class is removed

  errorDiv.textContent = "";
  if (progressBar) {
    progressBar.style.width = "0%";
    progressBar.style.opacity = "0";
    progressBar.classList.remove("animate__fadeIn", "animate__fadeOut");
  }
  adjustBodyPaddingForScrollbar(); // Adjust padding after clearing UI
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

  // Always clear any existing cooldown interval when state changes
  if (cooldownInterval) {
    clearInterval(cooldownInterval);
    cooldownInterval = null;
  }

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

    const updateCooldownText = () => {
      const currentTime = Date.now();
      const timeLeft = Math.ceil(
        (SEARCH_COOLDOWN_MS - (currentTime - lastSearchTime)) / 1000
      );

      if (timeLeft > 0 && lastSearchTime !== 0) {
        if (searchBtnText) searchBtnText.textContent = `冷却中 (${timeLeft}s)`;
        searchBtn.disabled = true; // Ensure button is disabled during cooldown
      } else {
        if (searchBtnText) searchBtnText.textContent = "开始搜索";
        searchBtn.disabled = false;
        if (cooldownInterval) {
          clearInterval(cooldownInterval);
          cooldownInterval = null;
        }
      }
    };

    updateCooldownText(); // Initial call
    cooldownInterval = setInterval(updateCooldownText, 1000); // Update every second

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

  const url = patchMode ? `${baseUrl}/patch` : `${baseUrl}/gal`;

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

/**
 * Fetches data from the VNDB API.
 * @param {string} gameName The name of the game to search for.
 * @returns {Promise<object|null>} An object with names and other info, or null.
 */
async function fetchVndbData(gameName) {
  console.log(`[DEBUG] Fetching VNDB data for: "${gameName}"`);
  const url = "https://api.vndb.org/kana/vn";
  const body = {
    filters: ["search", "=", gameName],
    fields: "titles.title, titles.lang, aliases, title, image.url, image.sexual, image.violence, image.votecount, screenshots.url, screenshots.sexual, screenshots.violence, screenshots.votecount, description",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Clone the response to log it, so the body can be read again later
    const responseForLog = response.clone();
    console.log("[DEBUG] Raw VNDB response:", await responseForLog.text());

    if (!response.ok) {
      console.error(`[DEBUG] VNDB API error! Status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log("[DEBUG] Parsed VNDB JSON data:", data);

    // If 'more' is true, it's not an exact match, so we ignore it.
    console.log(`[DEBUG] VNDB 'more' flag is: ${data.more}.`);
    if (data.more || !data.results || data.results.length === 0) {
      console.log("[DEBUG] VNDB returned no exact match or no results. Aborting.");
      return null;
    }

    const result = data.results[0];
    const names = [];

    // Collect all aliases
    if (Array.isArray(result.aliases)) {
      result.aliases.forEach(alias => names.push(String(alias)));
    }

    // Collect main title
    if (result.title) {
      names.push(result.title);
    }

    // Collect all alternative titles
    let mainName = result.title || ""; // Default main name
    let zhName = "";
    let jaName = "";

    if (Array.isArray(result.titles)) {
      result.titles.forEach((titleEntry) => {
        if (titleEntry.title) {
          names.push(titleEntry.title);
          if (titleEntry.lang === 'zh-Hans') {
            zhName = titleEntry.title;
          } else if (titleEntry.lang === 'ja') {
            jaName = titleEntry.title;
          }
        }
      });
    }
    
    // Determine the main name based on priority
    if (zhName) {
      mainName = zhName;
    } else if (jaName) {
      mainName = jaName;
    }

    // Extract image URLs
    const mainImageUrl = (result.image && result.image.sexual <= 1 && result.image.violence === 0) ? result.image.url : null;
    const sortedScreenshots = result.screenshots
      ? [...result.screenshots].sort((a, b) => b.votecount - a.votecount)
      : [];
    const screenshotUrl =
      sortedScreenshots.find((s) => s.sexual <= 1 && s.violence === 0)?.url ||
      null;
    const description = result.description || null;

    const finalResult = {
      names: [...new Set(names)], // Return unique names
      mainName,
      mainImageUrl,
      screenshotUrl,
      description,
    };

    console.log("[DEBUG] Extracted Names:", finalResult.names);
    console.log("[DEBUG] Determined Main Name:", finalResult.mainName);
    console.log("[DEBUG] Extracted Main Image URL:", finalResult.mainImageUrl);
    console.log("[DEBUG] Extracted Screenshot URL:", finalResult.screenshotUrl);
    console.log("[DEBUG] Extracted Description:", finalResult.description);
    console.log("[DEBUG] Final VNDB result object:", finalResult);

    return finalResult;
  } catch (error) {
    console.error("Failed to fetch or process VNDB data:", error);
    return null; // Return null on any error
  }
}

/**
 * Fetches the latest commit dates from GitHub repos and displays them as version.
 */
async function fetchAndDisplayVersion() {
  const versionContainer = document.getElementById("version-container");
  const versionElement = document.getElementById("version-display");
  if (!versionElement || !versionContainer) return;

  const backendUrl = "https://api.github.com/repos/Moe-Sakura/SearchGal/commits?per_page=1";
  const frontendUrl = "https://api.github.com/repos/Moe-Sakura/frontend/commits?per_page=1";

  const formatDate = (dateString) => {
    if (!dateString) return "ERROR";
    const date = new Date(dateString);
    const year = String(date.getFullYear()).slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  try {
    const [backendResponse, frontendResponse] = await Promise.all([
      fetch(backendUrl),
      fetch(frontendUrl)
    ]);

    if (!backendResponse.ok || !frontendResponse.ok) {
      throw new Error("Failed to fetch version from GitHub API");
    }

    const backendData = await backendResponse.json();
    const frontendData = await frontendResponse.json();

    const backendDate = backendData[0]?.commit?.committer?.date;
    const frontendDate = frontendData[0]?.commit?.committer?.date;

    const backendVersion = formatDate(backendDate);
    const frontendVersion = formatDate(frontendDate);

    let isShowingBackend = true;

    const updateVersionDisplay = () => {
      if (isShowingBackend) {
        versionElement.textContent = `后端 ${backendVersion}`;
        versionContainer.classList.remove("bg-red-200", "text-red-800");
        versionContainer.classList.add("bg-green-200", "text-green-800");
        versionElement.href = "https://github.com/Moe-Sakura/SearchGal/blob/main/version.md";
      } else {
        versionElement.textContent = `前端 ${frontendVersion}`;
        versionContainer.classList.remove("bg-green-200", "text-green-800");
        versionContainer.classList.add("bg-red-200", "text-red-800");
        versionElement.href = "https://github.com/Moe-Sakura/frontend/commits/main";
      }
      isShowingBackend = !isShowingBackend;
    };

    // Initial display
    updateVersionDisplay();
    
    // Start interval to switch every 5 seconds
    setInterval(updateVersionDisplay, 5000);

  } catch (error) {
    console.error("Error fetching version:", error);
    versionElement.textContent = "版本获取失败";
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

/**
 * Fetches external links from VNDB for a given game title.
 * @param {string} mainName The main title of the game.
 */
async function fetchVndbExtLinks(mainName) {
  const url = "https://api.vndb.org/kana/release";
  const body = {
    filters: ["search", "=", mainName],
    fields: "title, extlinks.url",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`VNDB extlink API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[DEBUG] Received extlinks from VNDB:", data);

    if (data.results && data.results.length > 0) {
      const allUrls = data.results.flatMap(
        (result) => result.extlinks?.map((link) => link.url) || []
      );
      renderExtLinkButtons(allUrls);
    }
  } catch (error) {
    console.error("Error fetching VNDB external links:", error);
  }
}

/**
 * Renders categorized external link buttons based on URLs.
 * @param {string[]} urls A list of all external URLs.
 */
function renderExtLinkButtons(urls) {
  const container = document.getElementById("ext-links-container");
  if (!container) return;
  container.innerHTML = ""; // Clear previous buttons

  const steamUrls = urls.filter((url) => url.includes("store.steampowered.com"));
  const dlsiteUrls = urls.filter((url) => url.includes("dlsite"));
  const officialUrls = urls.filter(
    (url) =>
      url.includes("shiravune.com") ||
      url.includes("mangagamer.com") ||
      url.includes("yuzu-soft.com") ||
      url.includes("hikarifield")
  );
  const otherUrls = urls.filter(
    (url) =>
      !steamUrls.includes(url) &&
      !dlsiteUrls.includes(url) &&
      !officialUrls.includes(url) &&
      !url.includes("steamdb")
  );

  const categories = [
    {
      name: "Steam",
      urls: steamUrls,
      color: "bg-blue-500",
      icon: "fab fa-steam",
    },
    {
      name: "Dlsite",
      urls: dlsiteUrls,
      color: "bg-pink-500",
      icon: "fas fa-shopping-cart",
    },
    {
      name: "Official",
      urls: officialUrls,
      color: "bg-orange-500",
      icon: "fas fa-globe",
    },
    {
      name: "Other",
      urls: otherUrls,
      color: "bg-gray-400",
      icon: "fas fa-link",
    },
  ];

  categories.forEach((category) => {
    if (category.urls.length > 0) {
      const buttonWrapper = document.createElement("div");
      buttonWrapper.className = "relative";

      const button = document.createElement("button");
      button.className = `w-10 h-10 rounded-lg ${category.color} text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform`;
      button.innerHTML = `<i class="${category.icon} text-xl"></i>`;

      if (category.urls.length === 1) {
        button.addEventListener("click", () => {
          window.open(category.urls[0], "_blank");
        });
      } else {
        const popup = document.createElement("div");
        popup.className =
          "absolute left-full top-0 ml-2 w-max bg-white rounded-md shadow-xl p-2 z-20 hidden flex-col gap-1";
        category.urls.forEach((url) => {
          const link = document.createElement("a");
          link.href = url;
          link.target = "_blank";
          link.className =
            "flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-100 p-1 rounded";
          link.innerHTML = `<i class="fas fa-external-link-alt text-gray-400"></i> ${
            new URL(url).hostname
          }`;
          popup.appendChild(link);
        });
        buttonWrapper.appendChild(popup);

        button.addEventListener("mouseenter", () => popup.classList.remove("hidden"));
        button.addEventListener("mouseleave", () => popup.classList.add("hidden"));
        popup.addEventListener("mouseenter", () => popup.classList.remove("hidden"));
        popup.addEventListener("mouseleave", () => popup.classList.add("hidden"));
      }

      buttonWrapper.appendChild(button);
      container.appendChild(buttonWrapper);
    }
  });
}
