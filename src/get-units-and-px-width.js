const path = require("path");
const puppeteer = require("puppeteer");

const UNITS = [
  "px",
  "vw",
  "vh",
  "in",
  "cm",
  "mm",
  "pt",
  "pc",
  "em",
  "ex",
  "q",
  "ch"
];

const measureUnits = (value, units) => {
  const el = document.createElement("div");
  document.body.appendChild(el);

  const measureEl = widthValue => {
    el.setAttribute("style", `width:${widthValue}`);
    const { width } = el.getBoundingClientRect();
    el.removeAttribute("style");
    return width;
  };

  const initialWidth = measureEl(value);

  return {
    pxWidth: initialWidth,
    units: units.map(unit => {
      const measured = measureEl(`${initialWidth}${unit}`);
      return {
        name: unit,
        multiplier: measured / initialWidth
      };
    }, [])
  };
};

const getUnits = async ({ input, width, height }) => {
  // Support for single-binary builds with pkg
  // See: https://github.com/vercel/pkg/issues/204
  const packagedBrowserPath = puppeteer.executablePath();
  const marker = '.local-chromium/';
  const markerIndex = packagedBrowserPath.indexOf(marker);
  const relativePath = packagedBrowserPath.slice(markerIndex + marker.length);

  const sideloadBrowserPath = process.pkg
    ? path.join(path.dirname(process.execPath), 'puppeteer', relativePath)
    : packagedBrowserPath;

  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH || sideloadBrowserPath;

  const browser = await puppeteer.launch({ executablePath });
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  const units = await page.evaluate(measureUnits, input, UNITS);
  await browser.close();
  return units;
};

module.exports = getUnits;
