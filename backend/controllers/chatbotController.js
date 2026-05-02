/**
 * Chatbot Controller — Enhanced Shopping Assistant
 * Handles incoming chat messages, enriches with context,
 * calls Gemini AI, routes actions to cart/checkout services,
 * and manages session-based conversational memory.
 */

import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import jwt from "jsonwebtoken";
import { callGemini, parseResponse } from "../services/geminiService.js";
import { getProductVariants, addItemToCart, getCartSummary, removeItemFromCart } from "../services/aiCartService.js";
import {
  validateShippingAddress,
  parseShippingAddress,
  placeOrderFromCart,
} from "../services/aiCheckoutService.js";
import { applyDiscountToCart, findCartProductByName, resetDiscountFlag } from "../services/discountService.js";

// ═══════════════════════════════════════
// Rate Limiter
// ═══════════════════════════════════════
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 20;

const checkRateLimit = (ip) => {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
};

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now - val.start > RATE_LIMIT_WINDOW * 2) rateLimitMap.delete(key);
  }
}, 300_000);

// ═══════════════════════════════════════
// Product & Category Cache
// ═══════════════════════════════════════
let cachedProducts = null;
let cachedCategories = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

const getProductsAndCategories = async () => {
  const now = Date.now();
  if (cachedProducts && cachedCategories && now - cacheTimestamp < CACHE_TTL) {
    return { products: cachedProducts, categories: cachedCategories };
  }

  const [products, categories] = await Promise.all([
    productModel
      .find({})
      .select(
        "name description basePrice minPrice sku categoryName subCategoryName bestSeller images averageRating numReviews sizes colors stock variants"
      )
      .lean(),
    categoryModel.find({}).lean(),
  ]);

  cachedProducts = products;
  cachedCategories = categories;
  cacheTimestamp = now;

  return { products, categories };
};

// ═══════════════════════════════════════
// Session Memory Store
// ═══════════════════════════════════════
const sessionStore = new Map();
const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

const getSession = (sessionKey) => {
  const session = sessionStore.get(sessionKey);
  if (session && Date.now() - session.lastAccess < SESSION_TTL) {
    session.lastAccess = Date.now();
    return session;
  }
  // Create new session
  const newSession = {
    lastAccess: Date.now(),
    lastViewedProduct: null,
    lastViewedProductName: null,
    selectedSize: null,
    selectedColor: null,
    checkoutState: "IDLE", // IDLE | CART_REVIEW | AWAITING_ADDRESS | AWAITING_CONFIRM
    shippingAddress: null,
    cartItemCount: 0,
    messageCount: 0,
    conversationHistory: [], // { role: "user"|"model", text }
  };
  sessionStore.set(sessionKey, newSession);
  return newSession;
};

// Cleanup old sessions every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of sessionStore) {
    if (now - val.lastAccess > SESSION_TTL) sessionStore.delete(key);
  }
}, 600_000);

// ═══════════════════════════════════════
// Helper: Extract user from token
// ═══════════════════════════════════════
const extractUser = async (token) => {
  if (!token) {
    console.log("[Chatbot] No token provided in headers");
    return null;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded?.id) {
      const user = await userModel.findById(decoded.id).select("name email cartData").lean();
      console.log("[Chatbot] Auth:", user ? `✅ ${user.name}` : "❌ user not found in DB");
      return user;
    }
  } catch (err) {
    console.log("[Chatbot] Token verify failed:", err.message);
    return null;
  }
  return null;
};

// ═══════════════════════════════════════
// Helper: Build product cards from IDs
// ═══════════════════════════════════════
const buildProductCards = (productIds, products) => {
  const items = [];
  for (const id of productIds.slice(0, 5)) {
    // Try exact ID match first
    let p = products.find((pr) => pr._id.toString() === id);
    // Fallback: try matching ID as a product name (AI sometimes returns names instead of IDs)
    if (!p) {
      p = products.find(
        (pr) => pr.name.toLowerCase() === id.toLowerCase()
      );
    }
    if (!p) {
      console.log(`[Chatbot] buildProductCards: no match for "${id}"`);
    }
    if (p) {
      items.push({
        id: p._id.toString(),
        name: p.name,
        description: (p.description || "").substring(0, 80),
        price: `$${p.basePrice}`,
        image: p.images?.[0]?.url || "",
        url: `/product/${p._id}`,
      });
    }
  }
  console.log(`[Chatbot] buildProductCards: ${productIds.length} requested → ${items.length} matched`);
  return items.length > 0
    ? [{ type: "product_card", items }]
    : [];
};

