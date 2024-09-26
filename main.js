const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const colors = require("colors");
const readline = require("readline");
const { DateTime } = require("luxon");
const { HttpsProxyAgent } = require('https-proxy-agent');

class Fintopio {
  constructor() {
    this.baseUrl = "https://fintopio-tg.fintopio.com/api";
    this.headers = {
      Accept: "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://fintopio-tg.fintopio.com/",
      "Sec-Ch-Ua": '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
      "Sec-Ch-Ua-Mobile": "?1",
      "Sec-Ch-Ua-Platform": '"Android"',
      "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36",
    };
  }

  log(msg, color = "white") {
    console.log(msg[color]);
  }

  async waitWithCountdown(seconds, msg = "continue") {
    const spinners = ["|", "/", "-", "\\"];
    let i = 0;
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    let remainingSeconds = seconds % 60;
    for (let s = seconds; s >= 0; s--) {
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(
        `${spinners[i]} Waiting ${hours}h ${minutes}m ${remainingSeconds}s to ${msg} ${spinners[i]}`
      );
      i = (i + 1) % spinners.length;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      remainingSeconds--;
      if (remainingSeconds < 0) {
        remainingSeconds = 59;
        minutes--;
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
      }
    }
    console.log("");
  }

  async auth(userData, proxy) {
    const url = `${this.baseUrl}/auth/telegram`;
    const headers = { ...this.headers, Webapp: "true" };
    const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;

    try {
      const response = await axios.get(`${url}?${userData}`, { headers, httpsAgent: agent });
      return response.data.token;
    } catch (error) {
      this.log(`Authentication error: ${error.message}`, "red");
      return null;
    }
  }

  async getProfile(token, proxy) {
    const url = `${this.baseUrl}/referrals/data`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      Webapp: "false, true",
    };
    const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;

