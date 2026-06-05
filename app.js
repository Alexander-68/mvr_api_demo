(function () {
  "use strict";

  var API_PORT = 3333;
  var REQUEST_TIMEOUT_MS = 4500;
  var SCAN_TIMEOUT_MS = 1600;
  var SCAN_CONCURRENCY = 16;
  var STORAGE_KEY = "mvrApiDemoState";

  var state = {
    devices: [],
    selectedHost: "",
    session: "",
    settings: null,
    snapshotUrl: "",
    scanning: false
  };

  var els = {};

  document.addEventListener("DOMContentLoaded", function () {
    cacheElements();
    ensureStylesLoaded();
    loadSavedState();
    bindEvents();
    render();
  });

  function cacheElements() {
    [
      "sessionPill", "directForm", "directHost", "scanForm", "subnetPrefix",
      "scanStart", "scanEnd", "scanBtn", "scanProgress", "scanLabel",
      "deviceList", "clearDevicesBtn", "refreshInfoBtn", "selectedDevice",
      "deviceInfo", "networkInfo", "cameraInfo", "storageInfo", "studyInfo",
      "settingsInfo", "loginForm", "username", "password", "passwordIsMd5",
      "settingsModalBtn", "settingsModal", "settingsModalClose", "settingsModalContent",
      "fixedSession", "loginBtn", "logoutBtn", "pingBtn", "studyForm",
      "studyPath", "patientId", "patientGender", "patientFirstName",
      "patientLastName", "finishStudyBtn", "notes", "returnImage",
      "snapshotBtn", "recordStartBtn", "recordStopBtn", "snapshotPreview",
      "directFeedback", "scanFeedback", "infoFeedback", "controlFeedback",
      "studyFeedback", "captureFeedback", "requestLog", "clearLogBtn"
    ].forEach(function (id) {
      els[id] = document.getElementById(id);
    });
  }

  function ensureStylesLoaded() {
    var layout = document.querySelector(".layout");
    if (!layout) {
      return;
    }

    var display = window.getComputedStyle(layout).display;
    if (display === "grid" || display === "flex") {
      return;
    }

    var style = document.createElement("style");
    style.textContent = [
      "*{box-sizing:border-box}",
      "body{margin:0;background:#f6f7f8;color:#17202a;font-family:Arial,Helvetica,sans-serif;font-size:16px}",
      "button,input,select{font:inherit;min-height:44px}",
      "button{border:0;border-radius:6px;padding:0 16px;background:#0d6b77;color:#fff;font-weight:700}",
      "button.secondary{border:1px solid #d8dee5;background:#fff;color:#17202a}",
      "button.danger{background:#b42b3a}button.warning{background:#9a5b00}button:disabled{opacity:.5}",
      "input,select{width:100%;border:1px solid #d8dee5;border-radius:6px;padding:0 12px;background:#fff;color:#17202a}",
      "label{color:#657282;font-weight:700}h1,h2,h3,p{margin:0}h1{font-size:32px}h2{font-size:16px}h3{font-size:15px;margin-bottom:10px}",
      ".app-header{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:24px;border-bottom:1px solid #d8dee5;background:#fff}",
      ".app-header p{margin-top:4px;color:#657282}.session-pill{min-width:170px;border:1px solid #d8dee5;border-radius:999px;padding:8px 12px;background:#f0f4f7;color:#657282;text-align:center;font-weight:800}",
      ".layout{display:grid;grid-template-columns:1fr;gap:18px;padding:18px}.panel{min-width:280px}",
      ".panel,.log-panel{border:1px solid #d8dee5;border-radius:8px;background:#fff;box-shadow:0 8px 24px rgba(23,32,42,.08);padding:18px}",
      ".section-title{display:flex;min-height:44px;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}",
      ".section-content{display:grid;gap:16px;align-items:start}.section-column{min-width:0}.discovery-content{grid-template-columns:minmax(260px,.9fr) minmax(280px,1fr) minmax(280px,1.2fr)}.info-content{grid-template-columns:1fr}.control-content{grid-template-columns:minmax(280px,.9fr) minmax(360px,1.15fr) minmax(320px,1fr)}.control-card{min-width:0;border:1px solid #d8dee5;border-radius:8px;padding:14px;background:#fff}",
      ".stack,.field-row,.device-list,.mini-list,.settings-list{display:grid;gap:10px}.field-row{gap:6px}",
      ".inline-row,.button-row,.two-col,.scan-grid,.info-grid,.progress-wrap{display:grid;gap:10px}",
      ".inline-row{grid-template-columns:1fr auto}.button-row,.two-col,.scan-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.info-grid{grid-template-columns:repeat(3,minmax(0,1fr))}",
      ".button-row button{width:100%}.scan-wide,.scan-grid button,.info-grid .wide{grid-column:1/-1}",
      ".checkbox-line{display:flex;align-items:center;gap:9px;min-height:38px;color:#17202a;font-weight:600}.checkbox-line input{width:20px;min-height:20px;height:20px}",
      ".progress-wrap{grid-template-columns:1fr auto;align-items:center;margin:14px 0;color:#657282;font-weight:700}.progress-track{height:10px;overflow:hidden;border-radius:999px;background:#f0f4f7}.progress-bar{width:0;height:100%;background:#0d6b77}",
      ".action-feedback{min-height:42px;margin:10px 0 14px;border:1px solid #d8dee5;border-radius:8px;padding:10px 12px;background:#f0f4f7;color:#657282;font-weight:800;line-height:1.3;overflow-wrap:anywhere}.action-feedback.ok{border-color:rgba(19,108,66,.32);background:rgba(19,108,66,.09);color:#136c42}.action-feedback.bad{border-color:rgba(180,43,58,.34);background:rgba(180,43,58,.08);color:#b42b3a}.action-feedback.warn{border-color:rgba(154,91,0,.34);background:rgba(154,91,0,.1);color:#9a5b00}.action-feedback.busy{border-color:rgba(13,107,119,.32);background:#eef8f8;color:#0d6b77}",
      ".device-card{width:100%;min-height:82px;border:1px solid #d8dee5;border-radius:8px;padding:12px;background:#fff;color:#17202a;text-align:left}.device-card strong,.device-card span{display:block;overflow-wrap:anywhere}.device-card span{margin-top:2px;color:#657282;font-weight:600}.device-line b{color:#17202a;margin-right:6px}",
      ".selected-device{min-height:48px;margin-bottom:14px;border:1px solid #d8dee5;border-radius:8px;padding:12px;background:#f0f4f7;color:#657282;font-weight:700}",
      ".info-grid article{border:1px solid #d8dee5;border-radius:8px;padding:12px;background:#fff}dl{display:grid;grid-template-columns:minmax(100px,.7fr) minmax(0,1fr);gap:6px 12px;margin:0}dt{color:#657282;font-weight:800}dd{margin:0;overflow-wrap:anywhere}",
      ".muted{color:#657282}",
      ".snapshot-preview{display:grid;min-height:160px;place-items:center;overflow:hidden;border:1px dashed #d8dee5;border-radius:8px;background:#f0f4f7;text-align:center}.snapshot-preview img{display:block;width:100%;height:auto;max-height:320px;object-fit:contain}",
      ".log-panel{margin:0 18px 18px}.request-log{display:grid;gap:8px;max-height:260px;margin:0;padding-left:24px;overflow:auto}",
      "@media(max-width:1160px){.discovery-content,.control-content,.title-status,.info-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.devices-column{grid-column:1/-1}}@media(max-width:760px){.app-header,.layout,.section-content,.title-status,.info-grid,.button-row,.two-col,.inline-row,.scan-grid{display:grid;grid-template-columns:1fr}.devices-column{grid-column:auto}.app-header,.layout{padding:14px}.log-panel{margin:0 14px 14px}}"
    ].join("");
    document.head.appendChild(style);
    log("styles.css did not apply; injected local fallback styles for this browser", "bad");
  }

  function bindEvents() {
    els.directForm.addEventListener("submit", onDirectProbe);
    els.scanForm.addEventListener("submit", onScan);
    els.clearDevicesBtn.addEventListener("click", function () {
      state.devices = [];
      state.selectedHost = "";
      state.session = "";
      state.settings = null;
      renderSettings(null);
      saveState();
      render();
      log("Cleared device list", "info");
    });
    els.refreshInfoBtn.addEventListener("click", refreshSelectedInfo);
    els.loginForm.addEventListener("submit", onLogin);
    els.logoutBtn.addEventListener("click", onLogout);
    els.pingBtn.addEventListener("click", function () {
      setFeedback(els.controlFeedback, "Pinging " + state.selectedHost + "...", "busy");
      callApi("ping", { method: "GET", useSession: true }).then(function () {
        log("Session ping succeeded", "ok");
        setFeedback(els.controlFeedback, "Ping OK: session is alive", "ok");
      }).catch(function (error) {
        handleActionError(error, els.controlFeedback);
      });
    });
    els.studyForm.addEventListener("submit", onStartStudy);
    els.finishStudyBtn.addEventListener("click", onFinishStudy);
    els.snapshotBtn.addEventListener("click", onSnapshot);
    els.recordStartBtn.addEventListener("click", onRecordStart);
    els.recordStopBtn.addEventListener("click", onRecordStop);
    els.settingsModalBtn.addEventListener("click", openSettingsModal);
    els.settingsModalClose.addEventListener("click", closeSettingsModal);
    els.settingsModal.addEventListener("click", function (event) {
      if (event.target === els.settingsModal) {
        closeSettingsModal();
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !els.settingsModal.hidden) {
        closeSettingsModal();
      }
    });
    els.clearLogBtn.addEventListener("click", function () {
      els.requestLog.innerHTML = "";
    });
  }

  function loadSavedState() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      state.devices = Array.isArray(saved.devices) ? saved.devices : [];
      state.selectedHost = saved.selectedHost || "";
      els.directHost.value = saved.directHost || state.selectedHost || "";
      els.subnetPrefix.value = saved.subnetPrefix || els.subnetPrefix.value;
      els.scanStart.value = saved.scanStart || els.scanStart.value;
      els.scanEnd.value = saved.scanEnd || els.scanEnd.value;
      els.username.value = saved.username || "";
      els.fixedSession.value = saved.fixedSession || "";
    } catch (error) {
      log("Could not load saved browser state: " + error.message, "bad");
    }
  }

  function saveState() {
    var data = {
      devices: state.devices,
      selectedHost: state.selectedHost,
      directHost: els.directHost.value.trim(),
      subnetPrefix: els.subnetPrefix.value.trim(),
      scanStart: els.scanStart.value,
      scanEnd: els.scanEnd.value,
      username: els.username.value.trim(),
      fixedSession: els.fixedSession.value.trim()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function render() {
    renderSession();
    renderDeviceList();
    renderSelectedDevice();
    updateControls();
  }

  function renderSession() {
    if (!state.selectedHost) {
      els.sessionPill.textContent = "No device selected";
      els.sessionPill.classList.remove("online");
      return;
    }

    if (state.session) {
      els.sessionPill.textContent = "Logged in to " + state.selectedHost;
      els.sessionPill.classList.add("online");
    } else {
      els.sessionPill.textContent = "Selected " + state.selectedHost;
      els.sessionPill.classList.remove("online");
    }
  }

  function renderDeviceList() {
    if (!state.devices.length) {
      els.deviceList.innerHTML = '<div class="muted">No devices discovered yet.</div>';
      return;
    }

    els.deviceList.innerHTML = "";
    state.devices.forEach(function (device) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "device-card" + (device.host === state.selectedHost ? " active" : "");
      button.innerHTML = [
        "<strong>" + escapeHtml(deviceTitle(device)) + "</strong>",
        '<span class="device-line"><b>IP</b> ' + escapeHtml(device.host) + "</span>",
        '<span class="device-line"><b>Device ID</b> ' + escapeHtml(deviceId(device)) + "</span>",
        '<span class="device-line"><b>Versions</b> ' + escapeHtml(deviceVersions(device)) + "</span>"
      ].join("");
      button.addEventListener("click", function () {
        selectDevice(device.host);
      });
      els.deviceList.appendChild(button);
    });
  }

  function renderSelectedDevice() {
    var device = findDevice(state.selectedHost);
    if (!state.selectedHost) {
      els.selectedDevice.textContent = "Select a discovered device or probe an IP address.";
      renderDefinitionList(els.deviceInfo, {});
      renderDefinitionList(els.networkInfo, {});
      renderDefinitionList(els.studyInfo, {});
      return;
    }

    els.selectedDevice.textContent = device ? deviceTitle(device) + " at " + state.selectedHost : state.selectedHost;
    if (device) {
      renderDefinitionList(els.deviceInfo, pickPublicDeviceFields(device));
    }
  }

  function updateControls() {
    var hasDevice = Boolean(state.selectedHost);
    var hasSession = Boolean(state.session);
    [
      els.refreshInfoBtn, els.loginBtn
    ].forEach(function (button) {
      button.disabled = !hasDevice;
    });
    [
      els.logoutBtn, els.pingBtn, els.studyPath, els.patientId, els.patientGender,
      els.patientFirstName, els.patientLastName, els.finishStudyBtn, els.notes,
      els.returnImage, els.snapshotBtn, els.recordStartBtn, els.recordStopBtn
    ].forEach(function (control) {
      control.disabled = !hasSession;
    });
    var studyButtons = els.studyForm.querySelectorAll("button, input, select");
    Array.prototype.forEach.call(studyButtons, function (control) {
      if (control !== els.studyPath && control !== els.patientId && control !== els.patientGender &&
          control !== els.patientFirstName && control !== els.patientLastName && control !== els.finishStudyBtn) {
        control.disabled = !hasSession;
      }
    });
    els.settingsModalBtn.disabled = !state.settings;
  }

  function onDirectProbe(event) {
    event.preventDefault();
    var host = normalizeHost(els.directHost.value);
    if (!host) {
      log("Enter a device IP or host before probing", "bad");
      setFeedback(els.directFeedback, "Enter a device IP or host before probing", "bad");
      return;
    }

    setFeedback(els.directFeedback, "Probing " + host + ":" + API_PORT + "...", "busy");
    setBusy(els.directForm.querySelector("button"), true);
    fetchDevice(host, REQUEST_TIMEOUT_MS).then(function (device) {
      upsertDevice(host, device);
      selectDevice(host);
      saveState();
      log("Found MVR device at " + host, "ok");
      setFeedback(els.directFeedback, "Probe OK: " + deviceTitle(device) + " at " + host, "ok");
    }).catch(function (error) {
      handleActionError(error, els.directFeedback);
    }).finally(function () {
      setBusy(els.directForm.querySelector("button"), false);
    });
  }

  function onScan(event) {
    event.preventDefault();
    if (state.scanning) {
      return;
    }

    var prefix = els.subnetPrefix.value.trim();
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(prefix)) {
      prefix += ".";
      els.subnetPrefix.value = prefix;
    }
    var start = Number(els.scanStart.value);
    var end = Number(els.scanEnd.value);
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.$/.test(prefix) ||
        !Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end > 254 || start > end) {
      log("Scan range must be a valid IPv4 suffix range from 1 to 254", "bad");
      setFeedback(els.scanFeedback, "Scan range must be a valid IPv4 suffix range from 1 to 254", "bad");
      return;
    }

    var hosts = [];
    for (var i = start; i <= end; i += 1) {
      hosts.push(normalizeHost(prefix + i));
    }

    state.scanning = true;
    els.scanBtn.disabled = true;
    els.scanProgress.style.width = "0%";
    els.scanLabel.textContent = "Scanning";
    setFeedback(els.scanFeedback, "Scanning " + hosts.length + " addresses...", "busy");
    saveState();

    var foundCount = 0;
    runPool(hosts, SCAN_CONCURRENCY, function (host, index, total) {
      return fetchDevice(host, SCAN_TIMEOUT_MS).then(function (device) {
        foundCount += 1;
        upsertDevice(host, device);
        log("Found " + deviceTitle(device) + " at " + host, "ok");
        setFeedback(els.scanFeedback, "Found " + deviceTitle(device) + " at " + host, "ok");
        renderDeviceList();
      }).catch(function () {
        return null;
      }).finally(function () {
        var done = index + 1;
        els.scanProgress.style.width = Math.round((done / total) * 100) + "%";
        els.scanLabel.textContent = done + "/" + total;
      });
    }).then(function () {
      log("Scan complete", "info");
      setFeedback(els.scanFeedback, "Scan complete: " + foundCount + " device" + (foundCount === 1 ? "" : "s") + " found", foundCount ? "ok" : "bad");
    }).catch(function (error) {
      handleActionError(error, els.scanFeedback);
    }).finally(function () {
      state.scanning = false;
      els.scanBtn.disabled = false;
      els.scanLabel.textContent = "Idle";
      saveState();
      render();
    });
  }

  function runPool(items, limit, worker) {
    var next = 0;
    var active = 0;

    return new Promise(function (resolve, reject) {
      function launch() {
        if (next >= items.length && active === 0) {
          resolve();
          return;
        }

        while (active < limit && next < items.length) {
          var index = next;
          var item = items[next];
          next += 1;
          active += 1;
          worker(item, index, items.length).then(function () {
            active -= 1;
            launch();
          }).catch(reject);
        }
      }
      launch();
    });
  }

  function selectDevice(host) {
    state.selectedHost = normalizeHost(host);
    state.session = "";
    state.settings = null;
    renderSettings(null);
    saveState();
    render();
    refreshSelectedInfo();
  }

  function refreshSelectedInfo() {
    if (!state.selectedHost) {
      return Promise.resolve();
    }

    setFeedback(els.infoFeedback, "Refreshing " + state.selectedHost + "...", "busy");
    els.refreshInfoBtn.disabled = true;
    return fetchDevice(state.selectedHost, REQUEST_TIMEOUT_MS).then(function (device) {
      upsertDevice(state.selectedHost, device);
      renderDefinitionList(els.deviceInfo, pickPublicDeviceFields(device));
      if (state.session) {
        return loadProtectedInfo();
      }
      els.networkInfo.innerHTML = "";
      els.cameraInfo.textContent = "Login to read camera details.";
      els.cameraInfo.classList.add("muted");
      els.storageInfo.textContent = "Login to read storage details.";
      els.storageInfo.classList.add("muted");
      state.settings = null;
      renderSettings(null);
      renderDefinitionList(els.studyInfo, {});
      return null;
    }).then(function () {
      setFeedback(els.infoFeedback, "Refresh OK: device information updated", "ok");
    }).catch(function (error) {
      handleActionError(error, els.infoFeedback);
    }).finally(function () {
      els.refreshInfoBtn.disabled = !state.selectedHost;
      saveState();
      render();
    });
  }

  function loadProtectedInfo() {
    return Promise.allSettled([
      callApi("device/net/lan", { method: "GET", useSession: true }),
      callApi("device/net/wifi", { method: "GET", useSession: true }),
      callApi("cameras", { method: "GET", useSession: true }),
      callApi("storages", { method: "GET", useSession: true }),
      callApi("study/status", { method: "GET", useSession: true }),
      callApi("settings", { method: "GET", useSession: true })
    ]).then(function (results) {
      renderNetwork(results[0], results[1]);
      renderCameras(settledValue(results[2]));
      renderStorages(settledValue(results[3]));
      renderStudy(settledValue(results[4]));
      renderSettings(settledValue(results[5]));
    });
  }

  function renderNetwork(lanResult, wifiResult) {
    var lan = settledValue(lanResult);
    var wifi = settledValue(wifiResult);
    var data = {};
    if (lan) {
      data["LAN IP"] = lan.ip || "not connected";
      data["LAN MAC"] = lan.mac || "";
    }
    if (wifi) {
      data["WiFi IP"] = wifi.ip || "not connected";
      data["WiFi MAC"] = wifi.mac || "";
      data["WiFi SSID"] = wifi.ssid || "";
    }
    renderDefinitionList(els.networkInfo, data);
  }

  function renderCameras(data) {
    els.cameraInfo.classList.remove("muted");
    if (!data || !Array.isArray(data.cameras) || !data.cameras.length) {
      els.cameraInfo.textContent = "No cameras reported.";
      els.cameraInfo.classList.add("muted");
      return;
    }

    els.cameraInfo.innerHTML = "";
    data.cameras.forEach(function (camera) {
      var item = document.createElement("div");
      item.className = "mini-item";
      var signal = camera.hasSignal ? "signal" : "no signal";
      var size = camera.width && camera.height ? camera.width + "x" + camera.height : "size unknown";
      item.textContent = "#" + camera.index + " " + (camera.label || "Camera") + ": " + signal + ", " + size;
      els.cameraInfo.appendChild(item);
    });
  }

  function renderStorages(data) {
    els.storageInfo.classList.remove("muted");
    if (!data || !Array.isArray(data.storages) || !data.storages.length) {
      els.storageInfo.textContent = "No storages reported.";
      els.storageInfo.classList.add("muted");
      return;
    }

    els.storageInfo.innerHTML = "";
    data.storages.forEach(function (storage) {
      var item = document.createElement("div");
      item.className = "mini-item";
      item.textContent = storage.type + " " + (storage.label || "") + ": " +
        formatBytes(storage.freeSpace) + " free of " + formatBytes(storage.totalSpace);
      els.storageInfo.appendChild(item);
    });
  }

  function renderStudy(data) {
    if (!data || Object.keys(data).length === 0) {
      renderDefinitionList(els.studyInfo, { Status: "No active study or no status returned" });
      return;
    }
    renderDefinitionList(els.studyInfo, {
      Path: data.path || "",
      Storages: Array.isArray(data.storages) ? data.storages.join(", ") : "",
      Ready: formatValue(data.isReadyForRecording),
      Recording: data.recordState || "",
      "Can capture": formatValue(data.canCaptureSnapshot),
      "Next file": data.studyCounters && data.studyCounters.nextFileSequence
    });
  }

  function renderSettings(data) {
    state.settings = data && Object.keys(data).length ? data : null;
    els.settingsModalBtn.disabled = !state.settings;
    els.settingsInfo.classList.remove("muted");
    if (!state.settings) {
      els.settingsInfo.textContent = state.session ? "No settings returned." : "Login to read settings.";
      els.settingsInfo.classList.add("muted");
      els.settingsModalContent.textContent = "No settings loaded.";
      return;
    }

    var keys = Object.keys(state.settings).sort();
    els.settingsInfo.textContent = keys.length + " setting" + (keys.length === 1 ? "" : "s") + " loaded.";
    els.settingsModalContent.textContent = JSON.stringify(sortObjectForDisplay(state.settings), null, 2);
  }

  function openSettingsModal() {
    if (!state.settings) {
      return;
    }
    els.settingsModal.hidden = false;
    els.settingsModalClose.focus();
  }

  function closeSettingsModal() {
    els.settingsModal.hidden = true;
    els.settingsModalBtn.focus();
  }

  function onLogin(event) {
    event.preventDefault();
    if (!state.selectedHost) {
      log("Select a device before logging in", "bad");
      setFeedback(els.controlFeedback, "Select a device before logging in", "bad");
      return;
    }

    var password = els.password.value;
    var user = els.username.value.trim();
    var fixedSession = els.fixedSession.value.trim();
    var passHash = els.passwordIsMd5.checked ? password.trim() : md5(password);
    var headers = {
      Authorization: "Basic " + btoa(user + ":" + passHash)
    };
    if (fixedSession) {
      headers["X-session"] = fixedSession;
    }

    setFeedback(els.controlFeedback, "Starting session with " + state.selectedHost + "...", "busy");
    setBusy(els.loginBtn, true);
    callApi("begin", {
      method: "POST",
      headers: headers,
      body: {
        DeviceName: navigator.userAgent.slice(0, 80),
        AppVersion: "mvr-api-demo-static-1.0",
        isUsbConnection: false
      },
      includeResponse: true
    }).then(function (response) {
      var headerSession = response.headers.get("X-session") || response.headers.get("x-session");
      state.session = headerSession || fixedSession;
      if (!state.session) {
        throw new Error("Login succeeded, but the browser could not read X-session. Enter a fixed Session ID and try again, or check CORS exposed headers.");
      }
      saveState();
      render();
      log("Session started", "ok");
      setFeedback(els.controlFeedback, "Login OK: session started", "ok");
      if (response.data && response.data.study) {
        renderStudy(response.data.study);
      }
      return loadProtectedInfo();
    }).catch(function (error) {
      handleActionError(error, els.controlFeedback);
    }).finally(function () {
      setBusy(els.loginBtn, false);
      updateControls();
    });
  }

  function onLogout() {
    if (!state.session) {
      return;
    }

    setFeedback(els.controlFeedback, "Ending session...", "busy");
    setBusy(els.logoutBtn, true);
    callApi("end", { method: "POST", useSession: true }).then(function () {
      log("Session ended", "ok");
      setFeedback(els.controlFeedback, "Logout OK: session ended", "ok");
    }).catch(function (error) {
      handleActionError(error, els.controlFeedback);
    }).finally(function () {
      state.session = "";
      state.settings = null;
      renderSettings(null);
      setBusy(els.logoutBtn, false);
      saveState();
      render();
    });
  }

  function onStartStudy(event) {
    event.preventDefault();
    var patient = compactObject({
      PatientID: els.patientId.value.trim(),
      PatientGender: els.patientGender.value,
      PatientFirstName: els.patientFirstName.value.trim(),
      PatientLastName: els.patientLastName.value.trim()
    });
    var payload = compactObject({
      path: els.studyPath.value.trim(),
      patient: Object.keys(patient).length ? patient : undefined
    });

    setFeedback(els.studyFeedback, "Starting study...", "busy");
    callApi("study/start", { method: "PUT", useSession: true, body: payload }).then(function () {
      log("Study started", "ok");
      setFeedback(els.studyFeedback, "Start Study OK; waiting for status...", "busy");
      return refreshStudyStatusAfterAction(els.studyFeedback, "Start Study OK");
    }).catch(function (error) {
      handleActionError(error, els.studyFeedback);
    });
  }

  function onFinishStudy() {
    setFeedback(els.studyFeedback, "Finishing study...", "busy");
    callApi("study/finish", { method: "PUT", useSession: true }).then(function () {
      log("Study finished", "ok");
      setFeedback(els.studyFeedback, "Finish Study OK", "ok");
      renderDefinitionList(els.studyInfo, { Status: "Study finished" });
    }).catch(function (error) {
      handleActionError(error, els.studyFeedback);
    });
  }

  function onSnapshot() {
    var notes = els.notes.value.trim();
    var path = els.returnImage.checked ? "study/snapshot/jpg" : "study/snapshot";
    if (notes) {
      path += "?notes=" + encodeURIComponent(notes);
    }

    setFeedback(els.captureFeedback, "Capturing image...", "busy");
    callApi(path, {
      method: "PUT",
      useSession: true,
      responseType: els.returnImage.checked ? "blob" : "json"
    }).then(function (data) {
      log("Snapshot captured", "ok");
      setFeedback(els.captureFeedback, "Capture Image OK; refreshing status...", "busy");
      if (els.returnImage.checked && data instanceof Blob) {
        if (state.snapshotUrl) {
          URL.revokeObjectURL(state.snapshotUrl);
        }
        state.snapshotUrl = URL.createObjectURL(data);
        els.snapshotPreview.classList.remove("muted");
        els.snapshotPreview.innerHTML = '<a href="' + state.snapshotUrl + '" download="mvr-snapshot.jpg"><img src="' + state.snapshotUrl + '" alt="Captured MVR snapshot">Download snapshot</a>';
      }
      return refreshStudyStatusAfterAction(els.captureFeedback, "Capture Image OK");
    }).catch(function (error) {
      handleActionError(error, els.captureFeedback);
    });
  }

  function onRecordStart() {
    var notes = els.notes.value.trim();
    var path = "study/record/start" + (notes ? "?notes=" + encodeURIComponent(notes) : "");
    setFeedback(els.captureFeedback, "Starting recording...", "busy");
    callApi(path, { method: "PUT", useSession: true }).then(function () {
      log("Recording started", "ok");
      setFeedback(els.captureFeedback, "Start Recording OK; refreshing status...", "busy");
      return refreshStudyStatusAfterAction(els.captureFeedback, "Start Recording OK");
    }).catch(function (error) {
      handleActionError(error, els.captureFeedback);
    });
  }

  function onRecordStop() {
    setFeedback(els.captureFeedback, "Stopping recording...", "busy");
    callApi("study/record/stop", { method: "PUT", useSession: true }).then(function () {
      log("Recording stopped", "ok");
      setFeedback(els.captureFeedback, "Stop Recording OK; refreshing status...", "busy");
      return refreshStudyStatusAfterAction(els.captureFeedback, "Stop Recording OK");
    }).catch(function (error) {
      handleActionError(error, els.captureFeedback);
    });
  }

  function refreshStudyStatusAfterAction(feedbackElement, successMessage) {
    return getStudyStatusWithRetry(6, 350).then(function (status) {
      renderStudy(status);
      setFeedback(feedbackElement, successMessage + "; status updated", "ok");
      return status;
    }).catch(function (error) {
      var message = normalizeErrorMessage(error);
      setFeedback(feedbackElement, successMessage + "; status not ready yet (" + message + ")", "warn");
      log(successMessage + "; status refresh did not complete yet: " + message, "info");
      return null;
    });
  }

  function getStudyStatusWithRetry(attemptsLeft, delayMs) {
    return callApi("study/status", { method: "GET", useSession: true }).catch(function (error) {
      if (attemptsLeft <= 1) {
        throw error;
      }
      return delay(delayMs).then(function () {
        return getStudyStatusWithRetry(attemptsLeft - 1, delayMs);
      });
    });
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function callApi(path, options) {
    options = options || {};
    if (!state.selectedHost) {
      return Promise.reject(new Error("No MVR device selected"));
    }

    var url = buildApiUrl(state.selectedHost, path, options.useSession);
    var headers = Object.assign({}, options.headers || {});
    var init = {
      method: options.method || "GET",
      headers: headers
    };

    if (options.body !== undefined) {
      init.body = JSON.stringify(options.body);
      init.headers["Content-Type"] = "application/json";
    }

    log(init.method + " " + url, "info");
    return fetchWithTimeout(url, init, REQUEST_TIMEOUT_MS).then(function (response) {
      return readResponse(response, options.responseType).then(function (data) {
        if (!response.ok) {
          throw new Error(formatHttpError(response, data));
        }
        log(response.status + " " + init.method + " /api/" + path.split("?")[0], "ok");
        if (options.includeResponse) {
          return { response: response, headers: response.headers, data: data };
        }
        return data;
      });
    });
  }

  function fetchDevice(host, timeoutMs) {
    var normalized = normalizeHost(host);
    var url = "http://" + normalized + ":" + API_PORT + "/api/device";
    return fetchWithTimeout(url, { method: "GET" }, timeoutMs).then(function (response) {
      return readResponse(response, "json").then(function (data) {
        if (!response.ok) {
          throw new Error(response.status + " " + response.statusText + " from " + normalized);
        }
        return data || {};
      });
    }).catch(function (error) {
      if (error && error.name !== "AbortError") {
        return checkOpaqueReachability(url, timeoutMs).then(function (reachable) {
          if (reachable) {
            throw new Error("MVR at " + normalized + ":" + API_PORT + " is reachable, but the browser cannot read /api/device. The recorder response is missing CORS headers. Use firmware with CORS support, a browser launched with web security disabled for demo testing, or a local proxy.");
          }
          throw error;
        });
      }
      throw error;
    });
  }

  function checkOpaqueReachability(url, timeoutMs) {
    return fetchWithTimeout(url, { method: "GET", mode: "no-cors" }, timeoutMs).then(function (response) {
      return response && response.type === "opaque";
    }).catch(function () {
      return false;
    });
  }

  function fetchWithTimeout(url, init, timeoutMs) {
    var controller = new AbortController();
    var timer = setTimeout(function () {
      controller.abort();
    }, timeoutMs);

    init.signal = controller.signal;
    return fetch(url, init).finally(function () {
      clearTimeout(timer);
    });
  }

  function readResponse(response, responseType) {
    if (responseType === "blob") {
      return response.blob();
    }
    return response.text().then(function (text) {
      if (!text) {
        return {};
      }
      try {
        return JSON.parse(text);
      } catch (error) {
        return text;
      }
    });
  }

  function buildApiUrl(host, path, useSession) {
    var url = "http://" + normalizeHost(host) + ":" + API_PORT + "/api/" + path.replace(/^\/+/, "");
    if (useSession) {
      if (!state.session) {
        throw new Error("No active session");
      }
      url += (url.indexOf("?") === -1 ? "?" : "&") + "session=" + encodeURIComponent(state.session);
    }
    return url;
  }

  function upsertDevice(host, device) {
    var normalized = normalizeHost(host);
    var record = Object.assign({}, device || {}, {
      host: normalized,
      foundAt: new Date().toISOString()
    });
    var index = state.devices.findIndex(function (item) {
      return item.host === normalized;
    });
    if (index === -1) {
      state.devices.push(record);
    } else {
      state.devices[index] = Object.assign({}, state.devices[index], record);
    }
    state.devices.sort(function (a, b) {
      return compareHosts(a.host, b.host);
    });
  }

  function findDevice(host) {
    return state.devices.find(function (device) {
      return device.host === host;
    });
  }

  function normalizeHost(value) {
    return String(value || "")
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "")
      .replace(/:3333$/, "");
  }

  function compareHosts(a, b) {
    var pa = a.split(".").map(Number);
    var pb = b.split(".").map(Number);
    if (pa.length === 4 && pb.length === 4 && pa.every(isFinite) && pb.every(isFinite)) {
      for (var i = 0; i < 4; i += 1) {
        if (pa[i] !== pb[i]) {
          return pa[i] - pb[i];
        }
      }
      return 0;
    }
    return a.localeCompare(b);
  }

  function deviceTitle(device) {
    return device.deviceTitle || device.modelName || device.institutionName || device.departmentName || "MVR Recorder";
  }

  function deviceId(device) {
    return device.deviceId || device.serialNumber || "unknown";
  }

  function deviceVersions(device) {
    var parts = [];
    if (device.modelName) {
      parts.push(device.modelName);
    }
    if (device.firmwareVersion) {
      parts.push(device.firmwareVersion);
    }
    if (device.appVersion !== undefined && device.appVersion !== null) {
      parts.push("app " + device.appVersion);
    }
    return parts.length ? parts.join(", ") : "unknown";
  }

  function pickPublicDeviceFields(device) {
    return {
      Title: device.deviceTitle,
      Model: device.modelName,
      Institution: device.institutionName,
      Department: device.departmentName,
      Location: device.locationName,
      "Device ID": deviceId(device),
      Firmware: device.firmwareVersion,
      "App version": device.appVersion,
      "Internal display": formatValue(device.hasInternalDisplay),
      "Internal storage": formatValue(device.hasInternalStorage),
      "Lite model": formatValue(device.isLiteModel)
    };
  }

  function renderDefinitionList(element, data) {
    var pairs = Object.keys(data || {}).filter(function (key) {
      return data[key] !== undefined && data[key] !== null && data[key] !== "";
    });
    if (!pairs.length) {
      element.innerHTML = '<dt>Status</dt><dd class="muted">No data</dd>';
      return;
    }
    element.innerHTML = pairs.map(function (key) {
      return "<dt>" + escapeHtml(key) + "</dt><dd>" + escapeHtml(formatValue(data[key])) + "</dd>";
    }).join("");
  }

  function compactObject(data) {
    var result = {};
    Object.keys(data).forEach(function (key) {
      var value = data[key];
      if (value !== undefined && value !== null && value !== "") {
        result[key] = value;
      }
    });
    return result;
  }

  function settledValue(result) {
    return result && result.status === "fulfilled" ? result.value : null;
  }

  function formatValue(value) {
    if (value === undefined || value === null) {
      return "";
    }
    if (typeof value === "boolean") {
      return value ? "yes" : "no";
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  }

  function formatBytes(value) {
    var bytes = Number(value);
    if (!Number.isFinite(bytes) || bytes < 0) {
      return "unknown";
    }
    var units = ["B", "KB", "MB", "GB", "TB"];
    var index = 0;
    while (bytes >= 1024 && index < units.length - 1) {
      bytes /= 1024;
      index += 1;
    }
    return (index === 0 ? bytes : bytes.toFixed(1)) + " " + units[index];
  }

  function sortObjectForDisplay(value) {
    if (Array.isArray(value)) {
      return value.map(sortObjectForDisplay);
    }
    if (!value || typeof value !== "object") {
      return value;
    }
    return Object.keys(value).sort().reduce(function (result, key) {
      result[key] = sortObjectForDisplay(value[key]);
      return result;
    }, {});
  }

  function formatResponseBody(data) {
    if (data instanceof Blob) {
      return "binary response";
    }
    if (typeof data === "string") {
      return data;
    }
    return JSON.stringify(data);
  }

  function formatHttpError(response, data) {
    var status = response.status + " " + response.statusText;
    var body = formatResponseBody(data);
    if (!body || body === "{}") {
      return status;
    }
    if (body === response.statusText) {
      return status;
    }
    return status + ": " + body;
  }

  function setBusy(button, busy) {
    if (!button) {
      return;
    }
    button.disabled = busy;
    if (busy) {
      button.dataset.originalText = button.textContent;
      button.textContent = "Working";
    } else if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }

  function handleActionError(error, feedbackElement) {
    var message = normalizeErrorMessage(error);
    if (message.indexOf("Failed to fetch") !== -1) {
      message += ". Check the IP address and network route. Check if Remote Access is enabled on the target MVR recorder.";
    }
    setFeedback(feedbackElement, message, "bad");
    log(message, "bad");
  }

  function normalizeErrorMessage(error) {
    return error && error.name === "AbortError" ? "Request timed out" : (error && error.message) || String(error);
  }

  function setFeedback(element, message, level) {
    if (!element) {
      return;
    }
    element.className = "action-feedback " + (level || "info");
    element.textContent = new Date().toLocaleTimeString() + "  " + message;
  }

  function log(message, level) {
    var item = document.createElement("li");
    var time = new Date().toLocaleTimeString();
    item.innerHTML = '<strong class="' + escapeHtml(level || "info") + '">' + escapeHtml(time) + "</strong> " + escapeHtml(message);
    els.requestLog.prepend(item);
    while (els.requestLog.children.length > 80) {
      els.requestLog.removeChild(els.requestLog.lastChild);
    }
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /*
   * MD5 implementation for the MVR Basic Auth password hash.
   * Based on the public-domain algorithm by Joseph Myers.
   */
  function md5(input) {
    function add32(a, b) {
      return (a + b) & 0xffffffff;
    }
    function cmn(q, a, b, x, s, t) {
      return add32(((add32(add32(a, q), add32(x, t)) << s) | (add32(add32(a, q), add32(x, t)) >>> (32 - s))), b);
    }
    function ff(a, b, c, d, x, s, t) {
      return cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }
    function gg(a, b, c, d, x, s, t) {
      return cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }
    function hh(a, b, c, d, x, s, t) {
      return cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function ii(a, b, c, d, x, s, t) {
      return cmn(c ^ (b | (~d)), a, b, x, s, t);
    }
    function md5cycle(x, k) {
      var a = x[0], b = x[1], c = x[2], d = x[3];
      a = ff(a, b, c, d, k[0], 7, -680876936);
      d = ff(d, a, b, c, k[1], 12, -389564586);
      c = ff(c, d, a, b, k[2], 17, 606105819);
      b = ff(b, c, d, a, k[3], 22, -1044525330);
      a = ff(a, b, c, d, k[4], 7, -176418897);
      d = ff(d, a, b, c, k[5], 12, 1200080426);
      c = ff(c, d, a, b, k[6], 17, -1473231341);
      b = ff(b, c, d, a, k[7], 22, -45705983);
      a = ff(a, b, c, d, k[8], 7, 1770035416);
      d = ff(d, a, b, c, k[9], 12, -1958414417);
      c = ff(c, d, a, b, k[10], 17, -42063);
      b = ff(b, c, d, a, k[11], 22, -1990404162);
      a = ff(a, b, c, d, k[12], 7, 1804603682);
      d = ff(d, a, b, c, k[13], 12, -40341101);
      c = ff(c, d, a, b, k[14], 17, -1502002290);
      b = ff(b, c, d, a, k[15], 22, 1236535329);
      a = gg(a, b, c, d, k[1], 5, -165796510);
      d = gg(d, a, b, c, k[6], 9, -1069501632);
      c = gg(c, d, a, b, k[11], 14, 643717713);
      b = gg(b, c, d, a, k[0], 20, -373897302);
      a = gg(a, b, c, d, k[5], 5, -701558691);
      d = gg(d, a, b, c, k[10], 9, 38016083);
      c = gg(c, d, a, b, k[15], 14, -660478335);
      b = gg(b, c, d, a, k[4], 20, -405537848);
      a = gg(a, b, c, d, k[9], 5, 568446438);
      d = gg(d, a, b, c, k[14], 9, -1019803690);
      c = gg(c, d, a, b, k[3], 14, -187363961);
      b = gg(b, c, d, a, k[8], 20, 1163531501);
      a = gg(a, b, c, d, k[13], 5, -1444681467);
      d = gg(d, a, b, c, k[2], 9, -51403784);
      c = gg(c, d, a, b, k[7], 14, 1735328473);
      b = gg(b, c, d, a, k[12], 20, -1926607734);
      a = hh(a, b, c, d, k[5], 4, -378558);
      d = hh(d, a, b, c, k[8], 11, -2022574463);
      c = hh(c, d, a, b, k[11], 16, 1839030562);
      b = hh(b, c, d, a, k[14], 23, -35309556);
      a = hh(a, b, c, d, k[1], 4, -1530992060);
      d = hh(d, a, b, c, k[4], 11, 1272893353);
      c = hh(c, d, a, b, k[7], 16, -155497632);
      b = hh(b, c, d, a, k[10], 23, -1094730640);
      a = hh(a, b, c, d, k[13], 4, 681279174);
      d = hh(d, a, b, c, k[0], 11, -358537222);
      c = hh(c, d, a, b, k[3], 16, -722521979);
      b = hh(b, c, d, a, k[6], 23, 76029189);
      a = hh(a, b, c, d, k[9], 4, -640364487);
      d = hh(d, a, b, c, k[12], 11, -421815835);
      c = hh(c, d, a, b, k[15], 16, 530742520);
      b = hh(b, c, d, a, k[2], 23, -995338651);
      a = ii(a, b, c, d, k[0], 6, -198630844);
      d = ii(d, a, b, c, k[7], 10, 1126891415);
      c = ii(c, d, a, b, k[14], 15, -1416354905);
      b = ii(b, c, d, a, k[5], 21, -57434055);
      a = ii(a, b, c, d, k[12], 6, 1700485571);
      d = ii(d, a, b, c, k[3], 10, -1894986606);
      c = ii(c, d, a, b, k[10], 15, -1051523);
      b = ii(b, c, d, a, k[1], 21, -2054922799);
      a = ii(a, b, c, d, k[8], 6, 1873313359);
      d = ii(d, a, b, c, k[15], 10, -30611744);
      c = ii(c, d, a, b, k[6], 15, -1560198380);
      b = ii(b, c, d, a, k[13], 21, 1309151649);
      a = ii(a, b, c, d, k[4], 6, -145523070);
      d = ii(d, a, b, c, k[11], 10, -1120210379);
      c = ii(c, d, a, b, k[2], 15, 718787259);
      b = ii(b, c, d, a, k[9], 21, -343485551);
      x[0] = add32(a, x[0]);
      x[1] = add32(b, x[1]);
      x[2] = add32(c, x[2]);
      x[3] = add32(d, x[3]);
    }
    function md5blk(s) {
      var md5blks = [];
      for (var i = 0; i < 64; i += 4) {
        md5blks[i >> 2] = s.charCodeAt(i) +
          (s.charCodeAt(i + 1) << 8) +
          (s.charCodeAt(i + 2) << 16) +
          (s.charCodeAt(i + 3) << 24);
      }
      return md5blks;
    }
    function md51(s) {
      var n = s.length;
      var stateMd5 = [1732584193, -271733879, -1732584194, 271733878];
      var i;
      for (i = 64; i <= n; i += 64) {
        md5cycle(stateMd5, md5blk(s.substring(i - 64, i)));
      }
      s = s.substring(i - 64);
      var tail = new Array(16).fill(0);
      for (i = 0; i < s.length; i += 1) {
        tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
      }
      tail[i >> 2] |= 0x80 << ((i % 4) << 3);
      if (i > 55) {
        md5cycle(stateMd5, tail);
        tail = new Array(16).fill(0);
      }
      tail[14] = n * 8;
      md5cycle(stateMd5, tail);
      return stateMd5;
    }
    function rhex(n) {
      var s = "";
      for (var j = 0; j < 4; j += 1) {
        s += ("0" + ((n >> (j * 8 + 4)) & 0x0f).toString(16)).slice(-1) +
          ("0" + ((n >> (j * 8)) & 0x0f).toString(16)).slice(-1);
      }
      return s;
    }
    return md51(unescape(encodeURIComponent(input))).map(rhex).join("");
  }
}());
