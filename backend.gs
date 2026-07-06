/* 
  RFE STORE BACKEND - FOAM EQUIPMENT & SERVICE
  
  1. Save this code.
  2. Run the 'setup()' function once.
  3. It will create the necessary Google Drive folders and Sheets.
  4. Deploy as Web App (New Version).
  
  FEATURES:
  - Serves images via direct Google Drive links.
  - Caches results for 20 minutes to improve performance.
  - Handles E-commerce Orders.
  - Handles Lead Submissions.
*/

// --- CONFIGURATION ---
var SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');

const ROOT_FOLDER_NAME = "RFE Store Assets";
const SHEET_NAME = "RFE Store Data";
const DOC_NAME = "RFE Blog Master Draft";
const CACHE_KEY = "site_assets_v3"; // Bumped version to force refresh

// MAPPING: Frontend Key -> Folder Name in Drive
// Images placed in these folders will be served to the frontend keys
const SITE_ASSETS_MAP = {
  'hero_bg':       '01 - Home Hero Image',
  'catalog_hero':  '02 - Catalog Hero Image',
  'blog_hero':     '03 - Blog Hero Image',
  'contact_bg':    '04 - Contact Section Background'
};

// PRODUCT LIST (Sync with frontend data.ts)
const PRODUCTS = [
  "Pro-Force Air Purge Gun",
  "R-10 Air Proportioner", 
  "Heated Hose Assembly (50ft)",
  "Turn-Key Mobile Spray Rig",
  "R2 Transfer Pump",
  "Gun Service Kit (O-Rings)"
];

// --- SETUP FUNCTION (RUN ONCE) ---
function setup() {
  const drive = DriveApp;
  
  // 1. Get or Create Root Folder
  const rootIter = drive.getFoldersByName(ROOT_FOLDER_NAME);
  let rootFolder;
  if (rootIter.hasNext()) {
    rootFolder = rootIter.next();
  } else {
    rootFolder = drive.createFolder(ROOT_FOLDER_NAME);
    rootFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }
  PropertiesService.getScriptProperties().setProperty('ROOT_FOLDER_ID', rootFolder.getId());
  
  let log = `Root Folder Setup: ${ROOT_FOLDER_NAME}\n`;

  // 2. Setup Site Asset Folders (Hero, etc.)
  const assetsFolder = getOrCreateSubFolder(rootFolder, "Site Assets");
  for (let key in SITE_ASSETS_MAP) {
    const folderName = SITE_ASSETS_MAP[key];
    getOrCreateSubFolder(assetsFolder, folderName);
  }
  log += "Site Asset Folders Checked.\n";

  // 3. Setup Product Image Folders
  const productsFolder = getOrCreateSubFolder(rootFolder, "Product Images");
  PRODUCTS.forEach(productName => {
    // Simple sanitization for folder names: "R-10 Air Proportioner" -> "R10 Air Proportioner"
    const safeName = productName.replace(/[^a-zA-Z0-9 ]/g, "");
    getOrCreateSubFolder(productsFolder, safeName);
  });
  log += "Product Folders Checked.\n";

  // 4. Setup Data Sheet (Orders & Leads)
  let ss;
  const files = rootFolder.getFilesByName(SHEET_NAME);
  if (files.hasNext()) {
    ss = SpreadsheetApp.open(files.next());
  } else {
    ss = SpreadsheetApp.create(SHEET_NAME);
    const file = DriveApp.getFileById(ss.getId());
    file.moveTo(rootFolder);
  }
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());

  setupOrdersSheet(ss);
  setupLeadsSheet(ss);
  
  log += `Spreadsheet Setup: ${ss.getUrl()}\n`;

  // 5. Setup Blog Doc
  setupBlogDoc(rootFolder);

  // Clear cache to force refresh after setup
  CacheService.getScriptCache().remove(CACHE_KEY);

  return log;
}

// --- API HANDLERS ---