    try {
      const response = await axios.get(url, { headers, httpsAgent: agent });
      return response.data;
    } catch (error) {
      this.log(`Error fetching profile: ${error.message}`, "red");
      return null;
    }
  }

  async checkInDaily(token, proxy) {
    const url = `${this.baseUrl}/daily-checkins`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;

    try {
      await axios.post(url, {}, { headers, httpsAgent: agent });
      this.log("Daily check-in successful!", "green");
    } catch (error) {
      this.log(`Daily check-in error: ${error.message}`, "red");
    }
  }

  async getFarmingState(token, proxy) {
    const url = `${this.baseUrl}/farming/state`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
    };
    const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;

    try {
      const response = await axios.get(url, { headers, httpsAgent: agent });
      return response.data;
    } catch (error) {
      this.log(`Error fetching farming state: ${error.message}`, "red");
      return null;
    }
  }

  async startFarming(token, proxy) {
    const url = `${this.baseUrl}/farming/farm`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;

    try {
      const response = await axios.post(url, {}, { headers, httpsAgent: agent });
      const finishTimestamp = response.data.timings.finish;

      if (finishTimestamp) {
        const finishTime = DateTime.fromMillis(finishTimestamp).toLocaleString(DateTime.DATETIME_FULL);
        this.log(`Starting farm...`, "yellow");
        this.log(`Farming completion time: ${finishTime}`, "green");
      } else {
        this.log("No completion time available.", "yellow");
      }
    } catch (error) {
      this.log(`Error starting farming: ${error.message}`, "red");
    }
  }

  async claimFarming(token, proxy) {
    const url = `${this.baseUrl}/farming/claim`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;

    try {
      await axios.post(url, {}, { headers, httpsAgent: agent });
      this.log("Farm claimed successfully!", "green");
    } catch (error) {
      this.log(`Error claiming farm: ${error.message}`, "red");
    }
  }

  async getDiamondInfo(token, proxy) {
    const url = `${this.baseUrl}/clicker/diamond/state`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;

    try {
      const response = await axios.get(url, { headers, httpsAgent: agent });
      if (response.data && response.data.state) {
        return response.data;
      } else {
        this.log("Error fetching diamond state: Invalid response data", "red");
        return null;
      }
    } catch (error) {
      this.log(`Error fetching diamond state: ${error.message}`, "red");
      return null;
    }
  }

  async claimDiamond(token, diamondNumber, totalReward, proxy) {
    const url = `${this.baseUrl}/clicker/diamond/complete`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const payload = { diamondNumber: diamondNumber };
    const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;

    try {
      await axios.post(url, payload, { headers, httpsAgent: agent });
      this.log(`Success claim ${totalReward} diamonds!`, "green");
    } catch (error) {
      this.log(`Error claiming Diamond: ${error.message}`, "red");
    }
  }

  async getTask(token, proxy) {
    const url = `${this.baseUrl}/hold/tasks`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;

    try {
      const response = await axios.get(url, { headers, httpsAgent: agent });
      return response.data;
    } catch (error) {
      this.log(`Error fetching task state: ${error.message}`, "red");
      return null;
    }
  }

  async startTask(token, taskId, slug, proxy) {
    const url = `${this.baseUrl}/hold/tasks/${taskId}/start`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
      origin: "https://fintopio-tg.fintopio.com",
    };
    const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;

    try {
      await axios.post(url, {}, { headers, httpsAgent: agent });
      this.log(`Starting task ${slug}!`, "green");
    } catch (error) {
      this.log(`Error starting task: ${error.message}`, "red");
    }
  }

  async claimTask(token, taskId, slug, rewardAmount, proxy) {
    const url = `${this.baseUrl}/hold/tasks/${taskId}/claim`;
    const headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
      origin: "https://fintopio-tg.fintopio.com",
    };
    const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;

    try {
      await axios.post(url, {}, { headers, httpsAgent: agent });
      this.log(`Claimed task ${slug}! Reward: ${rewardAmount}`, "green");
    } catch (error) {
      this.log(`Error claiming task: ${error.message}`, "red");
    }
  }

  extractFirstName(userData) {
    try {
      const userPart = userData.match(/user=([^&]*)/)[1];
      const decodedUserPart = decodeURIComponent(userPart);
      const userObj = JSON.parse(decodedUserPart);
      return userObj.first_name || "Unknown";
    } catch (error) {
      this.log(`Error extracting first_name: ${error.message}`, "red");
      return "Unknown";
    }
  }

  async getProxyCountry(proxy) {
    const [proxyHost] = proxy.split('@').pop().split(':'); // Ambil hostname dari proxy
    const url = `https://ipinfo.io/${proxyHost}/json?token=106f4fc976a027`;

    try {
      const response = await axios.get(url);
      const country = response.data.country || "Unknown";
      const ip = response.data.ip || "Unknown";
      return { country, ip }; // Return both country and IP
    } catch (error) {
      this.log(`Error fetching proxy country: ${error.message}`, "red");
      return { country: "Unknown", ip: "Unknown" }; // Return default values
    }
  }

  async main() {
    while (true) {
      const dataFile = path.join(__dirname, "data.txt");
      const proxiesFile = path.join(__dirname, "proxies.txt");
      const data = await fs.readFile(dataFile, "utf8");
      const users = data.split("\n").filter(Boolean);
      const proxies = await fs.readFile(proxiesFile, "utf8");
      const proxyList = proxies.split("\n").filter(Boolean);

      if (users.length !== proxyList.length) {
        this.log("Error: The number of users and proxies must match.", "red");
        return;
      }

      let firstAccountFinishTime = null;

      for (let i = 0; i < users.length; i++) {
        const userData = users[i];
        const proxy = proxyList[i]; // Get corresponding proxy
        const first_name = this.extractFirstName(userData);
        console.log(`[ Account ${i + 1} | ${first_name} ]`);

        const token = await this.auth(userData, proxy); // Pass proxy
        if (token) {
          // Fetch and log the proxy country and IP after successful login
          const { country, ip } = await this.getProxyCountry(proxy);
          this.log(`Login successful! Proxy country: ${country}, IP: ${ip}`, "green");

          const profile = await this.getProfile(token, proxy); // Pass proxy
          if (profile) {
            const balance = profile.balance;
            this.log(`Balance: ${balance}`, "green");

            await this.checkInDaily(token, proxy); // Pass proxy

            try {
              const diamond = await this.getDiamondInfo(token, proxy); // Pass proxy
              if (diamond && diamond.state === "available") {
                await this.waitWithCountdown(
                  Math.floor(Math.random() * (21 - 10)) + 10,
                  "claim Diamonds"
                );
                await this.claimDiamond(
                  token,
                  diamond.diamondNumber,
                  diamond.settings.totalReward,
                  proxy // Pass proxy
                );
              } else if (diamond && diamond.timings && diamond.timings.nextAt) {
                const nextDiamondTimeStamp = diamond.timings.nextAt;
                const nextDiamondTime = DateTime.fromMillis(nextDiamondTimeStamp).toLocaleString(DateTime.DATETIME_FULL);
                this.log(`Next Diamond time: ${nextDiamondTime}`, "green");

                if (i === 0) {
                  firstAccountFinishTime = nextDiamondTimeStamp;
                }
              } else {
                this.log("Unable to process diamond info", "yellow");
              }
            } catch (error) {
              this.log(`Error processing diamond info: ${error.message}`, "red");
            }

            const farmingState = await this.getFarmingState(token, proxy); // Pass proxy

            if (farmingState) {
              if (farmingState.state === "idling") {
                await this.startFarming(token, proxy); // Pass proxy
              } else if (
                farmingState.state === "farmed" ||
                farmingState.state === "farming"
              ) {
                const finishTimestamp = farmingState.timings.finish;
                if (finishTimestamp) {
                  const finishTime = DateTime.fromMillis(finishTimestamp).toLocaleString(DateTime.DATETIME_FULL);
                  this.log(`Farming completion time: ${finishTime}`, "green");

                  const currentTime = DateTime.now().toMillis();
                  if (currentTime > finishTimestamp) {
                    await this.claimFarming(token, proxy); // Pass proxy
                    await this.startFarming(token, proxy); // Pass proxy
                  }
                }
              }
            }

            const taskState = await this.getTask(token, proxy); // Pass proxy

            if (taskState) {
              for (const item of taskState.tasks) {
                if (item.status === "available") {
                  await this.startTask(token, item.id, item.slug, proxy); // Pass proxy
                } else if (item.status === "verified") {
                  await this.claimTask(
                    token,
                    item.id,
                    item.slug,
                    item.rewardAmount,
                    proxy // Pass proxy
                  );
                } else if (item.status === "in-progress") {
                  continue;
                } else {
                  this.log(`Verifying task ${item.slug}!`, "green");
                }
              }
            }
          }
        }
      }

      const waitTime = this.calculateWaitTime(firstAccountFinishTime);
      if (waitTime && waitTime > 0) {
        await this.waitWithCountdown(Math.floor(waitTime / 1000));
      } else {
        this.log("No valid wait time, continuing loop immediately.", "yellow");
        await this.waitWithCountdown(5);
      }
    }
  }

  calculateWaitTime(firstAccountFinishTime) {
    if (!firstAccountFinishTime) return 0;

    const currentTime = DateTime.now().toMillis();
    return Math.max(firstAccountFinishTime - currentTime, 0);
  }
}

if (require.main === module) {
  const fintopio = new Fintopio();
  fintopio.main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
