// const apiKey = "50126b2bf3e34db88c1aaeae72bce488";

const blogContainer = document.getElementById("blog-container");
const searchField = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");
const loadingSpinner = document.getElementById("loading-spinner");
const sortSelect = document.getElementById("sort-select");
const categoryButtons = document.querySelectorAll(".category-btn");

let currentPage = 1;
let currentQuery = "";
let allArticles = []; // to store all articles

const CATEGORY_ALIASES = {
  technology: ["technology", "tech"],
  business: ["business", "biz", "market", "finance"],
  sports: ["sports", "sport", "cricket", "football"],
  science: ["science", "sci"],
  health: ["health", "wellness", "medical", "medicine"]
};

function normalize(str) {
  return (str || "").toLowerCase().trim();
}

function detectCategoryToken(token) {
  const t = normalize(token);
  if (!t) return null;
  for (const [cat, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (aliases.includes(t)) return cat; // exact alias match
  }
  return null;
}

// Parse queries like:
// "technology ai", "#business markets", "category:health sleep"
function parseSearchQuery(q) {
  const s = normalize(q);
  if (!s) return { category: null, keyword: "" };

  // support "#category ..." or "category:category ..."
  if (s.startsWith("#")) {
    const [cat, ...rest] = s.slice(1).trim().split(/\s+/);
    return { category: cat || null, keyword: rest.join(" ").trim() };
  }
  if (s.startsWith("category:")) {
    const rest = s.slice("category:".length).trim();
    const [cat, ...kw] = rest.split(/\s+/);
    return { category: cat || null, keyword: kw.join(" ").trim() };
  }

  // first word as category alias (e.g., "tech ai")
  const [first, ...rest] = s.split(/\s+/);
  const aliasCat = detectCategoryToken(first);
  if (aliasCat) {
    return { category: aliasCat, keyword: rest.join(" ").trim() };
  }

  // no category, whole thing is keyword
  return { category: null, keyword: s };
}


async function fetchNews() {
  try {
    const response = await fetch("news.json");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    allArticles = data.articles;

    let filteredArticles = allArticles;

    const rawSearch = searchField.value.trim();
    if (rawSearch) {
      const { category, keyword } = parseSearchQuery(rawSearch);

      if (category) {
        filteredArticles = filteredArticles.filter(
          (a) =>
            a.category &&
            normalize(a.category) === normalize(category)
        );
      }

      if (keyword) {
        const kw = normalize(keyword);
        filteredArticles = filteredArticles.filter(
          (a) =>
            (a.title && normalize(a.title).includes(kw)) ||
            (a.description && normalize(a.description).includes(kw)) ||
            (a.category && normalize(a.category).includes(kw))
        );
      }
      return filteredArticles;
    }

    // Otherwise, fallback to category tab selection (currentQuery)
    if (currentQuery) {
      filteredArticles = filteredArticles.filter(
        (a) =>
          a.category &&
          normalize(a.category) === normalize(currentQuery)
      );
    }

    return filteredArticles;
  } catch (error) {
    console.error("Error fetching news", error);
    return [];
  }
}


categoryButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    categoryButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    searchField.value = ""; // clear input
    currentQuery = button.dataset.category || "";
    currentPage = 1;
    await updateNews();
  });
});

searchField.addEventListener("keypress", async (e) => {
  if (e.key === "Enter") {
    searchButton.click();
  }
});



function truncateText(text, maxLength) {
  return text.length > maxLength ? text.slice(0, maxLength) + "...." : text;
}

function displayBlogs(articles) {
  blogContainer.innerHTML = "";
  articles.forEach((article) => {
    const blogCard = document.createElement("div");
    blogCard.classList.add("blog-card");

    const img = document.createElement("img");
    img.src = article.urlToImage || "default-image.jpg";
    img.alt = article.title;
    blogCard.appendChild(img);

    const title = document.createElement("h2");
    title.textContent = truncateText(article.title, 30);
    blogCard.appendChild(title);

    const description = document.createElement("p");
    description.textContent = truncateText(
      article.description || "No description available",
      120
    );
    blogCard.appendChild(description);

    blogCard.addEventListener("click", () => {
      window.open(article.url, "_blank");
    });

    blogContainer.appendChild(blogCard);
  });
}

async function updateNews() {
  try {
    loadingSpinner.style.display = "block";
    const articles = await fetchNews();

    const startIndex = (currentPage - 1) * 9;
    const endIndex = startIndex + 9;
    const paginatedArticles = articles.slice(startIndex, endIndex);

    displayBlogs(paginatedArticles);

    updatePaginationButtons(articles.length);
  } catch (error) {
    console.error("Error updating news", error);
  } finally {
    loadingSpinner.style.display = "none";
  }
}


searchButton.addEventListener("click", async () => {
  categoryButtons.forEach((btn) => btn.classList.remove("active"));
  currentPage = 1;
  await updateNews();
});

searchField.addEventListener("keypress", async (e) => {
  if (e.key === "Enter") {
    categoryButtons.forEach((btn) => btn.classList.remove("active"));
    currentPage = 1;
    await updateNews();
  }
});

prevButton.addEventListener("click", async () => {
  if (currentPage > 1) {
    currentPage--;
    await updateNews();
  }
});

nextButton.addEventListener("click", async () => {
  currentPage++;
  await updateNews();
});

sortSelect.addEventListener("change", async () => {
  currentPage = 1;
  await updateNews();
});

categoryButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    // Remove active class from all buttons
    categoryButtons.forEach((btn) => btn.classList.remove("active"));

    button.classList.add("active");

    currentQuery = button.dataset.category || "";
    currentPage = 1;
    await updateNews();
  });
});

function updatePaginationButtons(totalArticles) {
  prevButton.disabled = currentPage <= 1;
  nextButton.disabled = currentPage * 9 >= totalArticles;
}


(async () => {
  await updateNews();
})();