function doGet(e) {
  // PERFORMANCE: Check Cache First
  // Google Drive operations are slow. We cache the result map for 20 minutes.
  const cache = CacheService.getScriptCache();
  const cachedResult = cache.get(CACHE_KEY);
  
  if (cachedResult) {
    return handleCORS(JSON.parse(cachedResult));
  }

  // If not in cache, scan Drive (takes 2-5 seconds)
  const assets = getAllAssets();
  const response = {
    status: 'success',
    assets: assets,
    timestamp: new Date().toISOString()
  };
  
  // Save to cache for 1200 seconds (20 minutes)
  cache.put(CACHE_KEY, JSON.stringify(response), 1200);

  return handleCORS(response);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || data.type; // Support both conventions

    if (action === 'order') {
      return handleOrder(data);
    } else if (action === 'lead') {
      return handleLead(data);
    } else {
      return handleCORS({ status: 'error', message: 'Unknown action' });
    }

  } catch (error) {
    return handleCORS({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function doOptions(e) {
  return handleCORS({}); 
}

// --- LOGIC HANDLERS ---

function getAllAssets() {
  const rootId = PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_ID');
  if (!rootId) return { error: "Setup not run" };
  
  const rootFolder = DriveApp.getFolderById(rootId);
  const assets = {
    site: {},
    products: {}
  };

  // 1. Get Site Assets
  const assetsFolderIter = rootFolder.getFoldersByName("Site Assets");
  if (assetsFolderIter.hasNext()) {
    const assetsFolder = assetsFolderIter.next();
    
    for (let key in SITE_ASSETS_MAP) {
      const folderName = SITE_ASSETS_MAP[key];
      const folders = assetsFolder.getFoldersByName(folderName);
      if (folders.hasNext()) {
        const folder = folders.next();
        const files = folder.getFiles();
        if (files.hasNext()) {
           // High quality thumbnail link (up to 1920px)
           assets.site[key] = `https://drive.google.com/thumbnail?sz=w1920&id=${files.next().getId()}`;
        }
      }
    }
  }

  // 2. Get Product Assets
  const productsFolderIter = rootFolder.getFoldersByName("Product Images");
  if (productsFolderIter.hasNext()) {
    const mainProdFolder = productsFolderIter.next();
    const subFolders = mainProdFolder.getFolders();
    while (subFolders.hasNext()) {
      const folder = subFolders.next();
      const files = folder.getFiles();
      if (files.hasNext()) {
        // IMPORTANT FIX: Sanitize folder name to match frontend expectation.
        // This ensures if Drive folder is "R-10", it becomes key "R10" so the website finds it.
        const rawName = folder.getName();
        const safeName = rawName.replace(/[^a-zA-Z0-9 ]/g, "");
        
        // High quality thumbnail link
        assets.products[safeName] = `https://drive.google.com/thumbnail?sz=w1920&id=${files.next().getId()}`;
      }
    }
  }

  return assets;
}

function handleOrder(data) {
  const ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName("Orders");
  
  const orderId = 'ORD-' + Math.floor(Math.random() * 1000000);
  
  // Format Address from object to string if needed, or take direct string
  let addressStr = "";
  if (typeof data.shippingAddress === 'object') {
     addressStr = `${data.shippingAddress.address1}, ${data.shippingAddress.address2 || ''}, ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}, ${data.shippingAddress.country}`;
  } else {
     addressStr = data.shippingAddress || "N/A";
  }

  sheet.appendRow([
    new Date(),
    orderId,
    data.customerName || "Guest",
    data.email,
    data.phone || "",       // Added Phone
    addressStr,             // Added Address
    data.total,
    JSON.stringify(data.items),
    "New"
  ]);

  // Send Order Confirmation Email to Client
  if (data.email) {
    try {
      const subject = `Order Confirmation from RFE - ${orderId}`;
      let body = `Hi ${data.customerName || 'Customer'},\n\nThank you for your order with RFE Foam Equipment. We have received your request and will contact you shortly regarding payment and fulfillment.\n\nOrder Details:\nOrder ID: ${orderId}\nTotal: $${data.total}\n\nShipping Address:\n${addressStr}\n\nItems:\n`;
      
      if (data.items && Array.isArray(data.items)) {
         data.items.forEach(item => {
           body += `- ${item.name} (x${item.quantity}): $${item.price * item.quantity}\n`;
         });
      }
      body += `\nWe appreciate your business!\n\nBest regards,\nThe RFE Team`;

      MailApp.sendEmail({
        to: data.email,
        subject: subject,
        body: body
      });
    } catch (e) {
      console.error("Client email failed: " + e);
    }
  }

  // Send Notification to Admin
  try {
    const adminEmail = Session.getEffectiveUser().getEmail();
    if (adminEmail) {
      MailApp.sendEmail({
        to: adminEmail,
        subject: `New Order Received - ${orderId}`,
        body: `A new order has been placed on the RFE Website.\n\nOrder ID: ${orderId}\nCustomer: ${data.customerName || 'Guest'}\nEmail: ${data.email}\nPhone: ${data.phone || 'N/A'}\nTotal: $${data.total}\n\nPlease check the Google Sheet for full details.`
      });
    }
  } catch (e) {
    console.error("Admin email failed: " + e);
  }

  return handleCORS({ 
    status: 'success', 
    message: 'Order Placed',
    orderId: orderId 
  });
}

function handleLead(data) {
  const ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName("Leads");
  
  sheet.appendRow([
    "New",
    new Date(),
    data.name,
    data.email,
    data.phone || "",
    data.company || "",
    data.message,
    data.type || "Inquiry"
  ]);
  
  // Send Confirmation Email to Client
  if (data.email) {
    try {
      const subject = `Thank you for contacting RFE Foam Equipment`;
      let body = `Hi ${data.name || 'there'},\n\nThank you for reaching out to RFE Foam Equipment! We have received your ${data.type || 'inquiry'} and a member of our team will be in touch with you shortly.\n\n`;
      if (data.message) {
         body += `--- \nYour Message:\n${data.message}\n\n`;
      }
      body += `Best regards,\nThe RFE Team`;

      MailApp.sendEmail({
        to: data.email,
        subject: subject,
        body: body
      });
    } catch (e) {
      console.error("Client lead email failed: " + e);
    }
  }

  // Send Notification to Admin
  try {
    const adminEmail = Session.getEffectiveUser().getEmail();
    if (adminEmail) {
      MailApp.sendEmail({
        to: adminEmail,
        subject: `New Lead: ${data.name} - ${data.type || 'Inquiry'}`,
        body: `You have received a new lead from the RFE website.\n\nName: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone || 'N/A'}\nCompany: ${data.company || 'N/A'}\nType: ${data.type || 'Inquiry'}\nMessage:\n${data.message || 'N/A'}`
      });
    }
  } catch (e) {
    console.error("Admin lead email failed: " + e);
  }

  return handleCORS({ status: 'success', message: 'Lead Captured' });
}

// --- HELPER UTILS ---

function getOrCreateSubFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    const newFolder = parent.createFolder(name);
    newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return newFolder;
  }
}

function setupOrdersSheet(ss) {
  let sheet = ss.getSheetByName("Orders");
  if (!sheet) {
    sheet = ss.insertSheet("Orders");
    // Updated Headers with Phone and Address
    sheet.appendRow(["Timestamp", "Order ID", "Customer Name", "Email", "Phone", "Shipping Address", "Total Amount", "Items JSON", "Status"]);
    sheet.setFrozenRows(1);
    sheet.getRange("A1:I1").setFontWeight("bold").setBackground("#E60012").setFontColor("#FFFFFF");
  }
}

function setupLeadsSheet(ss) {
  let sheet = ss.getSheetByName("Leads");
  if (!sheet) {
    sheet = ss.insertSheet("Leads");
    sheet.appendRow(["Status", "Date", "Name", "Email", "Phone", "Company", "Message", "Type"]);
    sheet.setFrozenRows(1);
    sheet.getRange("A1:H1").setFontWeight("bold").setBackground("#FFED00").setFontColor("#000000");
    
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['New', 'Contacted', 'Closed'], true)
      .build();
    sheet.getRange("A2:A1000").setDataValidation(rule);
  }
}

function setupBlogDoc(folder) {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('BLOG_DOC_ID')) {
    const existing = folder.getFilesByName(DOC_NAME);
    if (existing.hasNext()) {
      props.setProperty('BLOG_DOC_ID', existing.next().getId());
    } else {
      const doc = DocumentApp.create(DOC_NAME);
      const file = DriveApp.getFileById(doc.getId());
      file.moveTo(folder);
      doc.getBody().setText("RFE Blog Content Master");
      props.setProperty('BLOG_DOC_ID', doc.getId());
    }
  }
}

function handleCORS(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}