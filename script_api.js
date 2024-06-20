const apiKey = "50126b2bf3e34db88c1aaeae72bce488";
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

async function fetchNews(query = "", page = 1, sortBy = "publishedAt") {
  try {
    let apiUrl;
    if (query) {
      apiUrl = `https://newsapi.org/v2/everything?q=${query}&pageSize=10&page=${page}&sortBy=${sortBy}&apiKey=${apiKey}`;
    } else {
      apiUrl = `https://newsapi.org/v2/top-headlines?country=us&pageSize=10&page=${page}&sortBy=${sortBy}&apiKey=${apiKey}`;
    }
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.articles;
  } catch (error) {
    console.error("Error fetching news", error);
    return [];
  }
}

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
    title.textContent = truncateText(article.title, 30); // Truncate title
    blogCard.appendChild(title);

    const description = document.createElement("p");
    description.textContent = truncateText(
      article.description || "No description available",
      120
    ); // Truncate description
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
    const articles = await fetchNews(
      currentQuery,
      currentPage,
      sortSelect.value
    );
    displayBlogs(articles);
  } catch (error) {
    console.error("Error updating news", error);
  } finally {
    loadingSpinner.style.display = "none";
    updatePaginationButtons();
  }
}

searchButton.addEventListener("click", async () => {
  currentQuery = searchField.value.trim();
  if (currentQuery !== "") {
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

    // Add active class to the clicked button
    button.classList.add("active");

    currentQuery = button.dataset.category || "";
    currentPage = 1;
    await updateNews();
  });
});

function updatePaginationButtons() {
  prevButton.disabled = currentPage <= 1;
}

(async () => {
  await updateNews();
})();
