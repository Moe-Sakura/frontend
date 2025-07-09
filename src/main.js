function isMagicAccessChecked() {
  const magicCheckbox = document.getElementById("magicAccess");
  return magicCheckbox && magicCheckbox.checked;
}

function isMagicPlatform(result) {
  return result && result.color === "gold";
}
quicklink.listen({ priority: true });

Artalk.init({
  el: "#Comments",
  pageKey: "https://searchgal.homes",
  server: "https://artalk.saop.cc",
  site: "Galgame 聚合搜索",
});

const form = document.getElementById("searchForm");
const resultsDiv = document.getElementById("results");
const errorDiv = document.getElementById("error");
const progressBar = document.getElementById("progressBar");
const searchBtn = document.getElementById("searchBtn");
const searchBtnText = document.getElementById("searchBtnText");

window.addEventListener("DOMContentLoaded", () => {
  if (searchBtn) searchBtn.disabled = false;
  const magicCheckbox = document.getElementById("magicAccess");
  if (magicCheckbox && !magicCheckbox.checked) magicCheckbox.checked = true;
});

function renderPlatform(result, withAnimation = true) {
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
  let html = `<div class="${
    withAnimation ? "animate__animated animate__fadeInUp" : ""
  } mb-6 rounded-xl shadow-lg rounded-t-2xl ${color.bg} border ${
    color.border
  } overflow-hidden">`;
  let domain = "";
  let home = "";
  if (result.items && result.items.length > 0) {
    try {
      const urlObj = new URL(result.items[0].url);
      domain = urlObj.hostname;
      home = urlObj.origin;
    } catch {
      domain = "";
      home = "";
    }
  }
  let tag = "";
  if (isMagicPlatform(result)) {
    tag =
      '<span class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-yellow-400 text-white align-middle">需要魔法</span>';
  } else if (colorKey === "lime") {
    tag =
      '<span class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-lime-400 text-white align-middle">无需登录</span>';
  } else if (colorKey === "red") {
    tag =
      '<span class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-red-400 text-white align-middle">错误</span>';
  } else if (colorKey === "white") {
    tag =
      '<span class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-gray-300 text-gray-700 align-middle">需要登录</span>';
  } else if (colorKey === "default") {
    tag =
      '<span class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-indigo-200 text-indigo-700 align-middle">综合</span>';
  }
  html += `<div class="flex items-center gap-2 px-5 py-3 bg-white/80 border-b ${color.border}">
    <i class="fas fa-dice-d6 ${color.icon}"></i>
    <a href="${home}" target="_blank" class="flex items-center gap-2 group/link outline-none focus:ring-2 focus:ring-indigo-300 rounded" title="访问站点首页">
      <span class="text-lg font-bold ${color.text} group-hover/link:text-indigo-800">${result.name}${tag}</span>
      <span class="text-xs text-gray-400 group-hover/link:text-indigo-400 ml-2">${domain}</span>
    </a>
  </div>`;
  if (result.error) {
    html += `<div class="px-5 py-3 text-red-500 font-semibold flex items-center gap-2"><i class='fas fa-exclamation-circle'></i> ${result.error}</div>`;
  }
  if (result.items && result.items.length > 0) {
    html += '<ol class="divide-y divide-gray-100">';
    for (const item of result.items) {
      let path = "";
      let decodedPath = "";
      try {
        const urlObj = new URL(item.url);
        path = urlObj.pathname + (urlObj.search || "");
        decodedPath = decodeURIComponent(path);
      } catch {
        path = "";
        decodedPath = "";
      }
      html += `<li class="group transition hover:bg-indigo-50 flex flex-col px-5 py-3">
        <a href="${item.url}" target="_blank" class="font-medium text-gray-800 group-hover:text-indigo-700 text-sm flex items-center gap-1" title="访问具体页面">
          <span class="truncate">${item.name}</span>
          <i class="fas fa-arrow-up-right-from-square text-gray-300 group-hover:text-indigo-400 ml-1"></i>
        </a>
        <span class="text-xs text-gray-400 mt-0.5 ml-1 break-all block w-full">${decodedPath}</span>
      </li>`;
    }
    html += "</ol>";
  } else if (!result.error) {
    html += '<div class="px-5 py-3 text-gray-400 italic">暂无结果</div>';
  }
  html += "</div>";
  return html;
}