// ═══════════════════════════════════════
// Helper: Build category cards from IDs
// ═══════════════════════════════════════
const buildCategoryCards = (categoryIds, categories) => {
  const items = [];
  for (const id of categoryIds.slice(0, 5)) {
    // Try exact ID match first
    let c = categories.find((cat) => cat._id.toString() === id);
    // Fallback: try matching ID as a category name
    if (!c) {
      c = categories.find(
        (cat) => cat.name.toLowerCase() === id.toLowerCase()
      );
    }
    if (!c) {
      console.log(`[Chatbot] buildCategoryCards: no match for "${id}"`);
    }
    if (c) {
      items.push({
        id: c._id.toString(),
        name: c.name,
        description: `Browse our ${c.name} collection`,
        url: `/collection?category=${c.name}`,
      });
    }
  }
  console.log(`[Chatbot] buildCategoryCards: ${categoryIds.length} requested → ${items.length} matched`);
  return items.length > 0
    ? [{ type: "category_card", items }]
    : [];
};

// ═══════════════════════════════════════
// Main: sendMessage
// ═══════════════════════════════════════
const sendMessage = async (req, res) => {
  try {
    // Rate limit
    const clientIp = req.ip || req.connection?.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        success: false,
        message: "Too many messages. Please wait a moment before trying again.",
      });
    }

    // Validate message
    const { message } = req.body;
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }
    if (message.length > 500) {
      return res.status(400).json({ success: false, message: "Message is too long (max 500 chars)." });
    }

    // Extract user
    const { token } = req.headers;
    const user = await extractUser(token);
    const userName = user?.name || null;
    const userId = user?._id?.toString() || null;
    const isAuthenticated = !!userId;

    // Session
    const sessionKey = userId || clientIp;
    const session = getSession(sessionKey);
    session.cartItemCount = user?.cartData?.length || 0;
    session.messageCount = (session.messageCount || 0) + 1;

    // Fetch product & category data
    const { products, categories } = await getProductsAndCategories();

    // Call Gemini AI with conversation history
    const rawResponse = await callGemini(message.trim(), {
      userName,
      products,
      categories,
      isAuthenticated,
      sessionContext: session,
      conversationHistory: session.conversationHistory || [],
    });

    // Parse response
    const parsed = parseResponse(rawResponse);
    const action = parsed.action;

    console.log("[Chatbot] AI action:", JSON.stringify(action));
    console.log("[Chatbot] isAuthenticated:", isAuthenticated, "| userId:", userId);

    // ── Safety net: AI sometimes tells authenticated users to "log in" ──
    // If user IS authenticated but AI responded with action:"none" and text mentions logging in,
    // override by re-interpreting the user's original message intent.
    if (isAuthenticated && action?.action === "none" && parsed.text) {
      const textLower = (parsed.text || "").toLowerCase();
      const mentionsLogin = textLower.includes("log in") || textLower.includes("login") || textLower.includes("sign in");
      if (mentionsLogin) {
        console.log("[Chatbot] Safety net: AI told authenticated user to log in — overriding");
        // Try to infer user intent from the original message
        const msgLower = message.trim().toLowerCase();
        if (msgLower.includes("add") && msgLower.includes("cart")) {
          // User wants to add to cart — tell them we're on it
          parsed.text = `Let me help you with that! 🛒`;
          // Let the existing add_to_cart flow handle it below
          action.action = "add_to_cart";
          // Try to find the product from the message
          const matchedProduct = products.find((p) =>
            msgLower.includes(p.name.toLowerCase())
          );
          if (matchedProduct) {
            action.productId = matchedProduct._id.toString();
            // Extract size/color from message
            const sizeMatch = (matchedProduct.sizes || []).find((s) => msgLower.includes(s.toLowerCase()));
            const colorMatch = (matchedProduct.colors || []).find((c) => msgLower.includes(c.name.toLowerCase()));
            action.size = sizeMatch || "";
            action.color = colorMatch?.name || "";
            action.quantity = 1;
          }
        } else if (msgLower.includes("cart") || msgLower.includes("show cart") || msgLower.includes("my cart")) {
          action.action = "show_cart";
          parsed.text = "";
        } else if (msgLower.includes("remove") || msgLower.includes("delete")) {
          action.action = "remove_from_cart";
          parsed.text = "";
        } else if (msgLower.includes("checkout") || msgLower.includes("order") || msgLower.includes("place order")) {
          action.action = "checkout";
          parsed.text = "";
        } else if (msgLower.includes("my orders") || msgLower.includes("order history")) {
          action.action = "show_orders";
          parsed.text = "";
        } else {
          // Generic override — just remove the "log in" suggestion
          parsed.text = parsed.text.replace(/\[log in\]\(\/login\)/gi, "").replace(/please log in[^.]*\./gi, "").replace(/please sign in[^.]*\./gi, "").trim();
        }
      }
    }

    // Default response structure
    let responseCards = [];
    let responseText = parsed.text || "";

    // ─── Handle greetings BEFORE action routing ───
    const msgLower = message.trim().toLowerCase();
    const isGreeting = /^(hi|hello|hey|hiya|howdy|good morning|good afternoon|good evening|what'?s up|whatsup|sup|yo|greetings|hi there|hello there|hey there)$/i.test(msgLower) || /^(hi|hey|hello|yo)$/i.test(msgLower.split(/\s+/)[0]);
    if (isGreeting) {
      responseText = userName
        ? `Hi ${userName}! 👋 Welcome to IntelliCart! How can I help you shop today?`
        : `Hello! 👋 Welcome to IntelliCart! How can I help you shop today?`;
    }

    // ─── Route actions ───
    if (action) {
      switch (action.action) {
        // ── Show products ──
        case "show_products": {
          const ids = action.productIds || [];
          responseCards = buildProductCards(ids, products);

          // Fallback: if no cards matched by ID, try to find products by category/subcategory
          // based on keywords in the AI's text or the user's message
          if (responseCards.length === 0 && ids.length > 0) {
            console.log("[Chatbot] show_products: no ID matches, trying name/category fallback");
            // Try matching IDs as product names (partial)
            const fallbackItems = [];
            for (const id of ids.slice(0, 5)) {
              const nameMatch = products.find(
                (pr) => pr.name.toLowerCase().includes(id.toLowerCase())
              );
              if (nameMatch && !fallbackItems.find((f) => f.id === nameMatch._id.toString())) {
                fallbackItems.push({
                  id: nameMatch._id.toString(),
                  name: nameMatch.name,
                  description: (nameMatch.description || "").substring(0, 80),
                  price: `$${nameMatch.basePrice}`,
                  image: nameMatch.images?.[0]?.url || "",
                  url: `/product/${nameMatch._id}`,
                });
              }
            }
            if (fallbackItems.length > 0) {
              responseCards = [{ type: "product_card", items: fallbackItems }];
            }
          }

          // Last resort: if STILL no cards, search products by category/subcategory/name
          // using keywords from BOTH the user's message AND conversation history
          if (responseCards.length === 0) {
            const msgLower = message.trim().toLowerCase();
            // Also check AI response text for clues (e.g. "Here are our Sofas")
            const aiTextLower = (parsed.text || "").toLowerCase();
            const searchText = `${msgLower} ${aiTextLower}`;

            let matchedProducts = [];

            // 1) Try subcategory match (e.g. "beds", "sofas", "shirts", "tops")
            const allSubcategories = [...new Set(products.map((p) => (p.subCategoryName || "").toLowerCase()).filter(Boolean))];
            for (const sub of allSubcategories) {
              // Check if user message or AI text mentions this subcategory
              // Handle both singular and plural forms
              const subSingular = sub.replace(/s$/, ""); // "sofas" → "sofa"
              if (searchText.includes(sub) || searchText.includes(subSingular)) {
                const subProducts = products.filter(
                  (pr) => (pr.subCategoryName || "").toLowerCase() === sub
                );
                matchedProducts.push(...subProducts);
              }
            }

            // 2) Try category match (e.g. "men", "women", "kids")
            if (matchedProducts.length === 0) {
              const allCategories = [...new Set(products.map((p) => (p.categoryName || "").toLowerCase()).filter(Boolean))];
              for (const cat of allCategories) {
                const catSingular = cat.replace(/s$/, "");
                if (searchText.includes(cat) || searchText.includes(catSingular)
                    || (cat === "kids" && (searchText.includes("boy") || searchText.includes("girl") || searchText.includes("child")))) {
                  const catProducts = products.filter(
                    (pr) => (pr.categoryName || "").toLowerCase() === cat
                  );
                  matchedProducts.push(...catProducts);
                }
              }
            }

            // 3) Try matching by product name keywords
            if (matchedProducts.length === 0) {
              const words = msgLower.split(/\s+/).filter((w) => w.length > 2);
              for (const word of words) {
                const nameMatches = products.filter((pr) =>
                  (pr.name || "").toLowerCase().includes(word)
                );
                matchedProducts.push(...nameMatches);
              }
            }

            // Dedupe and limit
            if (matchedProducts.length > 0) {
              const seen = new Set();
              const uniqueProducts = matchedProducts.filter((p) => {
                const id = p._id.toString();
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
              }).slice(0, 5);

              console.log(`[Chatbot] show_products: last-resort keyword search found ${uniqueProducts.length} product(s)`);
              responseCards = [{
                type: "product_card",
                items: uniqueProducts.map((p) => ({
                  id: p._id.toString(),
                  name: p.name,
                  description: (p.description || "").substring(0, 80),
                  price: `$${p.basePrice}`,
                  image: p.images?.[0]?.url || "",
                  url: `/product/${p._id}`,
                })),
              }];
            }
          }

          // If still no cards after all fallbacks, override AI text with honest message
          if (responseCards.length === 0) {
            // Extract what the user was looking for
            const msgLower = message.trim().toLowerCase();
            const searchTerms = msgLower.replace(/show|any|do you have|products?|items?|in|the|and|or|me|please|i want|looking for/gi, "").trim();
            responseText = searchTerms
              ? `Sorry, we don't have any **${searchTerms}** products available right now. You can browse our [full collection](/collection) to see what's in stock! 🛍️`
              : "Sorry, I couldn't find any matching products right now. Browse our [full collection](/collection) to see what's available! 🛍️";
          }

          // Track last viewed product
          if (ids.length === 1) {
            const p = products.find((pr) => pr._id.toString() === ids[0]);
            if (p) {
              session.lastViewedProduct = p._id.toString();
              session.lastViewedProductName = p.name;
            }
          }
          break;
        }

        // ── Show categories ──
        case "show_categories": {
          const ids = action.categoryIds || [];
          responseCards = buildCategoryCards(ids, categories);

          // Fallback: if no cards matched, try name-based matching
          if (responseCards.length === 0 && ids.length > 0) {
            console.log("[Chatbot] show_categories: no ID matches, trying name fallback");
            const fallbackItems = [];
            for (const id of ids.slice(0, 5)) {
              const nameMatch = categories.find(
                (cat) => cat.name.toLowerCase().includes(id.toLowerCase())
              );
              if (nameMatch && !fallbackItems.find((f) => f.id === nameMatch._id.toString())) {
                fallbackItems.push({
                  id: nameMatch._id.toString(),
                  name: nameMatch.name,
                  description: `Browse our ${nameMatch.name} collection`,
                  url: `/collection?category=${nameMatch.name}`,
                });
              }
            }
            if (fallbackItems.length > 0) {
              responseCards = [{ type: "category_card", items: fallbackItems }];
            }
          }

          // Last resort for categories: if still no cards, try extracting from user message
          if (responseCards.length === 0) {
            const msgLower = message.trim().toLowerCase();
            const aiTextLower = (parsed.text || "").toLowerCase();
            const combinedText = `${msgLower} ${aiTextLower}`;

            // Try matching known categories by name
            for (const cat of categories) {
              const catLower = cat.name.toLowerCase();
              const catSingular = catLower.replace(/s$/, "");
              if (combinedText.includes(catLower) || combinedText.includes(catSingular)) {
                responseCards = [{
                  type: "category_card",
                  items: [{
                    id: cat._id.toString(),
                    name: cat.name,
                    description: `Browse our ${cat.name} collection`,
                    url: `/collection?category=${cat.name}`,
                  }],
                }];
                break;
              }
            }

            // If still no category match, check if user mentioned a subcategory
            // and show products from that subcategory instead
            if (responseCards.length === 0) {
              const allSubcategories = [...new Set(products.map((p) => (p.subCategoryName || "").toLowerCase()).filter(Boolean))];
              for (const sub of allSubcategories) {
                const subSingular = sub.replace(/s$/, "");
                if (combinedText.includes(sub) || combinedText.includes(subSingular)) {
                  const subProducts = products
                    .filter((pr) => (pr.subCategoryName || "").toLowerCase() === sub)
                    .slice(0, 5);
                  if (subProducts.length > 0) {
                    console.log(`[Chatbot] show_categories → subcategory fallback: "${sub}" (${subProducts.length} products)`);
                    responseCards = [{
                      type: "product_card",
                      items: subProducts.map((p) => ({
                        id: p._id.toString(),
                        name: p.name,
                        description: (p.description || "").substring(0, 80),
                        price: `$${p.basePrice}`,
                        image: p.images?.[0]?.url || "",
                        url: `/product/${p._id}`,
                      })),
                    }];
                    break;
                  }
                }
              }
            }
          }

          // If still no cards after all category/subcategory fallbacks, say so honestly
          if (responseCards.length === 0) {
            const msgLower = message.trim().toLowerCase();
            const searchTerms = msgLower.replace(/show|any|do you have|products?|items?|categories?|in|the|and|or|me|please|i want|looking for/gi, "").trim();
            responseText = searchTerms
              ? `Sorry, we don't have any **${searchTerms}** products available right now. Browse our [full collection](/collection) to see what's in stock! 🛍️`
              : "Sorry, I couldn't find any matching products in that category right now. Browse our [full collection](/collection) to explore! 🛍️";
          }
          break;
        }

        // ── Show variants ──
        case "show_variants": {
          const productId = action.productId || session.lastViewedProduct;
          if (!productId) {
            responseText = "Which product would you like to see sizes and colors for? 🤔";
            break;
          }
          const variantResult = await getProductVariants(productId);
          if (variantResult.success) {
            responseCards = [variantResult.data];
            session.lastViewedProduct = productId;
            session.lastViewedProductName = variantResult.data.name;
          } else {
            responseText = variantResult.message || "Product not found.";
          }
          break;
        }

        // ── Add to cart ──
        case "add_to_cart": {
          if (!isAuthenticated) {
            responseText = "Please [log in](/login) to add items to your cart! 🔐";
            break;
          }
          const pid = action.productId || session.lastViewedProduct;
          if (!pid) {
            responseText = "Which product would you like to add? Please specify or browse products first! 🛍️";
            break;
          }
          const size = action.size || session.selectedSize || "";
          const color = action.color || session.selectedColor || "";
          const quantity = action.quantity || 1;

          const cartResult = await addItemToCart(userId, pid, size, color, quantity);

          if (cartResult.success) {
            // Update session
            session.cartItemCount = (session.cartItemCount || 0) + quantity;
            session.selectedSize = null;
            session.selectedColor = null;

            responseCards = [
              {
                type: "cart_confirmation",
                item: cartResult.item,
              },
            ];
            if (!responseText) {
              responseText = `Added to your cart! 🛒`;
            }
          } else if (cartResult.message === "SIZE_REQUIRED") {
            // Show variant card to pick size
            const variantResult = await getProductVariants(pid);
            if (variantResult.success) {
              responseCards = [
                {
                  ...variantResult.data,
                  selectMode: "size",
                },
              ];
            }
            responseText = `Please select a size first! Available sizes: **${cartResult.availableSizes.join(", ")}**`;
            session.lastViewedProduct = pid;
          } else if (cartResult.message === "COLOR_REQUIRED") {
            const variantResult = await getProductVariants(pid);
            if (variantResult.success) {
              responseCards = [
                {
                  ...variantResult.data,
                  selectMode: "color",
                },
              ];
            }
            responseText = `Please select a color first! Available colors: **${cartResult.availableColors.map((c) => c.name).join(", ")}**`;
            session.lastViewedProduct = pid;
          } else {
            responseText = cartResult.message || "Couldn't add to cart. Please try again.";
          }
          break;
        }

        // ── Show cart ──
        case "show_cart": {
          if (!isAuthenticated) {
            responseText = "Please [log in](/login) to view your cart! 🔐";
            break;
          }
          const cartSummary = await getCartSummary(userId);
          if (cartSummary.success) {
            responseCards = [cartSummary.data];
            session.cartItemCount = cartSummary.data.items.length;
          } else {
            responseText = cartSummary.message || "Couldn't load cart.";
          }
          break;
        }

        // ── Remove from cart ──
        case "remove_from_cart": {
          if (!isAuthenticated) {
            responseText = "Please [log in](/login) to manage your cart! 🔐";
            break;
          }

          let productName = action.productName || "";

          // If user says "remove it" without specifying, use lastViewedProduct
          if (!productName && session.lastViewedProduct) {
            productName = session.lastViewedProduct.name;
          }

          if (!productName) {
            responseText = "Which product would you like me to remove from your cart? 🤔";
            break;
          }

          const removeResult = await removeItemFromCart(
            userId,
            productName,
            action.size || "",
            action.color || ""
          );

          responseText = removeResult.message;

          // After removal, show updated cart if there are still items
          if (removeResult.success && productName !== "ALL") {
            const updatedCart = await getCartSummary(userId);
            if (updatedCart.success) {
              responseCards = [updatedCart.data];
              session.cartItemCount = updatedCart.data.items.length;
            }
          } else if (removeResult.success) {
            session.cartItemCount = 0;
          }
          break;
        }

        // ── Checkout ──
        case "checkout": {
          if (!isAuthenticated) {
            responseText = "Please [log in](/login) to checkout! 🔐";
            break;
          }
          // Get cart summary first
          const checkoutCart = await getCartSummary(userId);
          if (!checkoutCart.success || checkoutCart.data.items.length === 0) {
            responseText = "Your cart is empty! Add some items first. 🛍️";
            session.checkoutState = "IDLE";
            break;
          }
          // Show cart and ask for address
          responseCards = [
            {
              ...checkoutCart.data,
              type: "checkout_prompt",
            },
          ];
          responseText = responseText || "Here's your cart! 🛒 Please provide your shipping details in this format:\n\n**Full Name, Email, Phone, Address, City, Postal Code**";
          session.checkoutState = "AWAITING_ADDRESS";
          break;
        }

        // ── Shipping address ──
        case "shipping_address": {
          if (!isAuthenticated) {
            responseText = "Please [log in](/login) to proceed! 🔐";
            break;
          }
          const addressText = action.address || message.trim();
          const parseResult = parseShippingAddress(addressText);

          if (!parseResult.success) {
            responseText = parseResult.message;
            break;
          }

          const validation = validateShippingAddress(parseResult.address);
          if (!validation.valid) {
            responseText = validation.message;
            break;
          }

          // Store address in session and ask for confirmation
          session.shippingAddress = parseResult.address;
          session.checkoutState = "AWAITING_CONFIRM";

          // Get cart summary for confirmation display
          const confirmCart = await getCartSummary(userId);
          const addr = parseResult.address;

          responseCards = [
            {
              type: "order_preview",
              cart: confirmCart.success ? confirmCart.data : null,
              shipping: {
                fullName: addr.fullName,
                email: addr.email || user?.email || "",
                phone: addr.phone,
                address: addr.address,
                city: addr.city,
                postalCode: addr.postalCode,
              },
              paymentMethod: "Cash on Delivery",
            },
          ];

          responseText = `Please confirm your order:\n\n📦 **Ship to:** ${addr.fullName}, ${addr.address}, ${addr.city} ${addr.postalCode}\n📞 ${addr.phone}\n💰 **Payment:** Cash on Delivery\n\nType **"confirm"** to place your order or **"cancel"** to abort.`;
          break;
        }

        // ── Confirm order ──
        case "confirm_order": {
          if (!isAuthenticated) {
            responseText = "Please [log in](/login) to place an order! 🔐";
            break;
          }
          if (session.checkoutState !== "AWAITING_CONFIRM" || !session.shippingAddress) {
            responseText = "No pending order to confirm. Start checkout by saying \"checkout\"! 🛒";
            break;
          }

          const orderResult = await placeOrderFromCart(userId, session.shippingAddress);

          if (orderResult.success) {
            const ord = orderResult.order;
            responseCards = [
              {
                type: "order_confirmation",
                orderId: ord.orderId,
                items: ord.items,
                total: ord.totalPrice,
                status: ord.status || "Pending",
                shipping: session.shippingAddress,
              },
            ];
            responseText = `🎉 Order placed successfully! Your order ID is **${ord.orderId.slice(-8).toUpperCase()}**. Thank you for shopping with NOVA!`;
            // Reset session
            session.checkoutState = "IDLE";
            session.shippingAddress = null;
            session.cartItemCount = 0;
            // Reset discount flag so next cart session can negotiate again
            await resetDiscountFlag(userId);
          } else {
            responseText = orderResult.message || "Failed to place order. Please try again.";
          }
          break;
        }

        // ── Cancel checkout ──
        case "cancel_checkout": {
          session.checkoutState = "IDLE";
          session.shippingAddress = null;
          responseText = responseText || "Checkout cancelled. You can continue browsing! 🛍️";
          break;
        }

        // ── Show orders (order history) ──
        case "show_orders": {
          if (!isAuthenticated) {
            responseText = "Please [log in](/login) to view your orders! 🔐";
            break;
          }
          const orders = await orderModel
            .find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

          if (!orders || orders.length === 0) {
            responseText = "You don't have any orders yet. Start shopping and place your first order! 🛍️";
            break;
          }

          responseCards = [
            {
              type: "order_history",
              orders: orders.map((o) => ({
                orderId: o._id.toString(),
                items: (o.items || []).map((i) => ({
                  name: i.name,
                  size: i.size || "",
                  color: i.color || "",
                  quantity: i.quantity,
                  price: i.price,
                  image: i.image || "",
                })),
                total: o.totalPrice,
                status: o.orderStatus,
                date: o.createdAt,
                shipping: o.shippingAddress
                  ? {
                      fullName: o.shippingAddress.fullName,
                      address: o.shippingAddress.address,
                      city: o.shippingAddress.city,
                      postalCode: o.shippingAddress.postalCode,
                    }
                  : null,
              })),
            },
          ];
          if (!responseText) {
            responseText = `Here are your recent orders (${orders.length}):`;
          }
          break;
        }

        // ── Apply discount ──
        case "apply_discount": {
          if (!isAuthenticated) {
            responseText = "Please [log in](/login) to get a discount! 🔐";
            break;
          }

          // Resolve product IDs from names (if AI sent product names)
          let discountProductIds = null;
          const productNames = action.productNames || [];

          if (productNames.length > 0) {
            discountProductIds = [];
            for (const name of productNames) {
              const ids = await findCartProductByName(userId, name);
              discountProductIds.push(...ids);
            }
            // Deduplicate
            discountProductIds = [...new Set(discountProductIds)];
            if (discountProductIds.length === 0) {
              // Try last viewed product as fallback
              if (session.lastViewedProduct) {
                const lvIds = await findCartProductByName(userId, session.lastViewedProductName || "");
                if (lvIds.length > 0) {
                  discountProductIds = lvIds;
                } else {
                  discountProductIds = [session.lastViewedProduct];
                }
              } else {
                responseText = "That item is not currently in your cart. Add it first, then ask me for a discount! 🛒";
                break;
              }
            }
          }
          // If productNames is empty → discountProductIds stays null → discount ALL cart items

          const discountResult = await applyDiscountToCart(userId, discountProductIds);

          if (discountResult.success) {
            const d = discountResult.data;
            responseCards = [
              {
                type: "discount_applied",
                items: d.items,
                totalSavings: d.totalSavings,
                newCartTotal: d.newCartTotal,
                subtotal: d.subtotal,
                deliveryFee: d.deliveryFee,
              },
            ];
            if (!responseText) {
              responseText = `Great news! 🎉 I've applied a special discount for you — you're saving **$${d.totalSavings.toFixed(2)}**!`;
            }
          } else {
            if (discountResult.alreadyDiscounted) {
              responseText = discountResult.message;
            } else {
              responseText = discountResult.message || "Couldn't apply a discount right now.";
            }
          }
          break;
        }

        // ── No action / general chat ──
        case "none":
        default: {
          // Smart fallback: if AI returned "none" but user/AI text hints at products,
          // try to find and show matching products automatically
          const msgLower = message.trim().toLowerCase();
          const aiTextLower = (responseText || "").toLowerCase();
          const combinedText = `${msgLower} ${aiTextLower}`;

          // Check if the text mentions product-related words like "here are", "showing", "browse"
          const looksLikeProductResponse = /here are|take a look|browse|showing|check out these|our .*(collection|products)/i.test(responseText);
          const userAskingForProducts = /show|any |do you have|looking for|want to see|browse/i.test(message);

          if ((looksLikeProductResponse || userAskingForProducts) && responseCards.length === 0) {
            // Try subcategory match
            const allSubcategories = [...new Set(products.map((p) => (p.subCategoryName || "").toLowerCase()).filter(Boolean))];
            let matchedProducts = [];

            for (const sub of allSubcategories) {
              const subSingular = sub.replace(/s$/, "");
              if (combinedText.includes(sub) || combinedText.includes(subSingular)) {
                const subProducts = products.filter(
                  (pr) => (pr.subCategoryName || "").toLowerCase() === sub
                );
                matchedProducts.push(...subProducts);
              }
            }

            // Try category match
            if (matchedProducts.length === 0) {
              const allCategories = [...new Set(products.map((p) => (p.categoryName || "").toLowerCase()).filter(Boolean))];
              for (const cat of allCategories) {
                const catSingular = cat.replace(/s$/, "");
                if (combinedText.includes(cat) || combinedText.includes(catSingular)) {
                  const catProducts = products.filter(
                    (pr) => (pr.categoryName || "").toLowerCase() === cat
                  );
                  matchedProducts.push(...catProducts);
                }
              }
            }

            // Try product name keywords
            if (matchedProducts.length === 0) {
              const words = msgLower.split(/\s+/).filter((w) => w.length > 2 && !["any","the","and","show","have","want","see","can","you","your","our","some","all","please"].includes(w));
              for (const word of words) {
                const nameMatches = products.filter((pr) =>
                  (pr.name || "").toLowerCase().includes(word) ||
                  (pr.subCategoryName || "").toLowerCase().includes(word) ||
                  (pr.categoryName || "").toLowerCase().includes(word)
                );
                matchedProducts.push(...nameMatches);
              }
            }

            // Dedupe and limit
            if (matchedProducts.length > 0) {
              const seen = new Set();
              const uniqueProducts = matchedProducts.filter((p) => {
                const id = p._id.toString();
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
              }).slice(0, 5);

              console.log(`[Chatbot] action:none fallback: found ${uniqueProducts.length} product(s) from keywords`);
              responseCards = [{
                type: "product_card",
                items: uniqueProducts.map((p) => ({
                  id: p._id.toString(),
                  name: p.name,
                  description: (p.description || "").substring(0, 80),
                  price: `$${p.basePrice}`,
                  image: p.images?.[0]?.url || "",
                  url: `/product/${p._id}`,
                })),
              }];
            }

            // If we searched but found nothing, override AI text with honest message
            if (responseCards.length === 0 && (looksLikeProductResponse || userAskingForProducts)) {
              const searchTerms = msgLower.replace(/show|any |do you have|products?|items?|in|the|and|or|me|please|i want|looking for/gi, "").trim();
              if (searchTerms) {
                responseText = `Sorry, we don't have any **${searchTerms}** products available right now. You can browse our [full collection](/collection) to see what's in stock! 🛍️`;
              }
            }
          }
          break;
        }
      }
    }

    // ── Legacy: enrich old-format product cards from parsed.cards ──
    if (parsed.cards.length > 0 && responseCards.length === 0) {
      for (const card of parsed.cards) {
        if (card.type === "product_card") {
          for (const item of card.items) {
            const product = products.find((p) => p._id.toString() === item.id);
            if (product) {
              item.image = product.images?.[0]?.url || item.image || "";
              item.price = `$${product.basePrice}`;
              item.url = `/product/${product._id}`;
            }
          }
        }
        responseCards.push(card);
      }
    }

    // ── Fallback: if no text and no cards, use fallback message ──
    if (!responseText && responseCards.length === 0) {
      responseText = "I didn't quite catch that. For any questions or assistance, feel free to email us at contact@intellicart.com and we'll be happy to help! 😊";
    }

    // ── Save conversation history (keep last 10 turns = 20 entries max) ──
    if (!session.conversationHistory) session.conversationHistory = [];
    session.conversationHistory.push({ role: "user", text: message.trim() });
    session.conversationHistory.push({ role: "model", text: responseText || "(showed cards)" });
    // Cap history to prevent token bloat (keep last 20 entries = 10 turns)
    if (session.conversationHistory.length > 20) {
      session.conversationHistory = session.conversationHistory.slice(-20);
    }

    return res.json({
      success: true,
      response: {
        text: responseText,
        cards: responseCards,
      },
    });
  } catch (error) {
    console.error("Chatbot error:", error.message);
    console.error("Chatbot error stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Sorry, I'm having trouble processing your request right now. Please try again.",
    });
  }
};

// ═══════════════════════════════════════
// GET /api/chatbot/greeting
// ═══════════════════════════════════════
const getGreeting = async (req, res) => {
  try {
    const { token } = req.headers;
    const user = await extractUser(token);
    const userName = user?.name || null;

    const greeting = userName
      ? `Hi ${userName}! 👋 I'm IntelliCart, your personal shopping assistant. I can help you browse products, check sizes & colors, add items to your cart, and even place orders — all right here! What can I help you with?`
      : "Hello! 👋 I'm IntelliCart, your personal shopping assistant. I can help you discover products and browse our collections. Log in to unlock cart & checkout features! How can I help you today?";

    return res.json({ success: true, greeting, userName });
  } catch (error) {
    console.error("Greeting error:", error.message);
    return res.json({
      success: true,
      greeting: "Hello! 👋 I'm IntelliCart, your personal shopping assistant. How can I help you today?",
      userName: null,
    });
  }
};

export { sendMessage, getGreeting };
