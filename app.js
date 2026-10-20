
const qs = (s, root=document) => root.querySelector(s);
const qsa = (s, root=document) => [...root.querySelectorAll(s)];

function readCart(){
  try {
    const cart = JSON.parse(localStorage.getItem("maxshop.cart") || "null");
    if(cart && cart.price === 1290 && Number.isSafeInteger(cart.qty) && cart.qty >= 1 && cart.qty <= 99)
      return {name:'Кит «Иммортал»', price:1290, qty:cart.qty};
  } catch {}
  return {name:'Кит «Иммортал»', price:1290, qty:1};
}
const currencies = ["TON", "USDT TON", "USDT TRON"];
const themes = ["achromatic", "chromatic", "triad"];
const savedStep = Number(localStorage.getItem("maxshop.checkoutStep") || 1);
const state = {
  cart: readCart(),
  checkoutStep: Number.isInteger(savedStep) && savedStep >= 1 && savedStep <= 5 ? savedStep : 1,
  currency: currencies.includes(localStorage.getItem("maxshop.currency")) ? localStorage.getItem("maxshop.currency") : "TON",
  paid: localStorage.getItem("maxshop.paid") === "1",
  theme: themes.includes(localStorage.getItem("maxshop.theme")) ? localStorage.getItem("maxshop.theme") : "chromatic"
};

function save() {
  localStorage.setItem("maxshop.cart", JSON.stringify(state.cart));
  localStorage.setItem("maxshop.checkoutStep", String(state.checkoutStep));
  localStorage.setItem("maxshop.currency", state.currency);
  localStorage.setItem("maxshop.paid", state.paid ? "1" : "0");
  localStorage.setItem("maxshop.theme", state.theme);
}

function setTheme(theme){
  state.theme = theme;
  document.body.dataset.theme = theme;
  save();
}
window.setTheme = setTheme;

function money(v){ return new Intl.NumberFormat("ru-RU").format(v) + " ₽"; }

function addToCart(){
  state.cart = {name:'Кит «Иммортал»', price:1290, qty:1};
  state.checkoutStep = 1;
  state.paid = false;
  save();
  location.href = "checkout.html";
}
window.addToCart = addToCart;

function renderCheckout(){
  const wrap = qs("[data-checkout]");
  if(!wrap) return;
  const total = state.cart.price * state.cart.qty;

  qsa("[data-step]").forEach(el => el.classList.toggle("active", Number(el.dataset.step)===state.checkoutStep));
  qsa("[data-stepdot]").forEach(el => el.classList.toggle("active", Number(el.dataset.stepdot)<=state.checkoutStep));

  qsa("[data-cart-name]").forEach(el=>el.textContent=state.cart.name);
  qsa("[data-cart-price]").forEach(el=>el.textContent=money(state.cart.price));
  qsa("[data-cart-total]").forEach(el=>el.textContent=money(total));
  qsa("[data-qty]").forEach(el=>el.textContent=state.cart.qty);

  const checkButton = qs("#checkPaymentBtn");
  if(checkButton){ checkButton.disabled = false; checkButton.textContent = "Проверить оплату"; }
  const selected = qs(`[data-currency="${state.currency}"]`);
  qsa("[data-currency]").forEach(el=>el.classList.remove("selected"));
  if(selected) selected.classList.add("selected");
}
function setStep(n){
  if(n === 3){
    const nickname = qs("#nickname");
    if(nickname && !nickname.reportValidity()) return;
    if(nickname) localStorage.setItem("maxshop.nickname", nickname.value.trim());
  }
  state.checkoutStep=n; save(); renderCheckout(); window.scrollTo({top:0,behavior:"smooth"}); }
window.setStep=setStep;

function qty(delta){
  state.cart.qty=Math.min(99,Math.max(1,state.cart.qty+delta)); save(); renderCheckout();
}
window.qty=qty;

function chooseCurrency(c){
  state.currency=c; save(); renderCheckout();
}
window.chooseCurrency=chooseCurrency;

function goPayment(){
  if(!state.currency) state.currency="TON";
  state.checkoutStep=4;
  save();
  renderCheckout();
  renderPayment();
  window.scrollTo({top:0,behavior:"smooth"});
}
window.goPayment=goPayment;

function renderPayment(){
  const wrap=qs("[data-payment]");
  if(!wrap) return;
  qsa("[data-currency-label]").forEach(el=>el.textContent=state.currency);
  const amountMap={
    "TON": (5 * state.cart.qty + 0.000013).toFixed(6) + " TON",
    "USDT TON": (10 * state.cart.qty + 0.013).toFixed(3) + " USDT",
    "USDT TRON": (10 * state.cart.qty + 0.027).toFixed(3) + " USDT"
  };
  const addressMap={"TON":"12345abcd","USDT TON":"67890efgh","USDT TRON":"24680ijkl"};
  qsa("[data-exact-amount]").forEach(el=>el.value=amountMap[state.currency]||amountMap.TON);
  qsa("[data-wallet-address]").forEach(el=>el.value=addressMap[state.currency]||addressMap.TON);

}
async function copyField(id, btn){
  const el=document.getElementById(id); if(!el) return;
  try{ await navigator.clipboard.writeText(el.value); btn.textContent="Скопировано ✓"; setTimeout(()=>btn.textContent="Копировать",1200); }
  catch{ el.select(); document.execCommand("copy"); }
}
window.copyField=copyField;

function confirmPayment(){
  const btn=qs("#checkPaymentBtn");
  if(btn){ btn.disabled=true; btn.textContent="Проверяем оплату…"; }
  setTimeout(()=>{
    state.paid=true;
    state.checkoutStep=5;
    save();
    renderCheckout();
    renderPayment();
    window.scrollTo({top:0,behavior:"smooth"});
  },1100);
}
window.confirmPayment=confirmPayment;

document.addEventListener("DOMContentLoaded",()=>{
  document.body.dataset.theme=state.theme;
  const nickname = qs("#nickname");
  if(nickname) nickname.value = localStorage.getItem("maxshop.nickname") || "MaxPlayer";
  const search = qs("#search");
  let category = "Все";
  function filterCatalog(){
    const query = search.value.trim().toLocaleLowerCase("ru");
    qsa(".product-card").forEach(card => {
      const inCategory = category === "Все" || (category === "Minecraft / DexLand" ? card.parentElement.id === "minecraft" : card.parentElement.id === "programming");
      card.hidden = !inCategory || !card.textContent.toLocaleLowerCase("ru").includes(query);
    });
    const empty = qs("#emptySearch");
    if(empty) empty.hidden = qsa(".product-card").some(card => !card.hidden);
  }
  if(search){
    search.addEventListener("input", filterCatalog);
    qsa(".chip").forEach(button => button.addEventListener("click", () => {
      category = button.textContent;
      qsa(".chip").forEach(chip => chip.classList.toggle("active", chip === button));
      filterCatalog();
    }));
  }
  renderCheckout();
  renderPayment();
});