function clearUI() {
  resultsDiv.innerHTML = "";
  errorDiv.textContent = "";
  if (progressBar) {
    progressBar.style.width = "0%";
    progressBar.style.opacity = "0";
  }
  if (searchBtnText) searchBtnText.textContent = "开始搜索";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearUI();
  if (window.Pace && typeof window.Pace.restart === "function")
    window.Pace.restart();
  setTimeout(async () => {
    const game = form.game.value.trim();
    const zypassword = form.zypassword.value.trim();
    const searchMode = form.searchMode.value;
    const patchMode = searchMode === "patch";
    const magic = isMagicAccessChecked();
    if (!game) {
      errorDiv.textContent = "游戏名称不能为空";
      return;
    }
    if (searchBtn) {
      searchBtn.disabled = true;
      searchBtn.classList.add("active");
    }
    const iconEl = searchBtnText && searchBtnText.previousElementSibling;
    let oldIconClass = "";
    if (iconEl && iconEl.tagName === "I") {
      oldIconClass = iconEl.className;
      iconEl.className = "fas fa-spinner fa-spin";
    }
    let firstResult = true;
    let total = 0;
    if (progressBar) {
      progressBar.style.width = "0%";
      progressBar.style.opacity = "1";
      progressBar.classList.remove("hidden");
    }
    if (searchBtnText) searchBtnText.textContent = "正在搜索...";
    const searchParams = {
      gameName: game,
      zypassword,
      patchMode,
      magic,
    };
    const restoreIcon = () => {
      if (iconEl && oldIconClass) iconEl.className = oldIconClass;
    };
    try {
      await searchGameStream(searchParams, {
        onProgress: (progress) => {
          total = progress.total || total;
          if (progressBar && total) {
            const percent = Math.min(
              100,
              Math.round((progress.completed / total) * 100)
            );
            progressBar.style.width = percent + "%";
            progressBar.style.opacity = "1";
          }
          if (searchBtnText)
            searchBtnText.textContent = `进度: ${progress.completed} / ${progress.total}`;
        },
        onResult: (result) => {
          const temp = document.createElement("div");
          temp.innerHTML = renderPlatform(result, firstResult);
          const card = temp.firstElementChild;
          if (card) {
            card.classList.remove("animate__fadeInUp");
            card.classList.remove("animate__fadeInDown");
            void card.offsetWidth;
            card.classList.add("animate__animated");
            card.classList.add(
              firstResult ? "animate__fadeInDown" : "animate__fadeInUp"
            );
            resultsDiv.insertBefore(card, resultsDiv.firstChild);
          }
          firstResult = false;
        },
        onDone: () => {
          if (progressBar) {
            progressBar.style.width = "100%";
            setTimeout(() => {
              progressBar.style.opacity = "0";
            }, 800);
          }
          if (searchBtnText) searchBtnText.textContent = "搜索完成！";
          setTimeout(() => {
            if (searchBtnText) searchBtnText.textContent = "开始搜索";
            restoreIcon();
          }, 1200);
          if (searchBtn) {
            searchBtn.disabled = false;
            searchBtn.classList.remove("active");
          }
        },
        onError: (err) => {
          errorDiv.textContent = err.message || "发生未知错误";
          if (progressBar) progressBar.style.opacity = "0";
          if (searchBtnText) searchBtnText.textContent = "开始搜索";
          restoreIcon();
          if (searchBtn) {
            searchBtn.disabled = false;
            searchBtn.classList.remove("active");
          }
        },
      });
    } catch (err) {
      errorDiv.textContent = err.message || "发生未知错误";
      if (progressBar) progressBar.style.opacity = "0";
      if (searchBtnText) searchBtnText.textContent = "开始搜索";
      restoreIcon();
      if (searchBtn) {
        searchBtn.disabled = false;
        searchBtn.classList.remove("active");
      }
    }
  }, 0);
});

async function searchGameStream(
  { gameName, zypassword = "", patchMode = false, magic = false },
  { onProgress, onResult, onDone, onError }
) {
  const site = "searchgal.homes";
  const url = patchMode
    ? `https://${site}/search-patch`
    : `https://${site}/search-gal`;
  const formData = new FormData();
  formData.append("game", gameName);
  formData.append("magic", magic ? "true" : "false");
  if (zypassword) formData.append("zypassword", zypassword);
  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch {}
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
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
        let data;
        try {
          data = JSON.parse(line);
        } catch (e) {
          throw new Error("数据解析失败: " + e.message);
        }
        if (data.total) {
        } else if (data.progress && onProgress) {
          onProgress(data.progress);
          if (data.result && onResult) {
            onResult(data.result);
          }
        } else if (data.done && onDone) {
          onDone();
          return;
        }
      }
    }
  } catch (error) {
    throw error;
  }
}
