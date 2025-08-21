// -- 全局常量与状态 --
const VNDB_API_BASE_URL = "https://api.vndb.org/kana";

// 针对项目调试者与开发者的提示：
// -- 下列预置的 API 接口与 ApiKey 仅用于为 SearchGal.Homes 网站正常访客提供 LLM 服务
// -- 如需进行项目调试，请修改 AI_TRANSLATE 变量为自己的 API 接口与 ApiKey
// -- 除此以外，ai.searchgal.homes 接口无法为其他任何非正当请求提供 LLM 服务
const AI_TRANSLATE_API_URL = "https://ai.searchgal.homes/v1/chat/completions";
const AI_TRANSLATE_API_KEY =
  "sk-Md5kXePgq6HJjPa1Cf3265511bEe4e4c888232A0837e371e";
const AI_TRANSLATE_MODEL = "Qwen/Qwen2.5-32B-Instruct";

// -- VNDB 图片代理配置 --
// 在代理vndb前会先发送请求到VNDB_IMAGE_PROXY_URL, 返回200才会进行代理
const ENABLE_VNDB_IMAGE_PROXY = true; // 设置为 true 启用vndb图片代理, false 则不启用
const VNDB_IMAGE_PROXY_URL = "https://rpx.searchgal.homes/";

let isProxyAvailable = false;

const ITEMS_PER_PAGE = 10;
const platformResults = new Map();
const SEARCH_COOLDOWN_MS = 30 * 1000; // 30 seconds cooldown
let lastSearchTime = 0; // Timestamp of the last search submission
let bgmBestMatches = []; // Array to store best matches from VNDB
let vndbInfo = {}; // Object to store detailed info from VNDB
let cooldownInterval = null; // Timer for cooldown countdown
let isFirstSearch = true; // Track if it's the first search to control animations
let hasShownViewToggleToast = false; // Track if the view toggle toast has been shown
let isViewTransitioning = false; // Lock to prevent spamming the view toggle

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

/**
 * 页面加载后初始化
 */
window.addEventListener("DOMContentLoaded", () => {
  // Store the original background image
  // The original background is no longer set on load.
  if (backgroundLayer) {
    backgroundLayer.style.backgroundImage = "none";
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
  siteNavigationDiv.className = "z-20 flex flex-col items-center";
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
      updateAiViewPosition(); // Update AI view position on resize
    }, 200)
  );

  window.addEventListener("scroll", debounce(handleScroll, 10));

  fetchAndDisplayVersion(); // Fetch and display version on page load
  checkLlmStatus(); // Check and display LLM status

  const lockViewBtn = document.getElementById("lock-view-btn");
  if (lockViewBtn) {
    lockViewBtn.disabled = true; // Disable by default
    lockViewBtn.addEventListener("click", handleLockViewToggle);
  }

  // Add spacebar listener for view toggle
  window.addEventListener("keydown", (e) => {
    // Check if spacebar is pressed and the active element is not an input field
    if (e.code === "Space" && document.activeElement.tagName !== "INPUT") {
      e.preventDefault(); // Prevent default spacebar action (e.g., scrolling)
      // Only trigger if the button is actually visible and enabled
      if (lockViewBtn && !lockViewBtn.disabled) {
        handleLockViewToggle();
      }
    }
  });
});

let isViewLocked = false;

