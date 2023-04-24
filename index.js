const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

(async () => {
  const url = process.argv[2] ?? "https://dev.amidstyle.com";
  const sign = await getSign(url, process.argv.slice(3));
  console.log(sign);
})();

async function getSign(url, options = []) {
  const driverOptions = new chrome.Options();

  options.forEach((o) => {
    driverOptions.addArguments(o);
  });

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(driverOptions)
    .build();

  try {
    await driver.get(url);
    const signElement = await driver.wait(
      until.elementLocated(By.id("data")),
      10000
    );
    await driver.wait(until.elementTextMatches(signElement, /\w+/), 10000);

    const responseJson = await signElement.getText();
    const { sign } = JSON.parse(responseJson);

    if (sign === undefined) {
      throw new Error(
        `Can't parse 'sign' attribute within response: ${responseJson}`
      );
    }

    return JSON.stringify({ sign });
  } catch (error) {
    console.error("Error:", error);

    const fallbackConfig = "--disable-blink-features=AutomationControlled";

    if (!options.includes(fallbackConfig)) {
      console.log("Retrying with alternative configuration...");

      return await getSign(url, [...options, fallbackConfig]);
    } else {
      throw error;
    }
  } finally {
    await driver.quit();
  }
}
