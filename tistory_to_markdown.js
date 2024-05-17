require("dotenv").config();
const axios = require("axios");
const jsdom = require("jsdom");
const TurndownService = require("turndown");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { JSDOM } = jsdom;
const turndownService = new TurndownService();

const OUTPUT_ARTICLE_PATH = "articles/";
const OUTPUT_IMAGE_PATH = "articles/images/";
const TITLE_TAG_CLASS_NAME = `.${process.env.TITLE_TAG_CLASS_NAME}`;
const ARTICLE_TAG_CLASS_NAME = `.${process.env.ARTICLE_TAG_CLASS_NAME}`;

async function downloadImage(url, outputPath) {
  try {
    const response = await axios({
      method: "GET",
      url: url,
      responseType: "stream",
    });
    const writer = fs.createWriteStream(outputPath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (error) {
    console.error(`Failed to download image: ${url}`, error);
    throw error;
  }
}

async function fetchImageWithReplaceImagePath(markdown) {
  const regex = /!\[[^\]]*\]\((.*?)\)/g;
  const matches = [...markdown.matchAll(regex)];

  for (const match of matches) {
    const imageUrl = match[1];
    const imageName = `${uuidv4()}.png`;
    const outputImagePath = `${OUTPUT_IMAGE_PATH}${imageName}`;

    await downloadImage(imageUrl, outputImagePath);
    const relativeImagePath = outputImagePath.replace(OUTPUT_ARTICLE_PATH, "");
    markdown = markdown.replace(imageUrl, relativeImagePath);
  }

  return markdown;
}
function createArticleName(markdown) {
  const title = markdown.split("\n")[0];
  const noSpaceTitle = title.replaceAll(" ", "_");
  const escapePathCharTitle = noSpaceTitle.replaceAll("/", "_");

  return `${escapePathCharTitle}.md`.trim();
}

async function convertToMarkdown(url) {
  try {
    const response = await axios.get(url);
    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    const titleElement = document.querySelector(TITLE_TAG_CLASS_NAME);
    const articleElement = document.querySelector(ARTICLE_TAG_CLASS_NAME);

    if (!titleElement || !articleElement) {
      throw new Error("Article content not found");
    }

    const title = turndownService.turndown(titleElement.innerHTML);
    const article = turndownService.turndown(articleElement.innerHTML);
    const markdown = `# ${title} \n\n\n${article}`;
    const articleName = createArticleName(markdown);
    const localImagePathMarkdown = await fetchImageWithReplaceImagePath(
      markdown
    );

    fs.writeFileSync(
      `${OUTPUT_ARTICLE_PATH}${articleName}`,
      localImagePathMarkdown
    );
  } catch (error) {
    console.error("Error fetching or converting content:", error);
  }
}

function ensureDirectoriesExist() {
  if (!fs.existsSync(OUTPUT_ARTICLE_PATH)) {
    fs.mkdirSync(OUTPUT_ARTICLE_PATH);
  }
  if (!fs.existsSync(OUTPUT_IMAGE_PATH)) {
    fs.mkdirSync(OUTPUT_IMAGE_PATH);
  }
}

function main() {
  ensureDirectoriesExist();

  const urls = process.env.urls.split(",");
  for (const url of urls) {
    const trimmedUrl = url.trim();
    if (trimmedUrl.length >= 10) {
      convertToMarkdown(trimmedUrl);
    }
  }
}

main();
