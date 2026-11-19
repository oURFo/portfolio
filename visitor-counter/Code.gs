function doPost(event) {
  const visitorId = event.postData && event.postData.contents;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(visitorId)) {
    return respond({ error: 'invalid_visitor' });
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return respond({ error: 'temporarily_unavailable' });
  try {
    const visits = PropertiesService.getScriptProperties();
    const key = 'visitor:' + visitorId;
    if (visits.getProperty(key) === null) visits.setProperty(key, '1');
    return respond({ count: visits.getKeys().filter(key => key.startsWith('visitor:')).length });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  const visits = PropertiesService.getScriptProperties();
  return respond({ count: visits.getKeys().filter(key => key.startsWith('visitor:')).length });
}

function respond(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