async function handleLockViewToggle() {
  if (isViewTransitioning) return; // Prevent action if animation is in progress
  isViewTransitioning = true;

  if (isViewLocked) {
    document.body.classList.remove("ai-view-active");
    await showMainContent();
  } else {
    document.body.classList.add("ai-view-active");
    await hideMainContent();
  }
  isViewLocked = !isViewLocked;
  lockViewBtn.blur();

  // Release the lock after the animation duration (approx 1.3s)
  setTimeout(() => {
    isViewTransitioning = false;
  }, 1300);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parses the AI's XML response and renders it into a formatted HTML view.
 * @param {string} xmlString The raw XML string from the AI.
 */
function renderAiView(xmlString) {
  const aiResponseBox = document.getElementById("ai-response-box");
  if (!aiResponseBox) return;
  aiResponseBox.innerHTML = ""; // Always re-render from scratch

  // Helper to get all content within a major block, even if incomplete
  const getBlockContent = (tagName, xml) => {
    const match = xml.match(new RegExp(`<${tagName}>([\\s\\S]*)`));
    if (!match) return null;
    return match[1].split(new RegExp(`</${tagName}>`))[0];
  };

  // Helper to extract a single value from a block, can be partial
  const getPartialValue = (tagName, block) => {
    const match = block.match(new RegExp(`<${tagName}>([\\s\\S]*)`));
    if (!match) return null;
    return match[1].split(/<\//)[0]; // Get content until the next closing tag starts
  };

  // Helper to extract all complete values from a block
  const getCompleteValues = (tagName, block) => {
    const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "g");
    return [...block.matchAll(regex)].map((m) => m[1]);
  };

  // 1. Game Description
  const descriptionContent = getBlockContent(
    "game_description_translated",
    xmlString
  );
  if (descriptionContent) {
    const descriptionWrapper = document.createElement("div");
    descriptionWrapper.className = "mt-8"; // Add some margin top
    aiResponseBox.appendChild(descriptionWrapper);

    const titleElement = document.createElement("h2");
    titleElement.className = "text-2xl font-bold text-white mb-4";
    titleElement.innerHTML = `游戏介绍&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`; // "游戏介绍" followed by 8 spaces
    descriptionWrapper.appendChild(titleElement);

    // Render all complete paragraphs
    getCompleteValues("p", descriptionContent).forEach((pText) => {
      const pElement = document.createElement("p");
      pElement.classList.add("mt-1");
      pElement.innerHTML = `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${pText}`;
      descriptionWrapper.appendChild(pElement);
    });
    // Check for and render an incomplete paragraph at the end
    const lastPOpen = descriptionContent.lastIndexOf("<p>");
    const lastPClosed = descriptionContent.lastIndexOf("</p>");
    if (lastPOpen > lastPClosed) {
      const pElement = document.createElement("p");
      pElement.innerHTML = `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${descriptionContent.substring(
        lastPOpen + 3
      )}`;
      descriptionWrapper.appendChild(pElement);
    }

    // Append play_time to description
    const playTimeContent = getCompleteValues("play_time", descriptionContent)[0];
    if (playTimeContent) {
      const playTimeWrapper = document.createElement("div");
      playTimeWrapper.className = "mt-8"; // Add some margin top
      playTimeWrapper.id = "play-time-wrapper"; // Add a unique ID
      aiResponseBox.appendChild(playTimeWrapper);

      const pElement = document.createElement("p");
      pElement.innerHTML = `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${playTimeContent}`;
      playTimeWrapper.appendChild(pElement);
    }
  }

  // 3. Tag列表
  const tagsContent = getBlockContent("tag_translated", xmlString);
  // console.log("[DEBUG] tagsContent:", tagsContent); // 添加日志
  if (tagsContent) {
    const tagsWrapper = document.createElement("div");
    tagsWrapper.className = "mt-8"; // Add some margin top
    aiResponseBox.appendChild(tagsWrapper);

    const titleElement = document.createElement("h2");
    titleElement.className = "text-2xl font-bold text-white mb-4";
    titleElement.innerHTML = `Tag&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`; // "Tag" followed by 8 spaces
    tagsWrapper.appendChild(titleElement);

    const tagsContainer = document.createElement("div");
    tagsContainer.className = "flex flex-col space-y-2"; // Arrange tags vertically with spacing
    tagsWrapper.appendChild(tagsContainer);

    const renderTagLine = (tagXmlNamePrimary, tagXmlNameFallback, colorClass, isBold, isItalic, commaBoldWhite) => {
      let tagValue = getPartialValue(tagXmlNamePrimary, tagsContent);
      if (tagValue === null || tagValue.trim() === "") {
        tagValue = getPartialValue(tagXmlNameFallback, tagsContent);
      }
      // console.log(`[DEBUG] Tag ${tagXmlNamePrimary}/${tagXmlNameFallback} value:`, tagValue); // 添加日志
      if (tagValue !== null && tagValue.trim() !== "") { // 增加对空字符串的检查
        const tagsArray = tagValue.split(',').map(tag => tag.trim()).filter(tag => tag !== ""); // 过滤掉空标签
        // console.log(`[DEBUG] Tag ${tagXmlNamePrimary}/${tagXmlNameFallback} array:`, tagsArray); // 添加日志
        if (tagsArray.length === 0) { // 如果过滤后没有有效标签，则不渲染
          return;
        }
        const pElement = document.createElement("p");
        // 添加8个空格
        pElement.innerHTML = `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`;
        let formattedHtml = "";

        tagsArray.forEach((tag, index) => {
          if (index > 0) {
            formattedHtml += `<span class="${commaBoldWhite ? 'font-bold text-white' : 'text-white'}">, </span>`;
          }
          let tagStyle = "";
          if (isBold) tagStyle += "font-bold ";
          // 确保所有tag文字都设置为斜体
          tagStyle += "italic ";
          formattedHtml += `<span class="${tagStyle}${colorClass}">${tag}</span>`;
        });
        pElement.innerHTML += formattedHtml;
        tagsContainer.appendChild(pElement);
      }
    };

    renderTagLine("tags1", "0", "text-red-500", true, true, true); // 粗体红色, 逗号白色粗体, 强制斜体
    renderTagLine("tags2", "1", "text-orange-500", true, true, true); // 斜粗体橙色, 逗号白色粗体, 强制斜体
    renderTagLine("tags3", "2", "text-green-500", true, true, false); // 普通字体绿色, 逗号普通白色, 强制斜体, 强制粗体
    renderTagLine("tags4", "3", "text-blue-500", true, true, false); // 斜体蓝色, 逗号普通白色, 强制斜体, 强制粗体
  }

  // 4. Characters
  const charactersContent = getBlockContent("characters_translated", xmlString);
  if (charactersContent) {
    const charactersWrapper = document.createElement("div");
    charactersWrapper.className = "mt-8";
    aiResponseBox.appendChild(charactersWrapper);

    const roleMap = {
      main: { title: "主人公", order: 1 },
      primary: { title: "主要角色", order: 2 },
      side: { title: "次要角色", order: 3 },
      appears: { title: "配角", order: 4 },
    };

    const characterBlocks = charactersContent.split("<character>").slice(1);
    const characters = characterBlocks
      .map((block) => ({
        imageUrl: getPartialValue("image_url", block),
        translatedName: getPartialValue("translated_name", block),
        originalName: getPartialValue("original_name", block),
        description: getPartialValue("description", block),
        role: getPartialValue("role", block),
      }))
      .filter((c) => c.translatedName !== null && c.role !== null);

    const groupedCharacters = characters.reduce((acc, char) => {
      (acc[char.role] = acc[char.role] || []).push(char);
      return acc;
    }, {});

    const sortedRoles = Object.keys(groupedCharacters).sort(
      (a, b) => (roleMap[a]?.order || 99) - (roleMap[b]?.order || 99)
    );

    sortedRoles.forEach((role) => {
      const roleInfo = roleMap[role];
      if (roleInfo && groupedCharacters[role].length > 0) {
        if (!charactersWrapper.querySelector(`[data-role-title="${role}"]`)) {
          const titleElement = document.createElement("h2");
          titleElement.className = "text-2xl font-bold text-white mt-8 mb-4";
          titleElement.textContent = roleInfo.title;
          titleElement.dataset.roleTitle = role;
          charactersWrapper.appendChild(titleElement);
        }
      }

      groupedCharacters[role].forEach((char, index) => {
        if (index > 0) {
          const hr = document.createElement("hr");
          hr.className = "my-4 border-gray-600";
          charactersWrapper.appendChild(hr);
        }
        const charContainer = document.createElement("div");
        charContainer.className = "flex items-center my-4";
        if (char.imageUrl) {
          const imgElement = document.createElement("img");
          imgElement.src = char.imageUrl;
          imgElement.alt = char.translatedName;
          imgElement.className =
            "w-24 h-32 object-cover rounded-lg mr-4 flex-shrink-0";
          charContainer.appendChild(imgElement);
        }
        const textContainer = document.createElement("div");
        textContainer.className = "flex-grow";
        const nameElement = document.createElement("div");
        nameElement.innerHTML = `<strong class="text-xl font-bold">${
          char.translatedName
        }</strong> <span class="text-sm text-gray-400">(${
          char.originalName || ""
        })</span>`;
        textContainer.appendChild(nameElement);
        if (char.description !== null) {
          const descElement = document.createElement("p");
          descElement.className = "mt-1";
          descElement.innerHTML = `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${char.description}`;
          textContainer.appendChild(descElement);
        }
        charContainer.appendChild(textContainer);
        charactersWrapper.appendChild(charContainer);
      });
    });
  }

  // 5. Summary
  const summaryContent = getBlockContent("summary_and_insight", xmlString);
  if (summaryContent) {
    const questionContent = getPartialValue("question", summaryContent);
    if (questionContent !== null) {
      const summaryElement = document.createElement("p");
      // Check if it's the fallback message and style accordingly
      if (questionContent === "AI翻译服务当前不可用，以上为原始信息。") {
        summaryElement.className = "mt-16 text-lg text-red-500 font-bold";
      } else {
        summaryElement.className = "mt-16 text-lg italic";
      }
      summaryElement.innerHTML = `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${questionContent}`;
      aiResponseBox.appendChild(summaryElement);
    }
  }
}

/**
 * Dynamically sets the position and size of the AI view container
 * to match the horizontal alignment of the main content container.
 */
function updateAiViewPosition() {
  const mainContent = document.getElementById("scrollable-content");
  const aiContainer = document.getElementById("ai-response-container");

  if (mainContent && aiContainer) {
    const rect = mainContent.getBoundingClientRect();
    aiContainer.style.left = `${rect.left}px`;
    aiContainer.style.width = `${rect.width}px`;
    aiContainer.style.height = "80vh"; // Keep a fixed height
  }
}

function createAliasButton() {
  if (document.getElementById("alias-btn")) return;

  const extLinksContainer = document.getElementById("ext-links-container");
  if (!extLinksContainer) return;

  const aliasBtn = document.createElement("button");
  aliasBtn.id = "alias-btn";
  // Removed title attribute and focus ring styles, changed to purple
  aliasBtn.className =
    "w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-lg hover:bg-purple-700 transition-all duration-300 transform hover:scale-110";
  aliasBtn.innerHTML = '<i class="fas fa-tags"></i>';

  const aliasTooltip = document.getElementById("alias-tooltip");
  const aliasList = document.getElementById("alias-list");

  if (!aliasTooltip || !aliasList) return;

  let hideTimeout;

  const showTooltip = () => {
    clearTimeout(hideTimeout);
    const aliases = vndbInfo.names.filter((name) => name !== vndbInfo.mainName);

    if (aliases.length > 0) {
      aliasList.innerHTML = "";
      aliases.forEach((alias) => {
        const li = document.createElement("li");
        li.textContent = alias;
        aliasList.appendChild(li);
      });

      const btnRect = aliasBtn.getBoundingClientRect();
      aliasTooltip.style.left = `${btnRect.right + 5}px`; // Reduced gap
      aliasTooltip.style.top = `${btnRect.top}px`;
      aliasTooltip.classList.remove("hidden");
      setTimeout(() => (aliasTooltip.style.opacity = "1"), 10);
    }
  };

  const hideTooltip = () => {
    hideTimeout = setTimeout(() => {
      aliasTooltip.style.opacity = "0";
      setTimeout(() => aliasTooltip.classList.add("hidden"), 300);
    }, 300);
  };

  aliasBtn.addEventListener("mouseenter", showTooltip);
  aliasBtn.addEventListener("mouseleave", hideTooltip);
  aliasTooltip.addEventListener("mouseenter", () => clearTimeout(hideTimeout));
  aliasTooltip.addEventListener("mouseleave", hideTooltip);

  extLinksContainer.appendChild(aliasBtn);
}

async function hideMainContent() {
  document.body.classList.add("noscroll");
  const mainContainer = document.getElementById("main-container");
  const siteNavigation = document.getElementById("siteNavigation");
  const scrollToTopBtn = document.getElementById("scrollToTopBtn");
  const scrollToCommentsBtn = document.getElementById("scrollToCommentsBtn");
  const vndbInfoPanel = document.getElementById("vndb-info-panel");
  const vndbDescription = document.getElementById("vndb-description");
  const aiResponseContainer = document.getElementById("ai-response-container");
  const commentsSection = document.getElementById("Comments");
  const extLinksContainer = document.getElementById("ext-links-container");

  // 1. Hide main container and buttons
  mainContainer.style.opacity = "0";
  mainContainer.style.pointerEvents = "none"; // Allow clicks to pass through
  scrollToTopBtn.style.opacity = "0";
  scrollToCommentsBtn.style.opacity = "0";
  if (extLinksContainer) extLinksContainer.style.opacity = "0";
  if (commentsSection) {
    commentsSection.style.opacity = "0";
    commentsSection.style.pointerEvents = "none";
  }

  // Delay hiding the site navigation to sync with the main container
  setTimeout(() => {
    siteNavigation.style.opacity = "0";
  }, 0);

  // 2. Hide game description
  vndbDescription.style.opacity = "0";

  // Wait for the 0.5s fade-out animations to complete
  await sleep(500);

  // 3. Slide down game info
  // Set a fixed height before animation to prevent wobbling from translateY(-50%)
  const infoPanelRect = vndbInfoPanel.getBoundingClientRect();
  vndbInfoPanel.style.height = `${infoPanelRect.height}px`;
  vndbInfoPanel.style.transform = "translateY(47vh) translateY(-50%)";

  // Wait for the 0.8s slide animation to complete
  await sleep(800);

  // 4. Position, populate, and show AI response container
  updateAiViewPosition();
  if (vndbInfo.aiRawResponse) {
    renderAiView(vndbInfo.aiRawResponse);
  }
  aiResponseContainer.style.opacity = "1";
  aiResponseContainer.style.pointerEvents = "auto";
}

async function showMainContent() {
  document.body.classList.remove("noscroll");
  const mainContainer = document.getElementById("main-container");
  const siteNavigation = document.getElementById("siteNavigation");
  const scrollToTopBtn = document.getElementById("scrollToTopBtn");
  const scrollToCommentsBtn = document.getElementById("scrollToCommentsBtn");
  const vndbInfoPanel = document.getElementById("vndb-info-panel");
  const vndbDescription = document.getElementById("vndb-description");
  const aiResponseContainer = document.getElementById("ai-response-container");
  const commentsSection = document.getElementById("Comments");

  // 1. Hide AI response container
  aiResponseContainer.style.opacity = "0";
  aiResponseContainer.style.pointerEvents = "none";

  // Wait for AI container to fade out (0.5s)
  await sleep(500);

  // 2. Slide up game info
  vndbInfoPanel.style.transform = "translateY(0)";
  // Restore original height behavior after animation
  setTimeout(() => {
    vndbInfoPanel.style.height = "";
  }, 800); // Match transition duration

  // Wait for slide up animation (0.8s)
  await sleep(800);

  // 3. Show game description and main container first
  vndbDescription.style.opacity = "1";
  mainContainer.style.opacity = "1";
  mainContainer.style.pointerEvents = ""; // Restore pointer events
  if (commentsSection) {
    commentsSection.style.opacity = "1";
    commentsSection.style.pointerEvents = "";
  }

  // 4. Then, show the platform buttons and other floating buttons at the same time
  siteNavigation.style.opacity = "1";
  scrollToTopBtn.style.opacity = "1";
  scrollToCommentsBtn.style.opacity = "1";
  const extLinksContainer = document.getElementById("ext-links-container");
  if (extLinksContainer) extLinksContainer.style.opacity = "1";
}

/**
 * Calculates the width of the scrollbar.
 * @returns {number} The width of the scrollbar in pixels.
 */
function showToast(message, duration = 4000) {
  const toast = document.getElementById("toast-notification");
  if (!toast) return;

  const toastText = toast.querySelector("span");
  if (toastText) {
    toastText.textContent = message;
  }

  toast.classList.remove("hide");
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hide");
  }, duration);
}

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

  // 让输入框失焦
  const searchInput = searchForm.querySelector('input[name="game"]');
  if (searchInput) {
    searchInput.blur();
  }

  if (lockViewBtn) {
    lockViewBtn.disabled = true; // Disable on new search
    lockViewBtn.classList.remove("visible");
  }

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
    const mainContainer = document.getElementById("main-container");
    if (mainContainer) {
      mainContainer.classList.remove("bg-white");
      mainContainer.classList.add("bg-white/95");
    }
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
          fetchVndbData(gameName)
            .then(async (vndbResult) => {
              console.log("[DEBUG] VNDB fetch completed. Processing result.");
              console.log("[DEBUG] Received from VNDB:", vndbResult);

              if (
                vndbResult &&
                vndbResult.names &&
                vndbResult.names.length > 0
              ) {
                bgmBestMatches = vndbResult.names;
                vndbInfo = {
                  names: vndbResult.names, // Add the names array to vndbInfo
                  mainName: vndbResult.mainName,
                  originalTitle: vndbResult.originalTitle, // Store the original title
                  mainImageUrl: vndbResult.mainImageUrl,
                  screenshotUrl: vndbResult.screenshotUrl,
                  description: vndbResult.description,
                  va: vndbResult.va,
                  vntags: vndbResult.vntags, // Add vntags to vndbInfo
                  play_hours: vndbResult.play_hours,
                  length_minute: vndbResult.length_minute,
                  length_votes: vndbResult.length_votes,
                  length_color: vndbResult.length_color,
                  book_length: vndbResult.book_length,
                  aiRawResponse: "", // Add a field to store the full AI response
                };
                console.log(
                  "[DEBUG] Stored VNDB Info with characters:",
                  vndbInfo
                );
                // Now that we have the names, immediately re-highlight any existing cards.
                console.log(
                  "[DEBUG] Applying highlights based on VNDB names:",
                  bgmBestMatches
                );
                highlightBestMatches();

                // --- Fetch External Links ---
                if (vndbInfo.originalTitle) {
                  await fetchVndbExtLinks(vndbInfo.originalTitle);
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
                    // New: Clear previous content and show the element
                    vndbDescription.innerHTML = "";
                    vndbDescription.classList.remove("hidden");
                    // New: Call the streaming translation function
                    translateAndStreamDescription(
                      vndbInfo.description,
                      vndbInfo.va,
                      vndbInfo.vntags,
                      vndbInfo.play_hours,
                      vndbInfo.length_minute,
                      vndbInfo.length_votes,
                      vndbInfo.length_color,
                      vndbInfo.book_length
                    );
                  } else if (vndbDescription) {
                    vndbDescription.classList.add("hidden");
                  }

                  if (vndbInfo.mainName && vndbTitle) {
                    vndbTitle.textContent = vndbInfo.mainName;
                    vndbTitle.classList.remove("hidden");
                    createAliasButton(); // Create the alias button
                  } else if (vndbTitle) {
                    vndbTitle.classList.add("hidden");
                  }

                  if (vndbInfo.screenshotUrl && backgroundLayer) {
                    const img = new Image();
                    img.onload = () => {
                      backgroundLayer.style.backgroundImage = `url(${vndbInfo.screenshotUrl})`;
                      document.body.classList.add("vndb-mode");
                      const mainContainer =
                        document.getElementById("main-container");
                      if (mainContainer) {
                        mainContainer.classList.remove("bg-white/95");
                        mainContainer.classList.add("bg-white");
                      }
                    };
                    img.src = vndbInfo.screenshotUrl;
                  } else {
                    backgroundLayer.style.backgroundImage = "none";
                    document.body.classList.remove("vndb-mode");
                    const mainContainer =
                      document.getElementById("main-container");
                    if (mainContainer) {
                      mainContainer.classList.remove("bg-white");
                      mainContainer.classList.add("bg-white/95");
                    }
                  }

                  // Show panel only if there is something to display
                  const hasContent =
                    vndbInfo.mainImageUrl ||
                    vndbInfo.description ||
                    vndbInfo.mainName;
                  vndbInfoPanel.classList.toggle("hidden", !hasContent);
                  // Hide ext links until the second VNDB fetch is complete
                  const extLinksContainer = document.getElementById(
                    "ext-links-container"
                  );
                  if (extLinksContainer) {
                    extLinksContainer.style.opacity = "0";
                    extLinksContainer.style.pointerEvents = "none";
                  }
                }
                isFirstSearch = false;
              } else {
                console.log(
                  "[DEBUG] No exact match from VNDB or empty names list. Skipping highlight."
                );
              }
            })
            .catch((err) => {
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
                    const isBestMatch =
                      result.currentPage === 1 &&
                      bgmBestMatches.some((matchName) =>
                        displayName.includes(matchName)
                      );
                    const bestMatchClass = isBestMatch
                      ? "best-match-highlight"
                      : "";

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
                ? `<div class="px-5 py-3 text-red-500 font-semibold text-sm"><i class='fas fa-exclamation-circle mr-2'></i> ${result.error}</div>`
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
      const platformCard = resultsDiv.querySelector(
        `div[data-platform="${platformName}"]`
      );
      if (platformCard) {
        const listItems = platformCard.querySelectorAll("li[class*='group']");
        listItems.forEach((item) => {
          const titleElement = item.querySelector("a > span");
          if (titleElement) {
            const title = titleElement.textContent;
            const isMatch = bgmBestMatches.some((matchName) =>
              title.includes(matchName)
            );
            if (isMatch) {
              item.classList.add("best-match-highlight");
            } else {
              item.classList.remove("best-match-highlight");
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
  const defaultSite = "cfapi.searchgal.homes";
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
 * Recursively traverses an object or array and removes spoiler tags from all string values.
 * @param {any} obj The object or array to process.
 */
function removeSpoilersRecursively(obj) {
  if (obj === null || typeof obj !== "object") {
    return;
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === "string") {
        // Also trims whitespace that might be left after removal
        obj[key] = value
          .replace(/\[spoiler\][\s\S]*?\[\/spoiler\]/g, "")
          .trim();
      } else if (typeof value === "object") {
        removeSpoilersRecursively(value);
      }
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
  const url = `${VNDB_API_BASE_URL}/vn`;
  const body = {
    filters: ["search", "=", gameName],
    sort: "searchrank",
    fields:
      "titles.title, titles.lang, aliases, title, length_minutes, length_votes, image.url, image.sexual, image.violence, image.votecount, screenshots.url, screenshots.sexual, screenshots.violence, screenshots.votecount, description, va.character.name, va.character.description, va.character.original, va.character.image.url, va.character.image.sexual, va.character.image.violence, va.character.traits.name, va.character.traits.spoiler, va.character.vns.role, va.character.vns.spoiler, tags.spoiler, tags.name, tags.rating, tags.category",
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

    // Remove all spoiler tags from the response data
    removeSpoilersRecursively(data);

    // If 'more' is true, it's not an exact match, so we ignore it.
    console.log(`[DEBUG] VNDB 'more' flag is: ${data.more}.`);
    if (data.more || !data.results || data.results.length === 0) {
      console.log(
        "[DEBUG] VNDB returned no exact match or no results. Aborting."
      );
      return null;
    }

    const result = data.results[0];
    const names = [];

    // Collect all aliases
    if (Array.isArray(result.aliases)) {
      result.aliases.forEach((alias) => names.push(String(alias)));
    }

    // Collect main title
    const originalTitle = result.title;
    if (originalTitle) {
      names.push(originalTitle);
    }

    // Collect all alternative titles
    let mainName = originalTitle || ""; // Default main name
    let zhName = "";
    let jaName = "";

    if (Array.isArray(result.titles)) {
      result.titles.forEach((titleEntry) => {
        if (titleEntry.title) {
          names.push(titleEntry.title);
          if (titleEntry.lang === "zh-Hans") {
            zhName = titleEntry.title;
          } else if (titleEntry.lang === "ja") {
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
    const mainImageUrl =
      result.image && result.image.sexual <= 1 && result.image.violence === 0
        ? result.image.url
        : null;
    const sortedScreenshots = result.screenshots
      ? [...result.screenshots].sort((a, b) => b.votecount - a.votecount)
      : [];
    const screenshotUrl =
      sortedScreenshots.find((s) => s.sexual <= 1 && s.violence === 0)?.url ||
      null;
    const description = result.description || null;

    // --- Process VA/Character Data ---
    if (result.va && Array.isArray(result.va)) {
      console.log("[DEBUG] Processing character data (VA)...");

      // 1. Extract characters
      let characters = result.va
        .map((item) => item.character)
        .filter(Boolean)
        .filter((char) => {
          if (!char.vns || char.vns.length === 0) return false;
          const gameAppearance = char.vns.find((vn) => vn.id === result.id);
          return gameAppearance && gameAppearance.spoiler === 0;
        });

      // 2. Define role weights and sort characters
      const roleWeights = { main: 1, primary: 2, side: 3, appears: 4 };
      characters.sort((a, b) => {
        const roleA = a.vns.find((vn) => vn.id === result.id)?.role;
        const roleB = b.vns.find((vn) => vn.id === result.id)?.role;
        const weightA = roleWeights[roleA] || Infinity;
        const weightB = roleWeights[roleB] || Infinity;
        return weightA - weightB;
      });

      console.log("[DEBUG] Sorted characters by role:", characters);

      // 3. Process each character (traits, names, images, and new role logic)
      characters.forEach((character) => {
        // Process traits into a single 'tag' string
        if (character.traits && Array.isArray(character.traits)) {
          character.tag = character.traits
            .filter(
              (trait) =>
                trait.spoiler === 0 && trait.name !== "Not Sexually Involved"
            )
            .map((trait) => trait.name)
            .join(", ");
          delete character.traits;
        } else {
          character.tag = "";
        }

        // Rename 'original' to 'originalName'
        if (character.original) {
          character.originalName = character.original;
          delete character.original;
        }

        // Delete the original character ID
        delete character.id;

        // Process character image based on safety flags
        if (character.image && character.image.url) {
          if (character.image.sexual <= 1 && character.image.violence === 0) {
            character.image = character.image.url;
          } else {
            character.image = "";
          }
        } else {
          character.image = "";
        }

        // Add 'role' and delete 'vns'
        const gameAppearance = character.vns.find((vn) => vn.id === result.id);
        if (gameAppearance) {
          character.role = gameAppearance.role;
        } else {
          character.role = "unknown"; // Should not happen due to earlier filter
        }
        delete character.vns;
      });

      // 4. Filter for unique characters after processing
      const uniqueCharacters = characters.reduce((acc, current) => {
        if (!acc.some((item) => item.name === current.name)) {
          acc.push(current);
        }
        return acc;
      }, []);

      result.va = uniqueCharacters; // Replace original va with processed, sorted, and unique characters
      console.log(
        "[DEBUG] Final processed character data (before assigning to finalResult):",
        result.va
      );
    }
    // --- End of VA Processing ---

    // 处理标签
    // 处理标签
    let vntags = [];
    if (result.tags) {
      const filteredAndSortedTags = result.tags
        .filter((tag) => tag.spoiler === 0 && tag.category !== 'ero')
        .sort((a, b) => b.rating - a.rating);

      const vntagsRating3 = [];
      const vntagsRating2 = [];
      const vntagsRating1 = [];
      const vntagsRating0 = [];

      filteredAndSortedTags.forEach(tag => {
        if (tag.rating === 3) {
          vntagsRating3.push(tag.name);
        } else if (tag.rating < 3 && tag.rating >= 2) {
          vntagsRating2.push(tag.name);
        } else if (tag.rating < 2 && tag.rating >= 1) {
          vntagsRating1.push(tag.name);
        } else if (tag.rating < 1) {
          vntagsRating0.push(tag.name);
        }
      });
      vntags = [vntagsRating3, vntagsRating2, vntagsRating1, vntagsRating0];
    }

    const length_minutes = result.length_minutes || 0;
    const length_votes = result.length_votes || 0;
    const play_hours = Math.floor(length_minutes / 60);
    const length_minute = length_minutes % 60;

    let length_color = "red";
    if (play_hours < 10) {
      length_color = "green";
    } else if (play_hours < 30) {
      length_color = "blue";
    } else if (play_hours < 40) {
      length_color = "orange";
    }

    let book_length = "overlength";
    if (play_hours < 10) {
      book_length = "Short";
    } else if (play_hours < 30) {
      book_length = "Medium";
    } else if (play_hours < 40) {
      book_length = "Long";
    }

    const finalResult = {
      names: [...new Set(names)], // Return unique names
      mainName,
      originalTitle,
      mainImageUrl,
      screenshotUrl,
      description,
      va: result.va, // Pass processed character data
      vntags: vntags,
      play_hours,
      length_minute,
      length_votes,
      length_color,
      book_length,
    };

    console.log("[DEBUG] Extracted Names:", finalResult.names);
    console.log("[DEBUG] Determined Main Name:", finalResult.mainName);
    console.log("[DEBUG] Extracted Main Image URL:", finalResult.mainImageUrl);
    console.log("[DEBUG] Extracted Screenshot URL:", finalResult.screenshotUrl);
    console.log("[DEBUG] Extracted Description:", finalResult.description);
    console.log("[DEBUG] Final VNDB result object:", finalResult);

    // Recursively replace all vndb URLs if proxy is enabled
    // Recursively replace all vndb URLs if proxy is enabled and available
    if (ENABLE_VNDB_IMAGE_PROXY) {
      await checkProxyAvailability();
      if (isProxyAvailable) {
        replaceVndbUrls(finalResult);
        console.log(
          "[DEBUG] Final VNDB result object after URL replacement:",
          finalResult
        );
      }
    }

    return finalResult;
  } catch (error) {
    console.error("Failed to fetch or process VNDB data:", error);
    return null; // Return null on any error
  }
}

/**
 * Recursively traverses an object or array and replaces all instances of
 * "https://t.vndb.org/" with a proxy URL in string values.
 * @param {any} obj The object or array to process.
 */
/**
 * Checks if the proxy server is available by sending a HEAD request.
 * Updates the global `isProxyAvailable` state.
 */
async function checkProxyAvailability() {
  try {
    const response = await fetch(VNDB_IMAGE_PROXY_URL, { method: "HEAD" });
    if (response.ok) {
      isProxyAvailable = true;
      console.log("[DEBUG] Proxy server is available.");
    } else {
      isProxyAvailable = false;
      console.warn(
        `[DEBUG] Proxy server check failed with status: ${response.status}`
      );
    }
  } catch (error) {
    isProxyAvailable = false;
    console.error("[DEBUG] Proxy server check failed with error:", error);
  }
}

function replaceVndbUrls(obj) {
  if (
    !ENABLE_VNDB_IMAGE_PROXY ||
    !isProxyAvailable ||
    obj === null ||
    typeof obj !== "object"
  ) {
    return;
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === "string") {
        if (value.startsWith("https://t.vndb.org/")) {
          obj[key] = VNDB_IMAGE_PROXY_URL + value;
        }
      } else if (typeof value === "object") {
        replaceVndbUrls(value); // Recurse into nested objects/arrays
      }
    }
  }
}

/**
 * Fetches the latest commit dates from GitHub repos and displays them as version.
 */
async function fetchAndDisplayVersion() {
  const versionContainer = document.getElementById("version-container");
  const versionElement = document.getElementById("version-display");
  if (!versionElement || !versionContainer) return;

  const backendUrl =
    "https://api.github.com/repos/Moe-Sakura/SearchGal/commits?per_page=1";
  const frontendUrl =
    "https://api.github.com/repos/Moe-Sakura/frontend/commits?per_page=1";

  const formatDate = (dateString) => {
    if (!dateString) return "ERROR";
    const date = new Date(dateString);
    const year = String(date.getFullYear()).slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  };

  try {
    const [backendResponse, frontendResponse] = await Promise.all([
      fetch(backendUrl),
      fetch(frontendUrl),
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
        versionElement.href =
          "https://github.com/Moe-Sakura/SearchGal/blob/main/version.md";
      } else {
        versionElement.textContent = `前端 ${frontendVersion}`;
        versionContainer.classList.remove("bg-green-200", "text-green-800");
        versionContainer.classList.add("bg-red-200", "text-red-800");
        versionElement.href =
          "https://github.com/Moe-Sakura/frontend/commits/main";
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
  const url = `${VNDB_API_BASE_URL}/release`;
  const body = {
    filters: ["vn", "=", ["search", "=", mainName]],
    fields: "title, official, extlinks.url",
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
      throw new Error(
        `VNDB extlink API request failed: ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("[DEBUG] Received extlinks from VNDB:", data);

    if (data.results && data.results.length > 0) {
      // Pass the entire results array to the rendering function
      renderExtLinkButtons(data.results);
    }
  } catch (error) {
    console.error("Error fetching VNDB external links:", error);
  }
}

/**
 * Renders categorized external link buttons based on release data.
 * @param {object[]} releases A list of release objects from VNDB.
 */
function renderExtLinkButtons(releases) {
  const allUrls = releases.flatMap(
    (release) => release.extlinks?.map((link) => link.url) || []
  );
  console.log("获取到的所有VNDB链接:", allUrls);

  const container = document.getElementById("ext-links-container");
  if (!container) return;
  container.innerHTML = ""; // Clear previous buttons

  // --- URL Categorization & Deduplication ---
  const steamUrls = [
    ...new Set(
      allUrls.filter((url) => url.includes("store.steampowered.com"))
    ),
  ];
  const dlsiteUrls = [
    ...new Set(allUrls.filter((url) => url.includes("dlsite"))),
  ];

  // Create a set of already categorized URLs for quick lookup
  const categorizedUrls = new Set([...steamUrls, ...dlsiteUrls]);

  // Find official URLs from releases marked as 'official'.
  // This logic also prevents duplicates within the official list and against other lists.
  const officialUrls = releases
    .filter((release) => release.official)
    .flatMap((release) => release.extlinks?.map((link) => link.url) || [])
    .filter((url) => {
      if (categorizedUrls.has(url)) {
        return false; // Exclude if already in Steam or DLsite
      }
      categorizedUrls.add(url); // Add to the set to avoid duplicates in "Other"
      return true;
    });

  // "Other" URLs are everything not yet categorized, with duplicates removed.
  const otherUrls = [
    ...new Set(
      allUrls.filter(
        (url) => !categorizedUrls.has(url) && !url.includes("steamdb")
      )
    ),
  ];

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
          "absolute left-full top-0 ml-2 w-max bg-white rounded-md shadow-xl p-2 z-20 hidden flex-col gap-1 opacity-0 transition-opacity duration-300";
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

        let hideTimeout;
        const showPopup = () => {
          clearTimeout(hideTimeout);
          popup.classList.remove("hidden");
          setTimeout(() => (popup.style.opacity = "1"), 10);
        };
        const hidePopup = () => {
          hideTimeout = setTimeout(() => {
            popup.style.opacity = "0";
            setTimeout(() => popup.classList.add("hidden"), 300);
          }, 300);
        };

        button.addEventListener("mouseenter", showPopup);
        button.addEventListener("mouseleave", hidePopup);
        popup.addEventListener("mouseenter", () => clearTimeout(hideTimeout));
        popup.addEventListener("mouseleave", hidePopup);
      }

      buttonWrapper.appendChild(button);
      container.appendChild(buttonWrapper);
    }
  });

  // Use a short timeout to ensure the browser has rendered the initial hidden state
  // before applying the transition, allowing the fade-in to work correctly.
  setTimeout(() => {
    container.style.transition = "opacity 0.5s ease-in-out";
    container.style.opacity = "1";
    container.style.pointerEvents = "auto";
  }, 10); // A small delay is enough
}

/**
 * Fetches a translated version of the description from an AI service and streams it.
 * @param {string} description The original description text.
 */
async function translateAndStreamDescription(
  description,
  characters,
  vntags,
  play_hours,
  length_minute,
  length_votes,
  length_color,
  book_length
) {
  if (!vndbDescription) return;

  // Show the lock view button with a ripple effect when AI response starts
  const lockViewBtn = document.getElementById("lock-view-btn");
  if (lockViewBtn && !lockViewBtn.classList.contains("visible")) {
    lockViewBtn.classList.add("visible");
    // Create 3 staggered ripples for a more noticeable effect
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const ripple = document.createElement("span");
        ripple.className = "ripple";
        lockViewBtn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 1000); // Animation duration is 1s
      }, i * 500); // Stagger the start of each ripple
    }
    // Show the one-time toast notification
    if (!hasShownViewToggleToast && !isMobileView) {
      const toastMessage = "按下空格键进入游戏详情视图";
      showToast(toastMessage);
      hasShownViewToggleToast = true;
      // hasShownViewToggleToast = true; // This line is redundant
    }
  }

  let characterInfoString = "";
  try {
    if (isMobileView) {
      console.log("[DEBUG] Mobile view detected, skipping AI translation.");
      vndbDescription.innerHTML = `<p>${description.replace(
        /\n/g,
        "<br>"
      )}</p>`;
      return;
    }

    const userLanguage = navigator.language || "zh-CN";

    if (characters && characters.length > 0) {
      characterInfoString = characters
        .map((c) => `Name: ${c.name}, Role: ${c.role}`)
        .join("\n");
    }

    const messages = [
      {
        role: "system",
        content: `
作为专业的视觉小说游戏内容翻译、格式化与主题分析专家，请将提供的视觉小说游戏信息（游戏介绍, 游戏标签, 人物信息）精确翻译成'${userLanguage}'，按指定XML格式输出，并提出一个引人深思的总结问题。

输入处理要求：

1.游戏介绍：
 格式化移除：翻译前，彻底移除所有非内容性格式代码/标签（HTML, Markdown, XML等），只保留纯文本内容。
 人名校对：介绍中出现的人名，按4.人物信息规则翻译。
 来源移除：移除介绍末尾的来源引用（如“来源：XXX”）。
 
2.游玩时长：
 模板化：按照给定的模板给出翻译后相同格式的输出。

3.游戏标签：
 专业领域化：标签的解释局限于视觉小说游戏中
 简短且精确：翻译后的tag释义必须简短，避免冗长以及模糊不清的描述，但是不得翻译成设计剧透的内容
 唯一性：每个tag只需要给出唯一的翻译后释义

4.人物信息：
 描述翻译：将每个人物描述翻译成'${userLanguage}'。为空时，根据角色的其他信息尝试生成该角色的人物介绍，严禁输出不雅内容。
 人名翻译：优先使用'中文名'或'日文名'作为'original_name'。如无，则翻译原始非中日名称。
 日译中直译：人名翻译（日译中）时，请直译日文名，而非英/罗马名。
 全部输出：确保输出所有角色信息。


输出结构与格式要求：
 最终输出必须是严格的XML格式，所有内容包裹在根元素'<game_data>'中。

1.根元素： \`<game_data>\`

2.游戏介绍部分：
 \`<game_description_translated>\`：包括\`<p>\`与\`<play_time>\`。
  \`<p>\`: 翻译后的游戏介绍，游戏介绍的每个段落用\`<p>\`分段，但禁止其他复杂HTML/样式标签。
  \`<play_time>\`：包含翻译后的模板文本。模板如下: 
    \`<i class="text-gray-400"><span class="font-bold text-{length_color}-500">{book_length}</span>, 平均游玩时长为 {play_hours}小时{length_minute}分钟, 共{length_votes}名玩家参与投票</i>\`
    其中的标签与代码严禁翻译或改动。
    以中文为例, {book_length}应该被根据响应的值翻译为: "短篇", "中篇", "长篇", "超长篇"。
    如果length_minute=0, 模板则无需输出游玩分钟。
 
3.Tag列表：
 \`<tag_translated>\`：包含\`<tags1>\`~\`<tags4>\`子元素。
     \`<tags1>\`： 翻译用户输入的tags1里面的所有tag，tag之间必须使用\`, \`分隔。若tags1为空，则该标签为空标签。
     \`<tags2>\`~\`<tags4>\`：同上，翻译输入的tags2~tags4里面的所有tag。

4.人物信息列表：
 \`<characters_translated>\`：包含所有\`<character>\`子元素。
 每个\`<character>\`包含以下子元素（严格按顺序）：
     \`<image_url>\`：若有则包含URL，否则输出\`<image_url/>\`空标签。
     \`<translated_name>\`：人物翻译后的姓名。
     \`<role>\`：原始值(main/primary/side/appears)，勿翻译。
     \`<original_name>\`：原始姓名（优先中文/日文名）, 如无, 则输出未翻译的主姓名。
     \`<description>\`：人物描述。结合游戏介绍与角色'tag'（'tag'本身勿输出），灵活撰写以突出特点，严禁输出不雅内容。

5.总结与思考：
 \`<summary_and_insight>\`：包含\`<question>\`子元素。
 \`<question>\`：基于翻译后的故事与人物，提出一个引人深思/好奇的问题。勿用总结性开场白（如“总体来说”）。

最终输出约束：
 纯XML内容，严格遵循XML标准及结构，所有标签正确嵌套/闭合。勿含任何额外文字/评论。使用\`\`\`xml \`\`\`的代码块来包裹。`,
      },
      {
        role: "user",
        content: `Game Description:\n${description}\n\nPlay Time:\nplay_hours: ${play_hours}\nlength_minute: ${length_minute}\nlength_votes: ${length_votes}\nlength_color: ${length_color}\nbook_length: ${book_length}\n\nGame Tags:\n${(
          vntags || []
        )
          .map((tags, index) => {
            const tagContent =
              tags && tags.length > 0 ? tags.join(", ") : "";
            return `Tag${index + 1}: ${tagContent}`;
          })
          .join("\n")}\n\nCharacter Details:\n${JSON.stringify(
          characters,
          null,
          2
        )}`,
      },
    ];

    console.log("Sending AI request with messages:", messages);

    const response = await fetch(AI_TRANSLATE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_TRANSLATE_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_TRANSLATE_MODEL,
        messages: messages,
        stream: true,
      }),
    });

    if (response.ok) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let isFirstChunk = true;
      vndbInfo.aiRawResponse = ""; // Reset before streaming

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("Stream finished.");
          console.log("AI响应原文:", vndbInfo.aiRawResponse);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        let boundary = buffer.indexOf("\n");
        while (boundary !== -1) {
          const line = buffer.substring(0, boundary).trim();
          buffer = buffer.substring(boundary + 1);

          if (line.startsWith("data: ")) {
            const jsonStr = line.substring(6);
            if (jsonStr !== "[DONE]") {
              try {
                const chunk = JSON.parse(jsonStr);
                if (
                  chunk.choices &&
                  chunk.choices[0].delta &&
                  chunk.choices[0].delta.content
                ) {
                  if (isFirstChunk) {
                    if (lockViewBtn) lockViewBtn.disabled = false;
                    isFirstChunk = false;
                  }
                  vndbInfo.aiRawResponse += chunk.choices[0].delta.content;
                  renderAiView(vndbInfo.aiRawResponse);

                  const startIndexDesc = vndbInfo.aiRawResponse.indexOf(
                    "<game_description_translated>"
                  );
                  if (startIndexDesc !== -1) {
                    const endIndexDesc = vndbInfo.aiRawResponse.indexOf(
                      "</game_description_translated>"
                    );
                    let contentToRenderDesc =
                      endIndexDesc !== -1
                        ? vndbInfo.aiRawResponse.substring(
                            startIndexDesc +
                              "<game_description_translated>".length,
                            endIndexDesc
                          )
                        : vndbInfo.aiRawResponse.substring(
                            startIndexDesc +
                              "<game_description_translated>".length
                          );
                    // Remove <play_time> tag and its content from description
                    const playTimeRegex = /<play_time>[\s\S]*?<\/play_time>/;
                    contentToRenderDesc = contentToRenderDesc.replace(playTimeRegex, "");
                    contentToRenderDesc = contentToRenderDesc.replace(
                      /<p>/g,
                      "<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
                    );
                    vndbDescription.innerHTML = contentToRenderDesc;
                    // Show the one-time toast notification here
                    if (!hasShownViewToggleToast && !isMobileView) {
                      const toastMessage = "按下空格键进入游戏详情视图";
                      showToast(toastMessage);
                      hasShownViewToggleToast = true;
                    }
                  }
                }
              } catch (e) {
                // Ignore JSON parsing errors
              }
            }
          }
          boundary = buffer.indexOf("\n");
        }
      }
    } else {
      // Fallback for non-200 responses
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error or fallback during AI translation:", error);
    vndbDescription.innerHTML = description.replace(/\n/g, "<br>");

    // Construct fallback XML for AI view
    let fallbackXml = "<game_data>";
    fallbackXml += `<game_description_translated><p>${description.replace(
      /\n/g,
      "</p><p>"
    )}</p>`;

    // Construct fallback play_time content
    let fallbackBookLength = "Overlength";
    if (play_hours < 10) {
      fallbackBookLength = "Short";
    } else if (play_hours < 30) {
      fallbackBookLength = "Medium";
    } else if (play_hours < 40) {
      fallbackBookLength = "Long";
    }

    let fallbackPlayTimeContent = `<i class="text-gray-400"><span class="font-bold text-${length_color}-500">${fallbackBookLength}</span>, Average play time is ${play_hours} hours`;
    if (length_minute !== 0) {
      fallbackPlayTimeContent += ` ${length_minute} minutes`;
    }
    fallbackPlayTimeContent += `, with ${length_votes} players voting</i>`;

    fallbackXml += `<play_time>${fallbackPlayTimeContent}</play_time>`;
    fallbackXml += `</game_description_translated>`;

    // Add tags to fallback XML
    if (vntags) {
      fallbackXml += "<tag_translated>";
      const tagsXml = Object.entries(vntags)
        .map(([key, value]) => `<${key}>${value}</${key}>`)
        .join("");
      fallbackXml += tagsXml;
      fallbackXml += "</tag_translated>";
    }

    // Add tags to fallback XML
    if (vntags && vntags.length > 0) {
      fallbackXml += "<tag_translated>";
      vntags.forEach((tagArray, index) => {
        if (index < 4) { // Only process up to tags4
          const tagName = `tags${index + 1}`;
          const tagValue = tagArray.join(", ");
          fallbackXml += `<${tagName}>${tagValue}</${tagName}>`;
        }
      });
      fallbackXml += "</tag_translated>";
    }

    if (characters && characters.length > 0) {
      fallbackXml += "<characters_translated>";
      characters.forEach((c) => {
        fallbackXml += "<character>";
        fallbackXml += `<image_url>${c.image || ""}</image_url>`;
        fallbackXml += `<translated_name>${c.name}</translated_name>`;
        fallbackXml += `<role>${c.role}</role>`;
        fallbackXml += `<original_name>${
          c.originalName || c.name
        }</original_name>`;
        fallbackXml += `<description>${
          c.description || "无可用描述"
        }</description>`;
        fallbackXml += "</character>";
      });
      fallbackXml += "</characters_translated>";
    }
    fallbackXml +=
      "<summary_and_insight><question>AI翻译服务当前不可用，以上为原始信息。</question></summary_and_insight>";
    fallbackXml += "</game_data>";

    vndbInfo.aiRawResponse = fallbackXml;
    renderAiView(vndbInfo.aiRawResponse);
    if (lockViewBtn) lockViewBtn.disabled = false;
  }
}

async function checkLlmStatus() {
  const statusBtn = document.getElementById("llm-status-btn");
  const statusText = document.getElementById("llm-status-text");

  if (!statusBtn || !statusText) {
    return;
  }

  try {
    const response = await fetch(
      "https://api.pulsetic.com/public/status/status.searchgal.homes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: null }),
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const llmMonitor = data.data.monitors.find(
      (monitor) => monitor.name === "后端搜索 API (无实际搜索)"
    );

    if (llmMonitor) {
      statusBtn.classList.remove("bg-white", "text-gray-500");
      statusBtn.classList.add("text-white");
      if (llmMonitor.status === "online") {
        statusBtn.classList.add("bg-green-500");
        statusText.textContent = "正常";
      } else {
        statusBtn.classList.add("bg-red-700");
        statusText.textContent = "异常";
      }
    } else {
      throw new Error("LLM monitor not found");
    }
  } catch (error) {
    console.error("Error fetching LLM status:", error);
    statusBtn.classList.remove("bg-white", "text-gray-500");
    statusBtn.classList.add("bg-gray-500", "text-white");
    statusText.textContent = "未知";
  }
}
