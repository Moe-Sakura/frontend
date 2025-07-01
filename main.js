Artalk.init({
  el: "#Comments",
  pageKey: "https://searchgal.homes",
  server: "https://artalk.saop.cc",
  site: "Galgame 聚合搜索",
});

const form = document.getElementById("searchForm");
const resultsDiv = document.getElementById("results");
const errorDiv = document.getElementById("error");
const progressDiv = document.getElementById("progress");

function renderPlatform(result) {
  const color = result.color || "white";
  let html = `<div class="platform ${color}">`;
  html += `<div class="platform-title">${result.name}</div>`;
  if (result.error) {
    html += `<div class="error">${result.error}</div>`;
  }
  if (result.items && result.items.length > 0) {
    html += "<ul>";
    for (const item of result.items) {
      html += `<li><a href="${item.url}" target="_blank">${item.name}</a></li>`;
    }
    html += "</ul>";
  }
  html += "</div>";
  return html;
}

function clearUI() {
  resultsDiv.innerHTML = "";
  errorDiv.textContent = "";
  progressDiv.textContent = "";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearUI();
  const game = form.game.value.trim();
  const zypassword = form.zypassword.value.trim();
  if (!game) {
    errorDiv.textContent = "游戏名称不能为空";
    return;
  }
  form.querySelector("button").disabled = true;
  try {
    await searchGameStream(
      { gameName: game, zypassword },
      {
        onProgress: (progress) => {
          progressDiv.textContent = `进度: ${progress.completed} / ${progress.total}`;
        },
        onResult: (result) => {
          resultsDiv.innerHTML += renderPlatform(result);
        },
        onDone: () => {
          progressDiv.textContent = "搜索完成！";
          form.querySelector("button").disabled = false;
        },
        onError: (err) => {
          errorDiv.textContent = err.message || "发生未知错误";
          form.querySelector("button").disabled = false;
        },
      }
    );
  } catch (err) {
    errorDiv.textContent = err.message || "发生未知错误";
    form.querySelector("button").disabled = false;
  }
});

async function searchGameStream(
  { gameName, zypassword = "" },
  { onProgress, onResult, onDone, onError }
) {
  const url = "https://searchgal.homes/search";
  const formData = new FormData();
  formData.append("game", gameName);
  if (zypassword) formData.append("zypassword", zypassword);
  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json();
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
        try {
          const data = JSON.parse(line);
          if (data.total) {
            // 可用于设置总数
          } else if (data.progress && onProgress) {
            onProgress(data.progress);
            if (data.result && onResult) {
              onResult(data.result);
            }
          } else if (data.done && onDone) {
            onDone();
            return;
          }
        } catch (e) {
          // 跳过解析失败的行
        }
      }
    }
  } catch (error) {
    if (onError) onError(error);
  }
}
